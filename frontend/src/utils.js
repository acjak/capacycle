export function statusIcon(type) {
  return { started: "\u25D0", completed: "\u25CF", canceled: "\u2715", backlog: "\u25CB" }[type] || "\u25D1";
}

export function priorityColor(p) {
  return { 1: "#ff4d4d", 2: "#ff8c30", 3: "#5f6472", 4: "#3e4350" }[p] || "#2e323c";
}

export function priorityLabel(p) {
  return { 1: "Urgent", 2: "High", 3: "Normal", 4: "Low" }[p] || "";
}

export function statusColor(type) {
  return {
    started: "#5b7fff",
    completed: "#36b87a",
    canceled: "#5f6472",
    backlog: "#5f6472",
    unstarted: "#5f6472",
  }[type] || "#5f6472";
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

// Group issues by assignee name
export function groupByAssignee(issues, people) {
  const groups = {};
  people.forEach((p) => { groups[p] = []; });
  groups["Unassigned"] = [];
  issues.forEach((i) => {
    const key = i.assigneeName || "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(i);
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
    stateName: i.state?.name || "",
    stateType: i.state?.type || "unstarted",
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

// Total estimate for an issue including its children
export function totalEstimate(issue) {
  return (issue.estimate || 0) + (issue.children || []).reduce((s, ch) => s + (ch.estimate || 0), 0);
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
