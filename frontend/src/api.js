// --- Demo mode ---

let _demoData = null;

export function setDemoMode(data) {
  _demoData = data;
}

export function isDemoMode() {
  return _demoData !== null;
}

export function getDemoData() {
  return _demoData;
}

// --- Direct Linear GraphQL (fallback) ---

export async function linearQuery(query, variables = {}) {
  // In demo mode, intercept issue history queries
  if (_demoData && query.includes("IssueHistory") && variables.issueId) {
    const hist = _demoData.issueHistories?.[variables.issueId];
    if (hist) return hist;
    return { issue: { id: variables.issueId, history: { nodes: [] } } };
  }
  const start = performance.now();
  const res = await fetch("/api/linear", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Linear API returned ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e) => e.message).join(", "));
  }
  recordFetch(Math.round(performance.now() - start), "direct");
  return json.data;
}

// --- Fetch stats tracking ---

const _fetchStats = {
  lastFetchTime: null,  // timestamp of last successful data fetch
  latencies: [],        // last N latencies in ms
  source: null,         // "cache" or "direct"
  listeners: new Set(),
};

export function onFetchStats(fn) {
  _fetchStats.listeners.add(fn);
  return () => _fetchStats.listeners.delete(fn);
}

export function getFetchStats() {
  const now = Date.now();
  const age = _fetchStats.lastFetchTime ? now - _fetchStats.lastFetchTime : null;
  const recent = _fetchStats.latencies.slice(-5);
  const avgLatency = recent.length > 0 ? Math.round(recent.reduce((s, v) => s + v, 0) / recent.length) : null;
  return { age, avgLatency, source: _fetchStats.source, lastFetchTime: _fetchStats.lastFetchTime };
}

function recordFetch(latencyMs, source) {
  _fetchStats.lastFetchTime = Date.now();
  _fetchStats.latencies.push(latencyMs);
  if (_fetchStats.latencies.length > 20) _fetchStats.latencies.shift();
  _fetchStats.source = source;
  for (const fn of _fetchStats.listeners) { try { fn(getFetchStats()); } catch {} }
}

// --- Cached data API (preferred, falls back to direct) ---

async function cachedFetch(url) {
  const start = performance.now();
  const res = await fetch(url);
  const latency = Math.round(performance.now() - start);
  if (res.status === 503) return null; // cache not available — caller should fallback
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  recordFetch(latency, "cache");
  return res.json();
}

// --- Queries (kept for fallback + issue history) ---

const ISSUE_FIELDS = `
  id identifier title priority estimate completedAt
  assignee { id name avatarUrl }
  state { id name type }
  project { id name slugId }
  projectMilestone { id name }
  labels { nodes { id name color } }
`;

export const TEAMS_QUERY = `query { teams { nodes { id name } } }`;

export const TEAM_DATA_QUERY = `
  query TeamData($teamId: String!) {
    team(id: $teamId) {
      id
      name
      members { nodes { id name displayName email avatarUrl } }
      states { nodes { id name type position } }
      cycles(orderBy: createdAt) {
        nodes {
          id number name startsAt endsAt completedAt progress
          scopeHistory completedScopeHistory
          issueCountHistory completedIssueCountHistory
          inProgressScopeHistory
        }
      }
    }
  }
`;

export const CYCLE_ISSUES_QUERY = `
  query CycleIssues($cycleId: String!) {
    cycle(id: $cycleId) {
      issues {
        nodes {
          ${ISSUE_FIELDS}
          parent { id }
          children {
            nodes {
              ${ISSUE_FIELDS}
            }
          }
        }
      }
    }
  }
`;

export const ISSUE_HISTORY_QUERY = `
  query IssueHistory($issueId: String!) {
    issue(id: $issueId) {
      id
      history {
        nodes {
          createdAt
          fromEstimate
          toEstimate
          fromState { type }
          toState { type }
        }
      }
    }
  }
`;

export const PROJECTS_QUERY = `
  query AllProjects {
    projects {
      nodes {
        id name state
        progress
        startDate targetDate
        projectMilestones {
          nodes {
            id name sortOrder targetDate
          }
        }
      }
    }
  }
`;

export const PROJECT_ISSUES_QUERY = `
  query ProjectIssues($projectId: String!) {
    project(id: $projectId) {
      issues(first: 250) {
        nodes {
          id estimate completedAt
          state { type }
          projectMilestone { id }
        }
      }
    }
  }
`;

export const BACKLOG_ISSUES_QUERY = `
  query BacklogIssues($teamId: String!) {
    team(id: $teamId) {
      issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 250) {
        nodes {
          ${ISSUE_FIELDS}
          parent { id }
          children {
            nodes {
              ${ISSUE_FIELDS}
            }
          }
        }
      }
    }
  }
`;

// --- High-level data fetchers (cache-first with fallback) ---

export async function fetchTeams() {
  if (_demoData) return _demoData.teams;
  const cached = await cachedFetch("/api/data/teams");
  if (cached) return cached;
  return linearQuery(TEAMS_QUERY);
}

export async function fetchTeamData(teamId) {
  if (_demoData) return _demoData.teamData;
  const cached = await cachedFetch(`/api/data/team/${teamId}`);
  if (cached) return cached;
  return linearQuery(TEAM_DATA_QUERY, { teamId });
}

export async function fetchCycleIssues(cycleId) {
  if (_demoData) {
    // Return per-cycle issues if available (for carry-over detection), fall back to current
    return _demoData.cycleIssueData?.[cycleId] || _demoData.cycleIssues;
  }
  const cached = await cachedFetch(`/api/data/cycle/${cycleId}/issues`);
  if (cached) return cached;
  return linearQuery(CYCLE_ISSUES_QUERY, { cycleId });
}

export async function fetchBacklogIssues(teamId) {
  if (_demoData) return _demoData.cycleIssues; // reuse cycle issues for demo
  const cached = await cachedFetch(`/api/data/team/${teamId}/backlog`);
  if (cached) return cached;
  return linearQuery(BACKLOG_ISSUES_QUERY, { teamId });
}

export async function fetchProjects() {
  if (_demoData) return _demoData.projects;
  const cached = await cachedFetch("/api/data/projects");
  if (cached) return cached;
  return linearQuery(PROJECTS_QUERY);
}

export async function fetchProjectIssues(projectId) {
  if (_demoData?.projectIssues?.[projectId]) return _demoData.projectIssues[projectId];
  const cached = await cachedFetch(`/api/data/project/${projectId}/issues`);
  if (cached) return cached;
  return linearQuery(PROJECT_ISSUES_QUERY, { projectId });
}

export async function refreshServerCache() {
  if (_demoData) return; // no-op in demo mode
  try {
    await fetch("/api/data/refresh", { method: "POST" });
  } catch {}
}
