// --- Direct Linear GraphQL (fallback) ---

export async function linearQuery(query, variables = {}) {
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
  return json.data;
}

// --- Cached data API (preferred, falls back to direct) ---

async function cachedFetch(url) {
  const res = await fetch(url);
  if (res.status === 503) return null; // cache not available — caller should fallback
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API returned ${res.status}`);
  }
  return res.json();
}

// --- Queries (kept for fallback + issue history) ---

const ISSUE_FIELDS = `
  id identifier title priority estimate completedAt
  assignee { id name avatarUrl }
  state { id name type }
  project { id name slugId }
  projectMilestone { id name }
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
  const cached = await cachedFetch("/api/data/teams");
  if (cached) return cached;
  return linearQuery(TEAMS_QUERY);
}

export async function fetchTeamData(teamId) {
  const cached = await cachedFetch(`/api/data/team/${teamId}`);
  if (cached) return cached;
  return linearQuery(TEAM_DATA_QUERY, { teamId });
}

export async function fetchCycleIssues(cycleId) {
  const cached = await cachedFetch(`/api/data/cycle/${cycleId}/issues`);
  if (cached) return cached;
  return linearQuery(CYCLE_ISSUES_QUERY, { cycleId });
}

export async function fetchBacklogIssues(teamId) {
  const cached = await cachedFetch(`/api/data/team/${teamId}/backlog`);
  if (cached) return cached;
  return linearQuery(BACKLOG_ISSUES_QUERY, { teamId });
}

export async function fetchProjects() {
  const cached = await cachedFetch("/api/data/projects");
  if (cached) return cached;
  return linearQuery(PROJECTS_QUERY);
}

export async function fetchProjectIssues(projectId) {
  const cached = await cachedFetch(`/api/data/project/${projectId}/issues`);
  if (cached) return cached;
  return linearQuery(PROJECT_ISSUES_QUERY, { projectId });
}

export async function refreshServerCache() {
  try {
    await fetch("/api/data/refresh", { method: "POST" });
  } catch {}
}
