import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import GitHubCommitFeed from "@/components/workspace/GitHubCommitFeed";
import TeamCard from "@/components/workspace/TeamCard";
import TeamFormDialog from "@/components/workspace/TeamFormDialog";
import TeamMembersPanel from "@/components/workspace/TeamMembersPanel";
import TeamRoadmapPanel from "@/components/workspace/TeamRoadmapPanel";
import TeamActivityFeed from "@/components/workspace/TeamActivityFeed";
import TeamKanbanBoard from "@/components/workspace/TeamKanbanBoard";
import TeamProgressSummary from "@/components/workspace/TeamProgressSummary";
import PullToRefresh from "@/components/common/PullToRefresh";

export default function Workspace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [myTeams, setMyTeams] = useState([]);
  const [otherTeams, setOtherTeams] = useState([]);
  const [activeTeam, setActiveTeam] = useState(null);
  const [myRoadmaps, setMyRoadmaps] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [taskPulse, setTaskPulse] = useState(0);

  const loadTeams = async () => {
    const [mine, others] = await Promise.all([
      base44.entities.Team.filter({ members: user.id }, { sort: "-updated_date", limit: 30 }),
      base44.entities.Team.filter({ members: { $ne: user.id } }, { sort: "-created_date", limit: 30 }),
    ]);
    setMyTeams(mine.items);
    setOtherTeams(others.items);
    return mine.items;
  };

  const openTeam = async (teamId) => {
    const team = await base44.entities.Team.get(teamId);
    setActiveTeam(team);
  };

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      const [mine, roadmaps] = await Promise.all([
        loadTeams(),
        base44.entities.ProjectRoadmap.filter({}, { sort: "-created_date", limit: 30, fields: ["idea"] }),
      ]);
      if (!active) return;
      setMyRoadmaps(roadmaps.items);
      setLoading(false);
      if (mine[0]) openTeam(mine[0].id);
    })();
    return () => {
      active = false;
    };
  }, [user?.id]);

  const joinTeam = async (teamId) => {
    setBusyId(teamId);
    const { data } = await base44.functions.invoke("teamActions", { action: "join", team_id: teamId });
    if (data?.error) {
      toast({ description: data.error, variant: "destructive" });
    } else {
      await loadTeams();
      await openTeam(teamId);
    }
    setBusyId(null);
  };

  const leaveTeam = async () => {
    if (!activeTeam) return;
    setBusyId(activeTeam.id);
    const { data } = await base44.functions.invoke("teamActions", { action: "leave", team_id: activeTeam.id });
    if (data?.error) {
      toast({ description: data.error, variant: "destructive" });
    } else {
      const mine = await loadTeams();
      setActiveTeam(null);
      if (mine[0]) await openTeam(mine[0].id);
    }
    setBusyId(null);
  };

  const addMember = async (email) => {
    if (!activeTeam) return false;
    const { data } = await base44.functions.invoke("teamActions", {
      action: "add_member",
      team_id: activeTeam.id,
      email,
    });
    if (data?.error) {
      toast({ description: data.error, variant: "destructive" });
      return false;
    }
    await loadTeams();
    await openTeam(activeTeam.id);
    toast({ description: `${data?.name || "Your classmate"} can now work on this team.` });
    return true;
  };

  const shareRoadmap = async (roadmapId) => {
    if (!activeTeam) return;
    const { data } = await base44.functions.invoke("teamActions", {
      action: "share_roadmap",
      team_id: activeTeam.id,
      roadmap_id: roadmapId,
    });
    if (data?.error) {
      toast({ description: data.error, variant: "destructive" });
      return;
    }
    await openTeam(activeTeam.id);
    toast({ description: "Roadmap shared with your team." });
  };

  const saveRoadmapFeatures = async (features) => {
    if (!activeTeam) return;
    const { data } = await base44.functions.invoke("teamActions", {
      action: "save_roadmap",
      team_id: activeTeam.id,
      title: activeTeam.roadmap_title || activeTeam.name,
      problem: activeTeam.roadmap_problem || "",
      features,
    });
    if (data?.error) {
      toast({ description: data.error, variant: "destructive" });
      return;
    }
    await openTeam(activeTeam.id);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 text-sm text-muted-foreground">
        Loading your workspace...
      </div>
    );
  }

  const isMember = (team) => (team?.members || []).includes(user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <PullToRefresh onRefresh={loadTeams} />
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading font-extrabold text-3xl">Team Workspace</h1>
          <p className="text-muted-foreground mt-1">
            Form a team, work from one shared project roadmap, and track what everyone is doing.
          </p>
        </div>
        <Button className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="w-4 h-4" /> New team
        </Button>
      </div>

      <GitHubCommitFeed />

      <section className="mt-8">
        <h2 className="font-heading font-bold text-lg">Your teams</h2>
        {myTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">
            You're not on a team yet — create one above or join a team looking for members.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {myTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isMember
                active={activeTeam?.id === team.id}
                busy={busyId === team.id}
                onOpen={openTeam}
                onJoin={joinTeam}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-heading font-bold text-lg">Teams looking for members</h2>
        {otherTeams.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-2">No other teams right now. Start one and invite your classmates.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-3">
            {otherTeams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                isMember={false}
                busy={busyId === team.id}
                onOpen={openTeam}
                onJoin={joinTeam}
              />
            ))}
          </div>
        )}
      </section>

      {activeTeam && (
        <section className="mt-10 border-t border-border pt-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{activeTeam.focus}</p>
              <h2 className="font-heading font-extrabold text-2xl mt-1">{activeTeam.name}</h2>
              {activeTeam.goal && <p className="text-sm text-muted-foreground mt-1">Goal: {activeTeam.goal}</p>}
            </div>
            {isMember(activeTeam) && (
              <Button variant="outline" size="sm" disabled={busyId === activeTeam.id} onClick={leaveTeam}>
                Leave team
              </Button>
            )}
          </div>

          {isMember(activeTeam) && (
            <div className="mt-6 space-y-5">
              <TeamProgressSummary team={activeTeam} refreshKey={taskPulse} />
              <TeamKanbanBoard team={activeTeam} onChanged={() => setTaskPulse((value) => value + 1)} />
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-5 mt-6">
            <div className="lg:col-span-2 space-y-5">
              <TeamRoadmapPanel
                team={activeTeam}
                isMember={isMember(activeTeam)}
                myRoadmaps={myRoadmaps}
                onShare={shareRoadmap}
                onSaveFeatures={saveRoadmapFeatures}
              />
              <TeamActivityFeed teamId={activeTeam.id} canPost={isMember(activeTeam)} />
            </div>
            <TeamMembersPanel team={activeTeam} canAdd={isMember(activeTeam)} onAddMember={addMember} />
          </div>
        </section>
      )}

      <TeamFormDialog
        open={creating}
        onOpenChange={setCreating}
        user={user}
        onCreated={async (team) => {
          setCreating(false);
          await loadTeams();
          await openTeam(team.id);
          toast({ description: "Team created — share it with your classmates." });
        }}
      />
    </div>
  );
}