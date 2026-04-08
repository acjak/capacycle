import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const DATA_DIR = path.join(__dirname, "data");

if (!LINEAR_API_KEY) {
  console.error("LINEAR_API_KEY environment variable is required");
  console.error("Get one from: Linear > Settings > Account > Security & Access > API");
  process.exit(1);
}

// Ensure data directory exists
fs.mkdirSync(DATA_DIR, { recursive: true });

// Proxy /api/linear -> api.linear.app/graphql
app.post("/api/linear", express.json(), async (req, res) => {
  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: LINEAR_API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (err) {
    console.error("Linear API error:", err.message);
    res.status(502).json({ error: "Failed to reach Linear API", detail: err.message });
  }
});

// Availability API
function availabilityPath(teamId, cycleId) {
  // Sanitize IDs to prevent path traversal
  const safe = (s) => s.replace(/[^a-zA-Z0-9_-]/g, "");
  return path.join(DATA_DIR, `availability_${safe(teamId)}_${safe(cycleId)}.json`);
}

app.get("/api/availability/:teamId/:cycleId", (req, res) => {
  const file = availabilityPath(req.params.teamId, req.params.cycleId);
  try {
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      res.json(data);
    } else {
      res.json({ pointsPerDay: 2, people: {} });
    }
  } catch {
    res.json({ pointsPerDay: 2, people: {} });
  }
});

app.put("/api/availability/:teamId/:cycleId", express.json(), (req, res) => {
  const file = availabilityPath(req.params.teamId, req.params.cycleId);
  try {
    fs.writeFileSync(file, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (err) {
    console.error("Failed to save availability:", err.message);
    res.status(500).json({ error: "Failed to save" });
  }
});

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Headroom running on http://localhost:${PORT}`);
});
