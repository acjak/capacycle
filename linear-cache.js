// Server-side cache for Linear data.
// Fetches from Linear API on cache miss, serves from memory on hit.
// Webhook updates invalidate specific cache entries.

const ISSUE_FIELDS = `
  id identifier title priority estimate completedAt
  assignee { id name avatarUrl }
  state { id name type }
  project { id name slugId }
  projectMilestone { id name }
`;

const QUERIES = {
  teams: `query { teams { nodes { id name } } }`,

  teamData: `query TeamData($teamId: String!) {
    team(id: $teamId) {
      id name
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
  }`,

  cycleIssues: `query CycleIssues($cycleId: String!) {
    cycle(id: $cycleId) {
      issues {
        nodes {
          ${ISSUE_FIELDS}
          parent { id }
          children { nodes { ${ISSUE_FIELDS} } }
        }
      }
    }
  }`,

  backlogIssues: `query BacklogIssues($teamId: String!) {
    team(id: $teamId) {
      issues(filter: { state: { type: { nin: ["completed", "canceled"] } } }, first: 250) {
        nodes {
          ${ISSUE_FIELDS}
          parent { id }
          children { nodes { ${ISSUE_FIELDS} } }
        }
      }
    }
  }`,

  projects: `query AllProjects {
    projects {
      nodes {
        id name state progress startDate targetDate
        projectMilestones { nodes { id name sortOrder targetDate } }
      }
    }
  }`,

  projectIssues: `query ProjectIssues($projectId: String!) {
    project(id: $projectId) {
      issues(first: 250) {
        nodes {
          id estimate completedAt
          state { type }
          projectMilestone { id }
        }
      }
    }
  }`,
};

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export class LinearCache {
  constructor({ fetchFromLinear, ttl = DEFAULT_TTL }) {
    // fetchFromLinear(query, variables) → Promise<data>
    this._fetch = fetchFromLinear;
    this._ttl = ttl;
    this._cache = new Map(); // key → { data, timestamp }
    this._listeners = []; // onChange callbacks
  }

  onChange(fn) {
    this._listeners.push(fn);
  }

  _emit(event, payload) {
    for (const fn of this._listeners) {
      try { fn(event, payload); } catch {}
    }
  }

  _key(...parts) {
    return parts.join(":");
  }

  _get(key) {
    const entry = this._cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this._ttl) {
      this._cache.delete(key);
      return null;
    }
    return entry.data;
  }

  _set(key, data) {
    this._cache.set(key, { data, timestamp: Date.now() });
  }

  async _fetchAndCache(key, query, variables) {
    try {
      const data = await this._fetch(query, variables);
      this._set(key, data);
      return data;
    } catch (err) {
      // If cache has stale data, return it rather than failing
      const stale = this._cache.get(key);
      if (stale) return stale.data;
      throw err;
    }
  }

  async getTeams() {
    const key = "teams";
    const cached = this._get(key);
    if (cached) return cached;
    return this._fetchAndCache(key, QUERIES.teams, {});
  }

  async getTeamData(teamId) {
    const key = this._key("team", teamId);
    const cached = this._get(key);
    if (cached) return cached;
    return this._fetchAndCache(key, QUERIES.teamData, { teamId });
  }

  async getCycleIssues(cycleId) {
    const key = this._key("cycle-issues", cycleId);
    const cached = this._get(key);
    if (cached) return cached;
    return this._fetchAndCache(key, QUERIES.cycleIssues, { cycleId });
  }

  async getBacklogIssues(teamId) {
    const key = this._key("backlog", teamId);
    const cached = this._get(key);
    if (cached) return cached;
    return this._fetchAndCache(key, QUERIES.backlogIssues, { teamId });
  }

  async getProjects() {
    const key = "projects";
    const cached = this._get(key);
    if (cached) return cached;
    return this._fetchAndCache(key, QUERIES.projects, {});
  }

  async getProjectIssues(projectId) {
    const key = this._key("project-issues", projectId);
    const cached = this._get(key);
    if (cached) return cached;
    return this._fetchAndCache(key, QUERIES.projectIssues, { projectId });
  }

  // Invalidation methods — called by webhooks

  invalidateTeam(teamId) {
    this._cache.delete(this._key("team", teamId));
    // Also invalidate all cycle issues for this team (we don't track which cycles belong to which team,
    // so we invalidate all cycle caches — they'll refetch on next access)
    for (const key of this._cache.keys()) {
      if (key.startsWith("cycle-issues:") || key.startsWith("backlog:")) {
        this._cache.delete(key);
      }
    }
    this._emit("team-updated", { teamId });
  }

  invalidateIssues(teamId) {
    // Invalidate cycle issues and backlog for the team
    this._cache.delete(this._key("backlog", teamId));
    for (const key of this._cache.keys()) {
      if (key.startsWith("cycle-issues:")) {
        this._cache.delete(key);
      }
    }
    this._cache.delete("projects");
    for (const key of this._cache.keys()) {
      if (key.startsWith("project-issues:")) {
        this._cache.delete(key);
      }
    }
    this._emit("issues-updated", { teamId });
  }

  invalidateProjects() {
    this._cache.delete("projects");
    for (const key of this._cache.keys()) {
      if (key.startsWith("project-issues:")) {
        this._cache.delete(key);
      }
    }
    this._emit("projects-updated", {});
  }

  invalidateAll() {
    this._cache.clear();
    this._emit("all-updated", {});
  }

  // Force refresh a specific dataset
  async refreshTeams() {
    this._cache.delete("teams");
    return this.getTeams();
  }

  async refreshTeamData(teamId) {
    this._cache.delete(this._key("team", teamId));
    return this.getTeamData(teamId);
  }

  async refreshCycleIssues(cycleId) {
    this._cache.delete(this._key("cycle-issues", cycleId));
    return this.getCycleIssues(cycleId);
  }
}
