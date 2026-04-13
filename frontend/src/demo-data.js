// Realistic demo data for the Capacycle demo mode.
// All data is self-contained — no Linear API calls needed.

const now = new Date();
const cycleStart = new Date(now);
cycleStart.setDate(cycleStart.getDate() - 8); // Started 8 days ago
const cycleEnd = new Date(cycleStart);
cycleEnd.setDate(cycleEnd.getDate() + 13); // 2-week cycle

const prevCycleEnd = new Date(cycleStart);
prevCycleEnd.setDate(prevCycleEnd.getDate() - 1);
const prevCycleStart = new Date(prevCycleEnd);
prevCycleStart.setDate(prevCycleStart.getDate() - 13);

const prevPrevEnd = new Date(prevCycleStart);
prevPrevEnd.setDate(prevPrevEnd.getDate() - 1);
const prevPrevStart = new Date(prevPrevEnd);
prevPrevStart.setDate(prevPrevEnd.getDate() - 13);

function isoDate(d) { return d.toISOString(); }

// Generate a realistic burndown scope history (daily values)
function makeScopeHistory(initial, days, driftPct) {
  const arr = [initial];
  for (let i = 1; i <= days; i++) {
    const drift = initial * (driftPct / 100) * (i / days);
    arr.push(Math.round(initial + drift));
  }
  return arr;
}

function makeCompletedHistory(total, days, completedDays) {
  const arr = [0];
  for (let i = 1; i <= days; i++) {
    if (i <= completedDays) {
      arr.push(Math.round(total * (i / days) * 0.85 + Math.random() * 2));
    } else {
      arr.push(arr[arr.length - 1]);
    }
  }
  return arr;
}

function makeIssueCountHistory(initial, days) {
  const arr = [initial];
  for (let i = 1; i <= days; i++) arr.push(initial + Math.floor(i / 4));
  return arr;
}

const TEAM_ID = "demo-team-1";
const CYCLE_ID = "demo-cycle-current";
const PREV_CYCLE_ID = "demo-cycle-prev";
const PREV_PREV_CYCLE_ID = "demo-cycle-prevprev";

const members = [
  { id: "m1", name: "Alice Chen", displayName: "Alice Chen", email: "alice@example.com", avatarUrl: null },
  { id: "m2", name: "Bob Martinez", displayName: "Bob Martinez", email: "bob@example.com", avatarUrl: null },
  { id: "m3", name: "Cara Johnson", displayName: "Cara Johnson", email: "cara@example.com", avatarUrl: null },
  { id: "m4", name: "David Kim", displayName: "David Kim", email: "david@example.com", avatarUrl: null },
  { id: "m5", name: "Emma Wilson", displayName: "Emma Wilson", email: "emma@example.com", avatarUrl: null },
];

const states = [
  { id: "s1", name: "Backlog", type: "backlog", position: 0 },
  { id: "s2", name: "Todo", type: "unstarted", position: 1 },
  { id: "s3", name: "In Progress", type: "started", position: 2 },
  { id: "s4", name: "In Review", type: "started", position: 3 },
  { id: "s5", name: "Done", type: "completed", position: 4 },
  { id: "s6", name: "Canceled", type: "canceled", position: 5 },
];

const projects = [
  { id: "proj-1", name: "User Dashboard", slugId: "user-dashboard", state: "started", progress: 0.6, startDate: "2026-01-15", targetDate: "2026-06-30" },
  { id: "proj-2", name: "API v2", slugId: "api-v2", state: "started", progress: 0.35, startDate: "2026-02-01", targetDate: "2026-07-15" },
  { id: "proj-3", name: "Mobile App", slugId: "mobile-app", state: "started", progress: 0.2, startDate: "2026-03-01", targetDate: "2026-09-01" },
];

const milestones = {
  "proj-1": [
    { id: "ms-1a", name: "Settings page", sortOrder: 1, targetDate: "2026-04-30" },
    { id: "ms-1b", name: "Analytics widgets", sortOrder: 2, targetDate: "2026-05-31" },
  ],
  "proj-2": [
    { id: "ms-2a", name: "Auth endpoints", sortOrder: 1, targetDate: "2026-04-15" },
    { id: "ms-2b", name: "Rate limiting", sortOrder: 2, targetDate: "2026-05-15" },
  ],
  "proj-3": [
    { id: "ms-3a", name: "Onboarding flow", sortOrder: 1, targetDate: "2026-05-30" },
  ],
};

