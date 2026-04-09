import express from "express";
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import {
  getFullBoard, resetBoard, addColumn, updateColumn, deleteColumn,
  addCard, updateCard, moveCard, deleteCard, toggleVote,
  getActualHours, setActualHours,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);
const io = new Server(server);
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

// Board REST endpoint (initial load)
app.get("/api/board/:teamId/:cycleId", (req, res) => {
  try {
    const voterId = req.query.voterId || null;
    const board = getFullBoard(req.params.teamId, req.params.cycleId, voterId);
    res.json(board);
  } catch (err) {
    console.error("Board error:", err.message);
    res.status(500).json({ error: "Failed to load board" });
  }
});

// Actual hours API
app.post("/api/actual-hours", express.json(), (req, res) => {
  try {
    const { issueIds } = req.body;
    const hours = getActualHours(issueIds || []);
    res.json(hours);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/actual-hours/:issueId", express.json(), (req, res) => {
  try {
    setActualHours(req.params.issueId, req.body.hours || 0);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Board socket.io
io.on("connection", (socket) => {
  let currentRoom = null;

  socket.on("join-board", ({ teamId, cycleId, voterId }) => {
    if (currentRoom) socket.leave(currentRoom);
    currentRoom = `board:${teamId}:${cycleId}`;
    socket.join(currentRoom);
    socket.teamId = teamId;
    socket.cycleId = cycleId;
    socket.voterId = voterId;
  });

  socket.on("add-card", ({ columnId, boardId, text }) => {
    try {
      const card = addCard(columnId, boardId, text);
      io.to(currentRoom).emit("card-added", card);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("update-card", ({ cardId, text }) => {
    try {
      const card = updateCard(cardId, text);
      io.to(currentRoom).emit("card-updated", card);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("move-card", ({ cardId, newColumnId, newPosition }) => {
    try {
      const card = moveCard(cardId, newColumnId, newPosition);
      io.to(currentRoom).emit("card-moved", card);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("delete-card", ({ cardId }) => {
    try {
      deleteCard(cardId);
      io.to(currentRoom).emit("card-deleted", { cardId });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("toggle-vote", ({ cardId, voterId }) => {
    try {
      const result = toggleVote(cardId, voterId);
      io.to(currentRoom).emit("vote-updated", { ...result, voterId });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("add-column", ({ boardId, title, color }) => {
    try {
      const col = addColumn(boardId, title, color);
      io.to(currentRoom).emit("column-added", col);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("update-column", ({ columnId, title, position, color }) => {
    try {
      const col = updateColumn(columnId, title, position, color);
      io.to(currentRoom).emit("column-updated", col);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("delete-column", ({ columnId }) => {
    try {
      deleteColumn(columnId);
      io.to(currentRoom).emit("column-deleted", { columnId });
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });

  socket.on("reset-board", ({ teamId, cycleId, preset }) => {
    try {
      resetBoard(teamId, cycleId, preset);
      const board = getFullBoard(teamId, cycleId, socket.voterId);
      io.to(currentRoom).emit("board-reset", board);
    } catch (err) {
      socket.emit("error", { message: err.message });
    }
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, "frontend", "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "frontend", "dist", "index.html"));
});

server.listen(PORT, () => {
  console.log(`Headroom running on http://localhost:${PORT}`);
});
