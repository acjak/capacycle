// Realistic demo data for the Capacycle demo mode.
// 10 cycles of history with carry-over issues, varied scope drift, and realistic completion rates.

const now = new Date();
function isoDate(d) { return d.toISOString(); }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// --- Cycle date generation (10 two-week cycles, current one is in progress) ---

const CYCLE_COUNT = 10;
const CYCLE_DAYS = 14;
const CURRENT_ELAPSED = 9;

// Current cycle (last): started CURRENT_ELAPSED days ago, ends in a few days
const currentStart = new Date(now);
currentStart.setDate(currentStart.getDate() - CURRENT_ELAPSED);
const currentEnd = new Date(currentStart);
currentEnd.setDate(currentEnd.getDate() + CYCLE_DAYS - 1);

const cycleRanges = [];
for (let i = 0; i < CYCLE_COUNT; i++) {
  const cyclesFromEnd = CYCLE_COUNT - 1 - i; // 9, 8, 7, ... 0
  if (cyclesFromEnd === 0) {
    cycleRanges.push({ start: currentStart, end: currentEnd, isActive: true });
  } else {
    const end = new Date(currentStart);
    end.setDate(end.getDate() - 1 - (cyclesFromEnd - 1) * CYCLE_DAYS);
    const start = new Date(end);
    start.setDate(start.getDate() - CYCLE_DAYS + 1);
    cycleRanges.push({ start, end, isActive: false });
  }
}

// --- Scope history generators ---
// Both generators produce arrays whose endpoints exactly match the cycle's live totals,
// so the burndown/velocity charts agree with what the user sees in the capacity and
// estimates views. The interior is a straight interpolation (good enough for a demo).

function makeScopeHistory(start, end, days) {
  const arr = [start];
  for (let i = 1; i <= days; i++) {
    arr.push(Math.round(start + (end - start) * (i / days)));
  }
  return arr;
}

function makeCompletedHistory(finalDone, days) {
  const arr = [0];
  for (let i = 1; i <= days; i++) {
    arr.push(Math.round(finalDone * (i / days)));
  }
  return arr;
}

function makeIssueCountHistory(start, end, days) {
  const arr = [start];
  for (let i = 1; i <= days; i++) {
    arr.push(Math.round(start + (end - start) * (i / days)));
  }
  return arr;
}

// --- Shared constants ---

const TEAM_ID = "demo-team-1";

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

// --- Issue pool — some issues appear in multiple cycles (carry-overs) ---

