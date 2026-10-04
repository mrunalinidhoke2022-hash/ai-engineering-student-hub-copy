import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const API = 'https://api.github.com';
const MAX_REPOS = 8;
const COMMITS_PER_REPO = 8;
const MAX_FEED = 40;
const REPO_PATTERN = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

const githubHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'DEVLAUNCH'
});

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action === 'repos' ? 'repos' : 'commits';

    // The repository list is read with the app owner's own GitHub account, so only an admin
    // may ask for it. The picker is admin-only in the UI, and the server check must match it
    // rather than trust it.
    if (action === 'repos' && user.role !== 'admin') {
      return Response.json({ error: 'Admins only' }, { status: 403 });
    }

    // GitHub is connected as the app owner's account, so every read here uses that one
    // token and the browser never sees it.
    let accessToken = '';
    try {
      const connection = await base44.asServiceRole.connectors.getConnection('github');
      accessToken = connection?.accessToken || '';
    } catch (error) {
      accessToken = '';
    }
    if (!accessToken) return Response.json({ error: 'not_connected' });

    if (action === 'repos') {
      const response = await fetch(
        `${API}/user/repos?per_page=100&sort=pushed&direction=desc&affiliation=owner,collaborator,organization_member`,
        { headers: githubHeaders(accessToken) }
      );
      if (!response.ok) return Response.json({ error: 'github_error' });

      const data = await response.json();
      const repos = (Array.isArray(data) ? data : [])
        .filter((repo) => REPO_PATTERN.test(String(repo?.full_name || '')))
        .map((repo) => ({
          full_name: repo.full_name,
          name: repo.name,
          owner: repo.owner?.login || '',
          private: !!repo.private,
          html_url: repo.html_url,
          description: repo.description || '',
          pushed_at: repo.pushed_at || ''
        }));
      return Response.json({ repos });
    }

    // Only repositories the owner explicitly selected are read, and always from the stored
    // record - the caller can never name an arbitrary repository.
    const page = await base44.asServiceRole.entities.RepoWatch.filter({ enabled: true }, { limit: MAX_REPOS });
    const watches = (page?.items || [])
      .filter((watch) => REPO_PATTERN.test(String(watch.full_name || '')))
      .slice(0, MAX_REPOS);
    if (!watches.length) return Response.json({ commits: [], repos: [] });

    const lists = await Promise.all(
      watches.map(async (watch) => {
        const response = await fetch(`${API}/repos/${watch.full_name}/commits?per_page=${COMMITS_PER_REPO}`, {
          headers: githubHeaders(accessToken)
        });
        if (!response.ok) return [];

        const data = await response.json();
        return (Array.isArray(data) ? data : []).map((commit) => ({
          id: `${watch.full_name}-${commit.sha}`,
          sha: commit.sha || '',
          short_sha: String(commit.sha || '').slice(0, 7),
          message: String(commit.commit?.message || '').split('\n')[0].slice(0, 200),
          author_name: commit.commit?.author?.name || commit.author?.login || 'Unknown',
          avatar_url: commit.author?.avatar_url || '',
          date: commit.commit?.author?.date || '',
          html_url: commit.html_url || '',
          repo: watch.full_name
        }));
      })
    );

    const commits = lists
      .flat()
      .filter((commit) => commit.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)))
      .slice(0, MAX_FEED);

    return Response.json({
      commits,
      repos: watches.map((watch) => ({ full_name: watch.full_name, html_url: watch.html_url || '' }))
    });
  } catch (error) {
    return Response.json({ error: 'github_error' }, { status: 500 });
  }
}