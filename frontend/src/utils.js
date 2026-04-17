import { isDemoMode, getDemoData } from "./api.js";

export function statusIcon(type) {
  return { started: "\u25D0", completed: "\u25CF", canceled: "\u2715", backlog: "\u25CB" }[type] || "\u25D1";
}

export function priorityColor(p) {
  return { 1: "#ff4d4d", 2: "#ff8c30", 3: "#8b90a0", 4: "#6e7382" }[p] || "#6e7382";
}

export function priorityLabel(p) {
  return { 1: "Urgent", 2: "High", 3: "Normal", 4: "Low" }[p] || "";
}

export function statusColor(type) {
  return {
    started: "#5b7fff",
    completed: "#36b87a",
    canceled: "#7a7f8e",
    backlog: "#7a7f8e",
    unstarted: "#7a7f8e",
  }[type] || "#7a7f8e";
}

export function initials(name) {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

export function formatDate(dateStr, opts = { month: "short", day: "numeric" }) {
  return new Date(dateStr).toLocaleDateString("en-DK", opts);
}

// Find the best cycle to display: current > next upcoming > most recent
export function pickActiveCycle(cycles) {
  const now = new Date();
  const current = cycles.find(
    (c) => !c.completedAt && new Date(c.startsAt) <= now && new Date(c.endsAt) >= now
  );
  if (current) return current;

  const upcoming = cycles
    .filter((c) => new Date(c.startsAt) > now)
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));
  if (upcoming.length) return upcoming[0];

  return cycles[cycles.length - 1] || null;
}

// Group issues by assignee name, splitting children to their own assignee.
// When a child is assigned to someone else, show the parent as a grayed-out
// context row (ghost: true) under that person with the child nested below it.
export function groupByAssignee(issues, people) {
  const groups = {};
  people.forEach((p) => { groups[p] = []; });
  groups["Unassigned"] = [];

  issues.forEach((parent) => {
    const sameChildren = [];
    const parentKey = parent.assigneeName || "Unassigned";

    // Collect children assigned elsewhere, grouped by their assignee
    const otherByAssignee = {};

    (parent.children || []).forEach((ch) => {
      const childKey = ch.assigneeName || "Unassigned";
      if (childKey === parentKey) {
        sameChildren.push(ch);
      } else {
        if (!otherByAssignee[childKey]) otherByAssignee[childKey] = [];
        otherByAssignee[childKey].push({ ...ch, children: [] });
      }
    });

    // Parent with its same-assignee children
    if (!groups[parentKey]) groups[parentKey] = [];
    groups[parentKey].push({ ...parent, children: sameChildren });

    // For each other assignee, add a ghost parent with their children nested
    for (const [assignee, children] of Object.entries(otherByAssignee)) {
      if (!groups[assignee]) groups[assignee] = [];
      groups[assignee].push({
        ...parent,
        ghost: true,
        children,
      });
    }
  });

  return groups;
}

// Enrich raw API issue nodes, building parent/child tree from both
// the children field and the parent.id back-reference
function enrichOne(i) {
  return {
    id: i.id,
    identifier: i.identifier,
    title: i.title,
    priority: i.priority,
    estimate: i.estimate,
    assigneeName: i.assignee?.name || "Unassigned",
    assigneeId: i.assignee?.id || null,
    avatarUrl: i.assignee?.avatarUrl || null,
    stateName: i.state?.name || "",
    stateType: i.state?.type || "unstarted",
    projectName: i.project?.name || null,
    projectSlugId: i.project?.slugId || null,
    projectId: i.project?.id || null,
    milestoneName: i.projectMilestone?.name || null,
    milestoneId: i.projectMilestone?.id || null,
    labels: (i.labels?.nodes || []).map((l) => ({ id: l.id, name: l.name, color: l.color })),
    completedAt: i.completedAt || null,
    parentId: i.parent?.id || null,
    children: [],
  };
}

export function enrichIssues(nodes) {
  const all = nodes.map(enrichOne);
  const byId = {};
  all.forEach((i) => { byId[i.id] = i; });

  // Build tree: attach children to parents using parent.id back-references
  const childIds = new Set();
  all.forEach((i) => {
    if (i.parentId && byId[i.parentId]) {
      // Avoid duplicates
      if (!byId[i.parentId].children.find((ch) => ch.id === i.id)) {
        byId[i.parentId].children.push(i);
      }
      childIds.add(i.id);
    }
  });

  // Also pull in children from the API's children field that are in this set
  nodes.forEach((raw) => {
    const parent = byId[raw.id];
    if (!parent) return;
    (raw.children?.nodes || []).forEach((ch) => {
      if (byId[ch.id] && !parent.children.find((c) => c.id === ch.id)) {
        parent.children.push(byId[ch.id]);
        childIds.add(ch.id);
      }
    });
  });

  // Return only top-level issues (not children)
  return all.filter((i) => !childIds.has(i.id));
}