const labels = [
  { id: "l1", name: "bug", color: "#eb5757" },
  { id: "l2", name: "feature", color: "#6fcf97" },
  { id: "l3", name: "tech-debt", color: "#f2994a" },
  { id: "l4", name: "backend", color: "#2f80ed" },
  { id: "l5", name: "frontend", color: "#9b51e0" },
  { id: "l6", name: "infrastructure", color: "#828282" },
  { id: "l7", name: "ux", color: "#bb6bd9" },
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Generate issues with realistic variety
const issueTemplates = [
  // Project 1: User Dashboard — Settings page milestone
  { id: "i1", identifier: "ENG-142", title: "Add user preferences panel", priority: 2, estimate: 5, assignee: members[0], state: states[4], project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[1], labels[4]], completedAt: isoDate(new Date(now.getTime() - 3 * 86400000)) },
  { id: "i2", identifier: "ENG-143", title: "Implement notification settings", priority: 3, estimate: 3, assignee: members[1], state: states[4], project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[1], labels[4]], completedAt: isoDate(new Date(now.getTime() - 2 * 86400000)) },
  { id: "i3", identifier: "ENG-144", title: "Fix settings not persisting on refresh", priority: 1, estimate: 2, assignee: members[0], state: states[3], project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[0], labels[4]], completedAt: null },
  { id: "i4", identifier: "ENG-145", title: "Theme toggle accessibility", priority: 3, estimate: 1, assignee: members[2], state: states[4], project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[1], labels[6]], completedAt: isoDate(new Date(now.getTime() - 5 * 86400000)) },
  // Project 1: Analytics widgets milestone
  { id: "i5", identifier: "ENG-146", title: "Build chart component library", priority: 2, estimate: 8, assignee: members[3], state: states[2], project: projects[0], milestone: milestones["proj-1"][1], labels: [labels[1], labels[4]], completedAt: null },
  { id: "i6", identifier: "ENG-147", title: "Dashboard data aggregation endpoint", priority: 2, estimate: 5, assignee: members[4], state: states[2], project: projects[0], milestone: milestones["proj-1"][1], labels: [labels[1], labels[3]], completedAt: null },
  { id: "i7", identifier: "ENG-148", title: "Widget drag-and-drop layout", priority: 3, estimate: 3, assignee: members[2], state: states[1], project: projects[0], milestone: milestones["proj-1"][1], labels: [labels[1], labels[4]], completedAt: null },
  // Project 2: API v2 — Auth endpoints
  { id: "i8", identifier: "ENG-149", title: "OAuth2 token refresh flow", priority: 1, estimate: 5, assignee: members[1], state: states[2], project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[1], labels[3]], completedAt: null },
  { id: "i9", identifier: "ENG-150", title: "API key rotation endpoint", priority: 2, estimate: 3, assignee: members[4], state: states[4], project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[1], labels[3]], completedAt: isoDate(new Date(now.getTime() - 1 * 86400000)) },
  { id: "i10", identifier: "ENG-151", title: "Fix CORS headers for v2 routes", priority: 1, estimate: 1, assignee: members[0], state: states[4], project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[0], labels[3]], completedAt: isoDate(new Date(now.getTime() - 4 * 86400000)) },
  // Project 2: Rate limiting
  { id: "i11", identifier: "ENG-152", title: "Implement sliding window rate limiter", priority: 2, estimate: 5, assignee: members[3], state: states[1], project: projects[1], milestone: milestones["proj-2"][1], labels: [labels[1], labels[3], labels[5]], completedAt: null },
  { id: "i12", identifier: "ENG-153", title: "Rate limit dashboard UI", priority: 3, estimate: 3, assignee: members[2], state: states[1], project: projects[1], milestone: milestones["proj-2"][1], labels: [labels[1], labels[4]], completedAt: null },
  // Project 3: Mobile — Onboarding
  { id: "i13", identifier: "ENG-154", title: "Design onboarding screens", priority: 2, estimate: 3, assignee: members[2], state: states[4], project: projects[2], milestone: milestones["proj-3"][0], labels: [labels[1], labels[6]], completedAt: isoDate(new Date(now.getTime() - 6 * 86400000)) },
  { id: "i14", identifier: "ENG-155", title: "Implement swipe tutorial", priority: 3, estimate: 5, assignee: members[3], state: states[2], project: projects[2], milestone: milestones["proj-3"][0], labels: [labels[1], labels[4]], completedAt: null },
  // No project
  { id: "i15", identifier: "ENG-156", title: "Upgrade Node.js to v22", priority: 4, estimate: 2, assignee: members[4], state: states[4], project: null, milestone: null, labels: [labels[2], labels[5]], completedAt: isoDate(new Date(now.getTime() - 3 * 86400000)) },
  { id: "i16", identifier: "ENG-157", title: "Flaky test in auth module", priority: 1, estimate: 1, assignee: members[0], state: states[2], project: null, milestone: null, labels: [labels[0], labels[3]], completedAt: null },
  { id: "i17", identifier: "ENG-158", title: "Migrate legacy date parsing", priority: 3, estimate: 3, assignee: members[1], state: states[4], project: null, milestone: null, labels: [labels[2], labels[3]], completedAt: isoDate(new Date(now.getTime() - 2 * 86400000)) },
  { id: "i18", identifier: "ENG-159", title: "Add Sentry error boundaries", priority: 2, estimate: 2, assignee: members[4], state: states[1], project: null, milestone: null, labels: [labels[2], labels[4]], completedAt: null },
  { id: "i19", identifier: "ENG-160", title: "Database index optimization", priority: 3, estimate: 3, assignee: members[3], state: states[2], project: projects[1], milestone: null, labels: [labels[2], labels[3], labels[5]], completedAt: null },
  { id: "i20", identifier: "ENG-161", title: "Webhook retry mechanism", priority: 2, estimate: 5, assignee: members[1], state: states[1], project: projects[1], milestone: milestones["proj-2"][1], labels: [labels[1], labels[3]], completedAt: null },
];

