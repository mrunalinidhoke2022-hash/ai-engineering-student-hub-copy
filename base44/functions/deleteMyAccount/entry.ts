import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

/**
 * Removes the signed-in student's own data: identity profile, saved
 * toolkit, learning progress and generated project roadmaps.
 * Only ever touches records belonging to the caller.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const accountId = user.id;
    const service = base44.asServiceRole;

    const profiles = await service.entities.StudentProfile.filter(
      { account_id: accountId },
      { limit: 50, fields: ['id'] }
    );
    const profileIds = profiles.items.map((record) => record.id);

    const removed = { profiles: 0, bookmarks: 0, progress: 0, roadmaps: 0 };

    if (profileIds.length) {
      const result = await service.entities.StudentProfile.deleteMany({ id: { $in: profileIds } });
      removed.profiles = result?.deleted ?? profileIds.length;
    }

    const results = await Promise.all([
      service.entities.Bookmark.deleteMany({ created_by_id: accountId }),
      service.entities.Progress.deleteMany({ created_by_id: accountId }),
      service.entities.ProjectRoadmap.deleteMany({ created_by_id: accountId }),
    ]);

    removed.bookmarks = results[0]?.deleted ?? 0;
    removed.progress = results[1]?.deleted ?? 0;
    removed.roadmaps = results[2]?.deleted ?? 0;

    return Response.json({ success: true, removed });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}