// Read the estimate rollup mode from tenant settings, with a safe default.
export function getEstimateMode(settings) {
  const m = settings?.estimate_rollup;
  return m === "parent" ? "parent" : "children";
}

// Effective single-issue estimate under a given rollup mode.
//   mode === "parent":   the issue's own estimate (ignore children).
//   mode === "children": sum of children's estimates if any child has one,
//                        otherwise fall back to the issue's own estimate.
// Does not double-count: never sums parent + children.
export function effectiveEstimate(issue, mode = "children") {
  const own = issue.estimate || 0;
  if (mode === "parent") return own;
  const children = issue.children || [];
  const anyChildEstimated = children.some((ch) => ch.estimate != null);
  if (!anyChildEstimated) return own;
  return children.reduce((s, ch) => s + (ch.estimate || 0), 0);
}

// Sum effective estimates across a list of top-level issues (children already rolled in).
export function sumEffectiveEstimates(issues, mode = "children") {
  return (issues || []).reduce((s, i) => s + effectiveEstimate(i, mode), 0);
}

// Sum estimates across top-level issues, optionally filtering individual units by predicate.
// Under "children" mode, when a parent has estimated children, the predicate is applied to
// each child (not the parent) — so e.g. "completed" means "count completed children's estimates".
// Callers should pass TOP-LEVEL issues (with .children populated), not a flattened list.
export function sumEstimates(topLevelIssues, mode = "children", predicate = null) {
  let total = 0;
  for (const i of topLevelIssues || []) {
    if (mode === "parent") {
      if (!predicate || predicate(i)) total += i.estimate || 0;
      continue;
    }
    const children = i.children || [];
    const anyChildEstimated = children.some((ch) => ch.estimate != null);
    if (anyChildEstimated) {
      for (const ch of children) {
        if (!predicate || predicate(ch)) total += ch.estimate || 0;
      }
    } else {
      if (!predicate || predicate(i)) total += i.estimate || 0;
    }
  }
  return total;
}

// Legacy alias — additive parent + children. Kept only for any external callers; prefer
// effectiveEstimate for new code, since parent estimates in Linear are almost always a
// pre-decomposition estimate, not an orthogonal component.
export function totalEstimate(issue) {
  return effectiveEstimate(issue, "children");
}

// Flat list of an issue + its children (for counting)
export function flatIssues(issues) {
  const result = [];
  issues.forEach((i) => {
    result.push(i);
    (i.children || []).forEach((ch) => result.push(ch));
  });
  return result;
}

// Load/save capacity settings from localStorage (legacy, used for backlog fallback)
export function loadCapacities(teamId) {
  try {
    const raw = localStorage.getItem(`capacity_${teamId}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

export function saveCapacities(teamId, capacities) {
  try {
    localStorage.setItem(`capacity_${teamId}`, JSON.stringify(capacities));
  } catch { /* ignore */ }
}

// Get workdays (Mon-Fri) between two dates inclusive
export function getWorkdays(startsAt, endsAt) {
  const days = [];
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const cur = new Date(start);
  while (cur <= end) {
    const dow = cur.getDay();
    if (dow >= 1 && dow <= 5) days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

export async function loadAvailability(teamId, cycleId) {
  // Demo mode — return mock availability without network call
  if (isDemoMode()) return getDemoData().availability || { pointsPerDay: 2, people: {} };
  try {
    const res = await fetch(`/api/availability/${teamId}/${cycleId}`);
    if (res.ok) return await res.json();
  } catch { /* fall through */ }
  return { pointsPerDay: 2, people: {} };
}

export async function saveAvailability(teamId, cycleId, data) {
  try {
    await fetch(`/api/availability/${teamId}/${cycleId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  } catch { /* ignore */ }
}

export function computeCapacities(availability, people, startsAt, endsAt) {
  const workdays = getWorkdays(startsAt, endsAt);
  const totalWorkdays = workdays.length;
  const caps = {};
  const ppd = availability.pointsPerDay || 2;

  people.forEach((name) => {
    const offs = availability.people?.[name] || {};
    let fullOff = 0;
    let halfOff = 0;
    workdays.forEach((d) => {
      const key = d.toISOString().slice(0, 10);
      if (offs[key] === "full") fullOff++;
      else if (offs[key] === "half") halfOff++;
    });
    caps[name] = Math.round((totalWorkdays - fullOff - halfOff * 0.5) * ppd * 10) / 10;
  });
  return caps;
}