function buildIssueNode(t) {
  return {
    id: t.id,
    identifier: t.identifier,
    title: t.title,
    priority: t.priority,
    estimate: t.estimate,
    completedAt: t.completedAt,
    assignee: t.assignee ? { id: t.assignee.id, name: t.assignee.name, avatarUrl: t.assignee.avatarUrl } : null,
    state: { id: t.state.id, name: t.state.name, type: t.state.type },
    project: t.project ? { id: t.project.id, name: t.project.name, slugId: t.project.slugId } : null,
    projectMilestone: t.milestone ? { id: t.milestone.id, name: t.milestone.name } : null,
    labels: { nodes: t.labels || [] },
    parent: null,
    children: { nodes: [] },
  };
}

// Generate issue history with realistic drift patterns
function buildIssueHistory(issue) {
  const cycleStartTime = cycleStart.getTime();
  const entries = [];

  // Some issues have estimate changes (drift)
  const driftChance = {
    bug: 0.6, feature: 0.3, "tech-debt": 0.5, backend: 0.35, frontend: 0.25,
    infrastructure: 0.7, ux: 0.2,
  };

  const labelNames = (issue.labels || []).map((l) => l.name);
  const hasDrift = labelNames.some((l) => Math.random() < (driftChance[l] || 0.2));

  if (issue.estimate && hasDrift) {
    const originalEstimate = Math.max(1, issue.estimate - Math.ceil(Math.random() * 3));
    // Set original estimate (before cycle)
    entries.push({
      createdAt: isoDate(new Date(cycleStartTime - 7 * 86400000)),
      fromEstimate: null, toEstimate: originalEstimate,
      fromState: null, toState: null,
    });
    // Estimate change during cycle
    if (originalEstimate !== issue.estimate) {
      entries.push({
        createdAt: isoDate(new Date(cycleStartTime + 3 * 86400000 + Math.random() * 4 * 86400000)),
        fromEstimate: originalEstimate, toEstimate: issue.estimate,
        fromState: null, toState: null,
      });
    }
  } else if (issue.estimate) {
    entries.push({
      createdAt: isoDate(new Date(cycleStartTime - 7 * 86400000)),
      fromEstimate: null, toEstimate: issue.estimate,
      fromState: null, toState: null,
    });
  }

  // State transitions
  if (issue.state.type === "started" || issue.state.type === "completed") {
    entries.push({
      createdAt: isoDate(new Date(cycleStartTime + Math.random() * 3 * 86400000)),
      fromEstimate: null, toEstimate: null,
      fromState: { type: "unstarted" }, toState: { type: "started" },
    });
  }
  if (issue.state.type === "completed") {
    entries.push({
      createdAt: issue.completedAt,
      fromEstimate: null, toEstimate: null,
      fromState: { type: "started" }, toState: { type: "completed" },
    });
  }

  return entries;
}