const issueTitles = [
  // Persistent carry-overs (appear in many cycles)
  { id: "carry-1", identifier: "ENG-98", title: "Refactor authentication middleware", priority: 2, estimate: 5, project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[2], labels[3]] },
  { id: "carry-2", identifier: "ENG-105", title: "Fix flaky E2E test suite", priority: 3, estimate: 3, project: null, milestone: null, labels: [labels[0], labels[5]] },
  { id: "carry-3", identifier: "ENG-112", title: "Migrate user preferences to new schema", priority: 3, estimate: 5, project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[2], labels[3]] },
  // Current cycle issues
  { id: "i1", identifier: "ENG-142", title: "Add user preferences panel", priority: 2, estimate: 5, project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[1], labels[4]] },
  { id: "i2", identifier: "ENG-143", title: "Implement notification settings", priority: 3, estimate: 3, project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[1], labels[4]] },
  { id: "i3", identifier: "ENG-144", title: "Fix settings not persisting on refresh", priority: 1, estimate: 2, project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[0], labels[4]] },
  { id: "i4", identifier: "ENG-145", title: "Theme toggle accessibility", priority: 3, estimate: 1, project: projects[0], milestone: milestones["proj-1"][0], labels: [labels[1], labels[6]] },
  { id: "i5", identifier: "ENG-146", title: "Build chart component library", priority: 2, estimate: 8, project: projects[0], milestone: milestones["proj-1"][1], labels: [labels[1], labels[4]] },
  { id: "i6", identifier: "ENG-147", title: "Dashboard data aggregation endpoint", priority: 2, estimate: 5, project: projects[0], milestone: milestones["proj-1"][1], labels: [labels[1], labels[3]] },
  { id: "i7", identifier: "ENG-148", title: "Widget drag-and-drop layout", priority: 3, estimate: 3, project: projects[0], milestone: milestones["proj-1"][1], labels: [labels[1], labels[4]] },
  { id: "i8", identifier: "ENG-149", title: "OAuth2 token refresh flow", priority: 1, estimate: 5, project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[1], labels[3]] },
  { id: "i9", identifier: "ENG-150", title: "API key rotation endpoint", priority: 2, estimate: 3, project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[1], labels[3]] },
  { id: "i10", identifier: "ENG-151", title: "Fix CORS headers for v2 routes", priority: 1, estimate: 1, project: projects[1], milestone: milestones["proj-2"][0], labels: [labels[0], labels[3]] },
  { id: "i11", identifier: "ENG-152", title: "Implement sliding window rate limiter", priority: 2, estimate: 5, project: projects[1], milestone: milestones["proj-2"][1], labels: [labels[1], labels[3], labels[5]] },
  { id: "i12", identifier: "ENG-153", title: "Rate limit dashboard UI", priority: 3, estimate: 3, project: projects[1], milestone: milestones["proj-2"][1], labels: [labels[1], labels[4]] },
  { id: "i13", identifier: "ENG-154", title: "Design onboarding screens", priority: 2, estimate: 3, project: projects[2], milestone: milestones["proj-3"][0], labels: [labels[1], labels[6]] },
  { id: "i14", identifier: "ENG-155", title: "Implement swipe tutorial", priority: 3, estimate: 5, project: projects[2], milestone: milestones["proj-3"][0], labels: [labels[1], labels[4]] },
  { id: "i15", identifier: "ENG-156", title: "Upgrade Node.js to v22", priority: 4, estimate: 2, project: null, milestone: null, labels: [labels[2], labels[5]] },
  { id: "i16", identifier: "ENG-157", title: "Flaky test in auth module", priority: 1, estimate: 1, project: null, milestone: null, labels: [labels[0], labels[3]] },
  { id: "i17", identifier: "ENG-158", title: "Migrate legacy date parsing", priority: 3, estimate: 3, project: null, milestone: null, labels: [labels[2], labels[3]] },
  { id: "i18", identifier: "ENG-159", title: "Add Sentry error boundaries", priority: 2, estimate: 2, project: null, milestone: null, labels: [labels[2], labels[4]] },
  { id: "i19", identifier: "ENG-160", title: "Database index optimization", priority: 3, estimate: 3, project: projects[1], milestone: null, labels: [labels[2], labels[3], labels[5]] },
  { id: "i20", identifier: "ENG-161", title: "Webhook retry mechanism", priority: 2, estimate: 5, project: projects[1], milestone: milestones["proj-2"][1], labels: [labels[1], labels[3]] },
];

// Past cycle-specific issue titles for variety
const pastIssueTitles = [
  "Set up CI/CD pipeline", "Write API documentation", "Fix login redirect loop",
  "Add dark mode to settings", "Implement search autocomplete", "Optimize image loading",
  "Create user onboarding wizard", "Fix timezone display bug", "Add export to CSV",
  "Implement email notifications", "Refactor database queries", "Add unit tests for auth",
  "Design mobile navigation", "Fix memory leak in websocket", "Add rate limit headers",
  "Implement file upload", "Fix date picker locale", "Add keyboard shortcuts",
  "Optimize bundle size", "Create error boundary component", "Add retry logic to API client",
  "Fix pagination offset bug", "Implement SSO integration", "Add analytics dashboard",
  "Fix broken avatar upload", "Create billing history page", "Add webhook signatures",
  "Implement real-time updates", "Fix duplicate notification bug", "Add bulk actions to list",
  "Create admin user management", "Fix scroll position on navigate", "Add feature flags",
  "Implement audit logging", "Fix race condition in cache", "Add table sorting",
  "Create data migration script", "Fix font loading FOIT", "Add session timeout warning",
  "Implement API versioning", "Fix dropdown z-index", "Add loading skeletons",
];

// --- Build per-cycle issue sets ---

