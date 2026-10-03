import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normalizeEmail } from '../../shared/identity.ts';

const TASK_STATUSES = ['todo', 'in_progress', 'completed'];
const MAX_MEMBERS = 8;
const MAX_FEATURES = 8;
const MAX_STEPS = 8;
const MAX_TECH = 10;

const clean = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const asList = (value: unknown, max: number) =>
  Array.isArray(value) ? value.map((item) => clean(item, 160)).filter(Boolean).slice(0, max) : [];

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = clean(body?.action, 30);
    const teamId = clean(body?.team_id, 60);
    if (!teamId) return Response.json({ error: 'Team not specified.' });

    // Membership is stored on the team record, so members cannot write it under RLS.
    // Everything here is validated against the signed-in user before the service role writes.
    const team = await base44.asServiceRole.entities.Team.get(teamId).catch(() => null);
    if (!team) return Response.json({ error: 'This team no longer exists.' });

    const members = Array.isArray(team.members) ? team.members : [];
    const memberNames = Array.isArray(team.member_names) ? team.member_names : [];
    const isMember = members.includes(user.id);
    const displayName = clean(user.full_name, 80) || clean(user.email, 80) || 'A teammate';

    if (action === 'join') {
      if (isMember) return Response.json({ ok: true, joined: true });
      if (members.length >= MAX_MEMBERS) {
        return Response.json({ error: `This team is full (${MAX_MEMBERS} members).` });
      }
      await base44.asServiceRole.entities.Team.update(teamId, {
        members: [...members, user.id],
        member_names: [...memberNames, displayName]
      });
      // Task and comment access is scoped by the member list stored on each record.
      await base44.asServiceRole.entities.TeamTask.updateMany(
        { team_id: teamId },
        { $addToSet: { team_members: user.id } }
      );
      await base44.asServiceRole.entities.TaskComment.updateMany(
        { team_id: teamId },
        { $addToSet: { team_members: user.id } }
      );
      await base44.asServiceRole.entities.TeamUpdate.create({
        team_id: teamId,
        kind: 'joined',
        author_name: displayName,
        message: `${displayName} joined the team`
      });
      return Response.json({ ok: true, joined: true });
    }

    if (!isMember) return Response.json({ error: 'Join this team first.' });

    if (action === 'leave') {
      const index = members.indexOf(user.id);
      await base44.asServiceRole.entities.Team.update(teamId, {
        members: members.filter((id) => id !== user.id),
        member_names: memberNames.filter((_, position) => position !== index)
      });
      // Comments carry the same member snapshot as tasks, so leaving must strip the member
      // here too — otherwise their ID stays embedded in every comment written while they were
      // a member and the read rule keeps granting them the team's discussion.
      await base44.asServiceRole.entities.TeamTask.updateMany(
        { team_id: teamId },
        { $pull: { team_members: user.id } }
      );
      await base44.asServiceRole.entities.TaskComment.updateMany(
        { team_id: teamId },
        { $pull: { team_members: user.id } }
      );
      await base44.asServiceRole.entities.TeamUpdate.create({
        team_id: teamId,
        kind: 'left',
        author_name: displayName,
        message: `${displayName} left the team`
      });
      return Response.json({ ok: true, left: true });
    }

    // Members pull classmates onto the team by the email they registered with.
    if (action === 'add_member') {
      const email = normalizeEmail(clean(body?.email, 120));
      if (!email || !email.includes('@')) {
        return Response.json({ error: 'Enter the email your classmate registered with.' });
      }
      if (members.length >= MAX_MEMBERS) {
        return Response.json({ error: `This team is full (${MAX_MEMBERS} members).` });
      }

      const found = await base44.asServiceRole.entities.StudentProfile.filter({ email_key: email }, { limit: 1 });
      const profile = found?.items?.[0];
      if (!profile?.account_id) {
        return Response.json({ error: 'No student found with that email. Ask them to register first.' });
      }
      if (members.includes(profile.account_id)) {
        return Response.json({ error: 'They are already on this team.' });
      }

      const teammateName = clean(profile.full_name, 80) || clean(profile.email, 80) || 'Teammate';
      await base44.asServiceRole.entities.Team.update(teamId, {
        members: [...members, profile.account_id],
        member_names: [...memberNames, teammateName]
      });
      // Task and comment access is scoped by the member list stored on each record.
      await base44.asServiceRole.entities.TeamTask.updateMany(
        { team_id: teamId },
        { $addToSet: { team_members: profile.account_id } }
      );
      await base44.asServiceRole.entities.TaskComment.updateMany(
        { team_id: teamId },
        { $addToSet: { team_members: profile.account_id } }
      );
      await base44.asServiceRole.entities.TeamUpdate.create({
        team_id: teamId,
        kind: 'joined',
        author_name: displayName,
        message: `${displayName} added ${teammateName} to the team`
      });
      return Response.json({ ok: true, added: true, name: teammateName });
    }

    if (action === 'share_roadmap') {
      const roadmapId = clean(body?.roadmap_id, 60);
      if (!roadmapId) return Response.json({ error: 'Choose a roadmap to share.' });

      const roadmap = await base44.asServiceRole.entities.ProjectRoadmap.get(roadmapId).catch(() => null);
      if (!roadmap) return Response.json({ error: 'That roadmap could not be found.' });
      if (roadmap.created_by_id !== user.id) {
        return Response.json({ error: 'You can only share a roadmap you created.' });
      }

      const title = clean(roadmap.idea, 120) || 'Team project';
      await base44.asServiceRole.entities.Team.update(teamId, {
        roadmap_title: title,
        roadmap_problem: clean(roadmap.problem_definition, 1000),
        roadmap_features: asList(roadmap.features, MAX_FEATURES),
        roadmap_tech: asList(roadmap.tech_stack, MAX_TECH),
        roadmap_steps: asList(roadmap.development_steps, MAX_STEPS),
        roadmap_shared_by: displayName
      });
      await base44.asServiceRole.entities.TeamUpdate.create({
        team_id: teamId,
        kind: 'roadmap_shared',
        author_name: displayName,
        message: `${displayName} shared the roadmap "${title}" with the team`
      });
      return Response.json({ ok: true, shared: true, title });
    }

    // Members can build the team roadmap in the workspace without a Project Builder detour.
    if (action === 'save_roadmap') {
      const features = asList(body?.features, MAX_FEATURES);
      const problem = clean(body?.problem, 1000);
      if (!features.length && !problem) {
        return Response.json({ error: 'Add at least one feature first.' });
      }

      const title = clean(body?.title, 120) || clean(team.name, 120) || 'Team project';
      await base44.asServiceRole.entities.Team.update(teamId, {
        roadmap_title: title,
        roadmap_problem: problem,
        roadmap_features: features,
        roadmap_shared_by: displayName
      });
      await base44.asServiceRole.entities.TeamUpdate.create({
        team_id: teamId,
        kind: 'roadmap_shared',
        author_name: displayName,
        message: `${displayName} updated the team roadmap`
      });
      return Response.json({ ok: true, title });
    }

    // Task and comment writes go through here so membership and authorship are decided
    // server-side: a signed-in user can neither post into a team they are not on, nor choose
    // the name a post appears under.
    if (action === 'add_task') {
      const title = clean(body?.title, 200);
      if (!title) return Response.json({ error: 'Write a short task title first.' });

      const requested = clean(body?.status, 20);
      const assignee = clean(body?.assignee, 80);

      const created = await base44.asServiceRole.entities.TeamTask.create({
        team_id: teamId,
        title,
        status: TASK_STATUSES.includes(requested) ? requested : 'todo',
        assignee: memberNames.includes(assignee) ? assignee : '',
        created_by_name: displayName,
        team_members: members
      });
      return Response.json({ ok: true, task: created });
    }

    if (action === 'add_comment') {
      const taskId = clean(body?.task_id, 60);
      const message = clean(body?.message, 500);
      if (!taskId || !message) return Response.json({ error: 'Write a short comment first.' });

      const task = await base44.asServiceRole.entities.TeamTask.get(taskId).catch(() => null);
      if (!task || task.team_id !== teamId) {
        return Response.json({ error: 'That task is no longer on this board.' });
      }

      const created = await base44.asServiceRole.entities.TaskComment.create({
        team_id: teamId,
        task_id: taskId,
        message,
        author_name: displayName,
        author_id: user.id,
        team_members: members
      });
      return Response.json({ ok: true, comment: created });
    }

    if (action === 'post_update') {
      const message = clean(body?.message, 300);
      if (!message) return Response.json({ error: 'Write a short update first.' });
      await base44.asServiceRole.entities.TeamUpdate.create({
        team_id: teamId,
        kind: 'update',
        author_name: displayName,
        message
      });
      return Response.json({ ok: true, posted: true });
    }

    return Response.json({ error: 'Unsupported action.' });
  } catch (error) {
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}