const totalEstimate = issueTemplates.reduce((s, i) => s + (i.estimate || 0), 0);
const doneEstimate = issueTemplates.filter((i) => i.state.type === "completed").reduce((s, i) => s + (i.estimate || 0), 0);

const currentCycleDays = 14;
const elapsed = 9;

export const demoTeams = {
  teams: { nodes: [{ id: TEAM_ID, name: "Engineering" }] },
};

export const demoTeamData = {
  team: {
    id: TEAM_ID,
    name: "Engineering",
    members: { nodes: members },
    states: { nodes: states },
    cycles: {
      nodes: [
        {
          id: PREV_PREV_CYCLE_ID, number: 22, name: null,
          startsAt: isoDate(prevPrevStart), endsAt: isoDate(prevPrevEnd),
          completedAt: isoDate(prevPrevEnd), progress: 1,
          scopeHistory: makeScopeHistory(52, 14, 8),
          completedScopeHistory: makeCompletedHistory(52, 14, 14),
          issueCountHistory: makeIssueCountHistory(18, 14),
          completedIssueCountHistory: makeCompletedHistory(18, 14, 14),
          inProgressScopeHistory: makeScopeHistory(0, 14, 0).map(() => 0),
        },
        {
          id: PREV_CYCLE_ID, number: 23, name: null,
          startsAt: isoDate(prevCycleStart), endsAt: isoDate(prevCycleEnd),
          completedAt: isoDate(prevCycleEnd), progress: 1,
          scopeHistory: makeScopeHistory(58, 14, 12),
          completedScopeHistory: makeCompletedHistory(58, 14, 14),
          issueCountHistory: makeIssueCountHistory(20, 14),
          completedIssueCountHistory: makeCompletedHistory(20, 14, 14),
          inProgressScopeHistory: makeScopeHistory(0, 14, 0).map(() => 0),
        },
        {
          id: CYCLE_ID, number: 24, name: null,
          startsAt: isoDate(cycleStart), endsAt: isoDate(cycleEnd),
          completedAt: null, progress: doneEstimate / totalEstimate,
          scopeHistory: makeScopeHistory(totalEstimate, elapsed, 6),
          completedScopeHistory: makeCompletedHistory(totalEstimate, elapsed, elapsed),
          issueCountHistory: makeIssueCountHistory(issueTemplates.length, elapsed),
          completedIssueCountHistory: makeCompletedHistory(issueTemplates.length, elapsed, elapsed),
          inProgressScopeHistory: makeScopeHistory(0, elapsed, 0).map((_, i) => Math.round(8 + Math.random() * 6)),
        },
      ],
    },
  },
};

export const demoCycleIssues = {
  cycle: {
    issues: {
      nodes: issueTemplates.map(buildIssueNode),
    },
  },
};

export const demoIssueHistories = {};
issueTemplates.forEach((t) => {
  demoIssueHistories[t.id] = {
    issue: {
      id: t.id,
      history: { nodes: buildIssueHistory(t) },
    },
  };
});

export const demoProjects = {
  projects: {
    nodes: projects.map((p) => ({
      ...p,
      projectMilestones: { nodes: milestones[p.id] || [] },
    })),
  },
};

export const demoProjectIssues = {};
projects.forEach((p) => {
  const projectIssueNodes = issueTemplates
    .filter((i) => i.project?.id === p.id)
    .map((i) => ({
      id: i.id, estimate: i.estimate, completedAt: i.completedAt,
      state: { type: i.state.type },
      projectMilestone: i.milestone ? { id: i.milestone.id } : null,
    }));
  demoProjectIssues[p.id] = {
    project: { issues: { nodes: projectIssueNodes } },
  };
});

export const demoAvailability = {
  pointsPerDay: 2,
  people: {
    "Alice Chen": {},
    "Bob Martinez": { [isoDate(new Date(cycleStart.getTime() + 2 * 86400000)).slice(0, 10)]: "full" },
    "Cara Johnson": {},
    "David Kim": { [isoDate(new Date(cycleStart.getTime() + 5 * 86400000)).slice(0, 10)]: "half" },
    "Emma Wilson": {},
  },
};

export const DEMO_TEAM_ID = TEAM_ID;
export const DEMO_CYCLE_ID = CYCLE_ID;