// carry-over IDs appear across cycles: carry-1 in cycles 15-24, carry-2 in 19-24, carry-3 in 21-24
const carryOverSchedule = {
  "carry-1": [15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
  "carry-2": [19, 20, 21, 22, 23, 24],
  "carry-3": [21, 22, 23, 24],
};

const CURRENT_CYCLE_NUMBER = 24;
let pastIssueCounter = 0;

function buildCycleIssues(cycleNumber, cycleRange) {
  const issues = [];
  const isCurrent = cycleNumber === CURRENT_CYCLE_NUMBER;
  const cycleStartTime = cycleRange.start.getTime();

  // Add carry-over issues where applicable
  for (const [carryId, cyclesToAppear] of Object.entries(carryOverSchedule)) {
    if (cyclesToAppear.includes(cycleNumber)) {
      const template = issueTitles.find((t) => t.id === carryId);
      if (template) {
        const isCompleted = isCurrent ? false : false; // never completed — that's the point
        const st = isCurrent ? states[2] : (cycleNumber === cyclesToAppear[cyclesToAppear.length - 1] ? states[2] : states[1]);
        issues.push({
          ...template,
          assignee: members[Math.abs(cycleNumber) % members.length],
          state: st,
          completedAt: null,
        });
      }
    }
  }

  // Add cycle-specific issues
  if (isCurrent) {
    // Use the detailed current-cycle templates
    for (const t of issueTitles) {
      if (t.id.startsWith("carry")) continue;
      const daysAgo = Math.floor(Math.random() * 7) + 1;
      issues.push({
        ...t,
        assignee: t.id === "i1" ? members[0] : t.id === "i2" ? members[1] : t.id === "i3" ? members[0] : t.id === "i4" ? members[2]
          : t.id === "i5" ? members[3] : t.id === "i6" ? members[4] : t.id === "i7" ? members[2]
          : t.id === "i8" ? members[1] : t.id === "i9" ? members[4] : t.id === "i10" ? members[0]
          : t.id === "i11" ? members[3] : t.id === "i12" ? members[2] : t.id === "i13" ? members[2]
          : t.id === "i14" ? members[3] : t.id === "i15" ? members[4] : t.id === "i16" ? members[0]
          : t.id === "i17" ? members[1] : t.id === "i18" ? members[4] : t.id === "i19" ? members[3] : members[1],
        state: ["i1", "i2", "i4", "i9", "i10", "i13", "i15", "i17"].includes(t.id) ? states[4]
          : ["i3"].includes(t.id) ? states[3]
          : ["i5", "i6", "i8", "i14", "i16", "i19"].includes(t.id) ? states[2]
          : states[1],
        completedAt: ["i1", "i2", "i4", "i9", "i10", "i13", "i15", "i17"].includes(t.id)
          ? isoDate(new Date(now.getTime() - daysAgo * 86400000)) : null,
      });
    }
  } else {
    // Generate 14-18 issues per past cycle — mostly completed
    const count = 14 + Math.floor(Math.random() * 5);
    for (let i = 0; i < count; i++) {
      const titleIdx = (pastIssueCounter++) % pastIssueTitles.length;
      const completed = Math.random() < 0.8;
      const daysIn = Math.floor(Math.random() * CYCLE_DAYS);
      issues.push({
        id: `past-${cycleNumber}-${i}`,
        identifier: `ENG-${cycleNumber * 10 + i}`,
        title: pastIssueTitles[titleIdx],
        priority: 1 + Math.floor(Math.random() * 4),
        estimate: [1, 2, 3, 3, 5, 5, 8][Math.floor(Math.random() * 7)],
        assignee: members[i % members.length],
        state: completed ? states[4] : (Math.random() < 0.5 ? states[5] : states[1]),
        project: pick(projects),
        milestone: null,
        labels: [pick(labels), pick(labels)].filter((l, idx, arr) => arr.indexOf(l) === idx),
        completedAt: completed ? isoDate(new Date(cycleStartTime + daysIn * 86400000)) : null,
      });
    }
  }

  return issues;
}

// --- Build cycle nodes and per-cycle issue data ---

const cycleNodes = [];
const cycleIssueData = {};

for (let i = 0; i < CYCLE_COUNT; i++) {
  const cycleNumber = CURRENT_CYCLE_NUMBER - CYCLE_COUNT + 1 + i;
  const range = cycleRanges[i];
  const cycleId = `demo-cycle-${cycleNumber}`;
  const isActive = range.isActive;
  const issues = buildCycleIssues(cycleNumber, range);

  const totalEst = issues.reduce((s, iss) => s + (iss.estimate || 0), 0);
  const doneEst = issues.filter((iss) => iss.state.type === "completed").reduce((s, iss) => s + (iss.estimate || 0), 0);
  const doneCount = issues.filter((iss) => iss.state.type === "completed").length;
  const inProgCount = issues.filter((iss) => iss.state.type === "started").length;
  const inProgEst = issues.filter((iss) => iss.state.type === "started").reduce((s, iss) => s + (iss.estimate || 0), 0);
  const days = isActive ? CURRENT_ELAPSED : CYCLE_DAYS;
  const driftPct = [5, -3, 8, 12, 2, -5, 15, 6, 10, 4][i] || 5;
  // Work backward from the live final scope to a plausible starting point, so the history
  // ends at the real `totalEst` that every other view is summing.
  const startScope = Math.round(totalEst / (1 + driftPct / 100));
  const startIssueCount = Math.max(1, Math.round(issues.length / (1 + driftPct / 100)));
  const completionRate = totalEst > 0 ? doneEst / totalEst : 0;

  cycleNodes.push({
    id: cycleId, number: cycleNumber, name: null,
    startsAt: isoDate(range.start), endsAt: isoDate(range.end),
    completedAt: isActive ? null : isoDate(range.end),
    progress: completionRate,
    scopeHistory: makeScopeHistory(startScope, totalEst, days),
    completedScopeHistory: makeCompletedHistory(doneEst, days),
    issueCountHistory: makeIssueCountHistory(startIssueCount, issues.length, days),
    completedIssueCountHistory: makeCompletedHistory(doneCount, days),
    // In-progress stays roughly flat around the current in-progress total.
    inProgressScopeHistory: Array.from({ length: days + 1 }, () => inProgEst),
  });

  cycleIssueData[cycleId] = issues;
}

// --- Build issue nodes for API response format ---

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

// Issue history for current cycle
function buildIssueHistory(issue) {
  const currentCycleStart = cycleRanges[CYCLE_COUNT - 1].start.getTime();
  const entries = [];

  const driftChance = { bug: 0.6, feature: 0.3, "tech-debt": 0.5, backend: 0.35, frontend: 0.25, infrastructure: 0.7, ux: 0.2 };
  const labelNames = (issue.labels || []).map((l) => l.name);
  const hasDrift = labelNames.some((l) => Math.random() < (driftChance[l] || 0.2));

  if (issue.estimate && hasDrift) {
    const originalEstimate = Math.max(1, issue.estimate - Math.ceil(Math.random() * 3));
    entries.push({ createdAt: isoDate(new Date(currentCycleStart - 7 * 86400000)), fromEstimate: null, toEstimate: originalEstimate, fromState: null, toState: null });
    if (originalEstimate !== issue.estimate) {
      entries.push({ createdAt: isoDate(new Date(currentCycleStart + 3 * 86400000 + Math.random() * 4 * 86400000)), fromEstimate: originalEstimate, toEstimate: issue.estimate, fromState: null, toState: null });
    }
  } else if (issue.estimate) {
    entries.push({ createdAt: isoDate(new Date(currentCycleStart - 7 * 86400000)), fromEstimate: null, toEstimate: issue.estimate, fromState: null, toState: null });
  }

  if (issue.state.type === "started" || issue.state.type === "completed") {
    entries.push({ createdAt: isoDate(new Date(currentCycleStart + Math.random() * 3 * 86400000)), fromEstimate: null, toEstimate: null, fromState: { type: "unstarted" }, toState: { type: "started" } });
  }
  if (issue.state.type === "completed") {
    entries.push({ createdAt: issue.completedAt, fromEstimate: null, toEstimate: null, fromState: { type: "started" }, toState: { type: "completed" } });
  }

  return entries;
}

// --- Exports ---

const CURRENT_CYCLE_ID = `demo-cycle-${CURRENT_CYCLE_NUMBER}`;
const currentIssues = cycleIssueData[CURRENT_CYCLE_ID];

export const demoTeams = {
  teams: { nodes: [{ id: TEAM_ID, name: "Engineering" }] },
};

export const demoTeamData = {
  team: {
    id: TEAM_ID,
    name: "Engineering",
    members: { nodes: members },
    states: { nodes: states },
    cycles: { nodes: cycleNodes },
  },
};

export const demoCycleIssues = {
  cycle: {
    issues: { nodes: currentIssues.map(buildIssueNode) },
  },
};

// Per-cycle issue data for carry-over detection
export const demoCycleIssueData = {};
for (const [cycleId, issues] of Object.entries(cycleIssueData)) {
  demoCycleIssueData[cycleId] = {
    cycle: { issues: { nodes: issues.map(buildIssueNode) } },
  };
}

export const demoIssueHistories = {};
currentIssues.forEach((t) => {
  demoIssueHistories[t.id] = {
    issue: { id: t.id, history: { nodes: buildIssueHistory(t) } },
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
  const projectIssueNodes = currentIssues
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
    "Bob Martinez": { [isoDate(new Date(cycleRanges[CYCLE_COUNT - 1].start.getTime() + 2 * 86400000)).slice(0, 10)]: "full" },
    "Cara Johnson": {},
    "David Kim": { [isoDate(new Date(cycleRanges[CYCLE_COUNT - 1].start.getTime() + 5 * 86400000)).slice(0, 10)]: "half" },
    "Emma Wilson": {},
  },
};

export const DEMO_TEAM_ID = TEAM_ID;
export const DEMO_CYCLE_ID = CURRENT_CYCLE_ID;
