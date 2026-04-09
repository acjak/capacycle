import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "data", "headroom.db");

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --- Migrations ---

db.exec(`CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL DEFAULT 0)`);
const row = db.prepare("SELECT version FROM schema_version").get();
if (!row) db.prepare("INSERT INTO schema_version (version) VALUES (0)").run();

const MIGRATIONS = [
  // v1: boards, columns, cards, votes
  `
  CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    cycle_id TEXT NOT NULL,
    preset TEXT NOT NULL DEFAULT 'custom',
    created_at TEXT DEFAULT (datetime('now')),
    UNIQUE(team_id, cycle_id)
  );
  CREATE TABLE board_columns (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT NULL
  );
  CREATE TABLE cards (
    id TEXT PRIMARY KEY,
    column_id TEXT NOT NULL REFERENCES board_columns(id) ON DELETE CASCADE,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    position REAL NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );
  CREATE TABLE votes (
    card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    voter_id TEXT NOT NULL,
    PRIMARY KEY (card_id, voter_id)
  );
  `,
  // v2: actual hours tracking
  `
  CREATE TABLE actual_hours (
    issue_id TEXT PRIMARY KEY,
    hours REAL NOT NULL DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now'))
  );
  `,
];

function migrate() {
  const current = db.prepare("SELECT version FROM schema_version").get().version;
  for (let i = current; i < MIGRATIONS.length; i++) {
    db.exec(MIGRATIONS[i]);
  }
  if (current < MIGRATIONS.length) {
    db.prepare("UPDATE schema_version SET version = ?").run(MIGRATIONS.length);
  }
}
migrate();

// --- Helpers ---

function uuid() {
  return crypto.randomUUID();
}

const PRESETS = {
  retrospective: [
    { title: "Went well", color: "#36b87a", position: 0 },
    { title: "To improve", color: "#e5a04b", position: 1 },
    { title: "Action items", color: "#5b7fff", position: 2 },
  ],
  planning: [
    { title: "To discuss", color: "#e5a04b", position: 0 },
    { title: "Ready", color: "#36b87a", position: 1 },
    { title: "Needs refinement", color: "#ef5a5a", position: 2 },
  ],
  custom: [
    { title: "Column 1", color: null, position: 0 },
  ],
};

// --- Board operations ---

const stmts = {
  getBoard: db.prepare("SELECT * FROM boards WHERE team_id = ? AND cycle_id = ?"),
  getBoardById: db.prepare("SELECT * FROM boards WHERE id = ?"),
  insertBoard: db.prepare("INSERT INTO boards (id, team_id, cycle_id, preset) VALUES (?, ?, ?, ?)"),
  deleteBoard: db.prepare("DELETE FROM boards WHERE id = ?"),

  getColumns: db.prepare("SELECT * FROM board_columns WHERE board_id = ? ORDER BY position"),
  insertColumn: db.prepare("INSERT INTO board_columns (id, board_id, title, position, color) VALUES (?, ?, ?, ?, ?)"),
  updateColumn: db.prepare("UPDATE board_columns SET title = ?, position = ?, color = ? WHERE id = ?"),
  deleteColumn: db.prepare("DELETE FROM board_columns WHERE id = ?"),
  maxColumnPos: db.prepare("SELECT MAX(position) as maxPos FROM board_columns WHERE board_id = ?"),

  getCards: db.prepare("SELECT * FROM cards WHERE board_id = ? ORDER BY position"),
  getCardsByColumn: db.prepare("SELECT * FROM cards WHERE column_id = ? ORDER BY position"),
  insertCard: db.prepare("INSERT INTO cards (id, column_id, board_id, text, position) VALUES (?, ?, ?, ?, ?)"),
  updateCard: db.prepare("UPDATE cards SET text = ? WHERE id = ?"),
  moveCard: db.prepare("UPDATE cards SET column_id = ?, position = ? WHERE id = ?"),
  deleteCard: db.prepare("DELETE FROM cards WHERE id = ?"),
  getCard: db.prepare("SELECT * FROM cards WHERE id = ?"),
  maxCardPos: db.prepare("SELECT MAX(position) as maxPos FROM cards WHERE column_id = ?"),

  getVotesForCard: db.prepare("SELECT COUNT(*) as count FROM votes WHERE card_id = ?"),
  getVotesForBoard: db.prepare(`
    SELECT card_id, COUNT(*) as count FROM votes
    WHERE card_id IN (SELECT id FROM cards WHERE board_id = ?)
    GROUP BY card_id
  `),
  getVoterVotes: db.prepare(`
    SELECT card_id FROM votes
    WHERE voter_id = ? AND card_id IN (SELECT id FROM cards WHERE board_id = ?)
  `),
  insertVote: db.prepare("INSERT OR IGNORE INTO votes (card_id, voter_id) VALUES (?, ?)"),
  deleteVote: db.prepare("DELETE FROM votes WHERE card_id = ? AND voter_id = ?"),
  hasVote: db.prepare("SELECT 1 FROM votes WHERE card_id = ? AND voter_id = ?"),
};

export function getOrCreateBoard(teamId, cycleId, preset = "retrospective") {
  let board = stmts.getBoard.get(teamId, cycleId);
  if (!board) {
    const id = uuid();
    stmts.insertBoard.run(id, teamId, cycleId, preset);
    const cols = PRESETS[preset] || PRESETS.custom;
    for (const col of cols) {
      stmts.insertColumn.run(uuid(), id, col.title, col.position, col.color);
    }
    board = stmts.getBoardById.get(id);
  }
  return board;
}

export function getFullBoard(teamId, cycleId, voterId) {
  const board = getOrCreateBoard(teamId, cycleId);
  const columns = stmts.getColumns.all(board.id);
  const cards = stmts.getCards.all(board.id);
  const voteCounts = {};
  for (const v of stmts.getVotesForBoard.all(board.id)) {
    voteCounts[v.card_id] = v.count;
  }
  const myVotes = new Set();
  if (voterId) {
    for (const v of stmts.getVoterVotes.all(voterId, board.id)) {
      myVotes.add(v.card_id);
    }
  }

  return {
    id: board.id,
    preset: board.preset,
    columns: columns.map((col) => ({
      ...col,
      cards: cards
        .filter((c) => c.column_id === col.id)
        .map((c) => ({
          ...c,
          votes: voteCounts[c.id] || 0,
          myVote: myVotes.has(c.id),
        })),
    })),
  };
}

export function resetBoard(teamId, cycleId, preset) {
  const board = stmts.getBoard.get(teamId, cycleId);
  if (board) stmts.deleteBoard.run(board.id);
  return getOrCreateBoard(teamId, cycleId, preset);
}

export function addColumn(boardId, title, color = null) {
  const { maxPos } = stmts.maxColumnPos.get(boardId);
  const position = (maxPos ?? -1) + 1;
  const id = uuid();
  stmts.insertColumn.run(id, boardId, title, position, color);
  return { id, board_id: boardId, title, position, color };
}

export function updateColumn(columnId, title, position, color) {
  stmts.updateColumn.run(title, position, color, columnId);
  return { id: columnId, title, position, color };
}

export function deleteColumn(columnId) {
  stmts.deleteColumn.run(columnId);
}

export function addCard(columnId, boardId, text) {
  const { maxPos } = stmts.maxCardPos.get(columnId);
  const position = (maxPos ?? -1) + 1;
  const id = uuid();
  stmts.insertCard.run(id, columnId, boardId, text, position);
  return { id, column_id: columnId, board_id: boardId, text, position, votes: 0, myVote: false };
}

export function updateCard(cardId, text) {
  stmts.updateCard.run(text, cardId);
  return stmts.getCard.get(cardId);
}

export function moveCard(cardId, newColumnId, newPosition) {
  stmts.moveCard.run(newColumnId, newPosition, cardId);
  return stmts.getCard.get(cardId);
}

export function deleteCard(cardId) {
  stmts.deleteCard.run(cardId);
}

export function toggleVote(cardId, voterId) {
  const existing = stmts.hasVote.get(cardId, voterId);
  if (existing) {
    stmts.deleteVote.run(cardId, voterId);
  } else {
    stmts.insertVote.run(cardId, voterId);
  }
  const { count } = stmts.getVotesForCard.get(cardId);
  return { cardId, count, voted: !existing };
}

// --- Actual hours ---

const actualHoursStmts = {
  get: db.prepare("SELECT * FROM actual_hours WHERE issue_id = ?"),
  getMany: db.prepare("SELECT * FROM actual_hours WHERE issue_id IN (SELECT value FROM json_each(?))"),
  upsert: db.prepare(`
    INSERT INTO actual_hours (issue_id, hours, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(issue_id) DO UPDATE SET hours = excluded.hours, updated_at = datetime('now')
  `),
};

export function getActualHours(issueIds) {
  const result = {};
  const rows = actualHoursStmts.getMany.all(JSON.stringify(issueIds));
  rows.forEach((r) => { result[r.issue_id] = r.hours; });
  return result;
}

export function setActualHours(issueId, hours) {
  actualHoursStmts.upsert.run(issueId, hours);
}

export { PRESETS };
export default db;
