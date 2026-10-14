const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || "*";

const app = express();
app.use(cors({ origin: CLIENT_URL }));

app.get("/", (req, res) => {
  res.send("Watch Party server is running");
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: CLIENT_URL } });

const rooms = {};
let nextRequestId = 1;
let nextMessageId = 1;

const PERMISSIONS = {
  Host: [
    "play",
    "pause",
    "seek",
    "change_video",
    "approve_request",
    "assign_role",
    "remove_participant",
    "transfer_host",
  ],
  Moderator: ["play", "pause", "seek", "change_video", "approve_request"],
  Participant: [], 
};

function can(user, action) {
  return PERMISSIONS[user.role].includes(action);
}

function makeRoomCode() {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = "";
    for (let i = 0; i < 6; i++) {
      code += letters[Math.floor(Math.random() * letters.length)];
    }
  } while (rooms[code]); 
  return code;
}

function cleanName(name, fallback) {
  return String(name || "").trim().slice(0, 20) || fallback;
}

function isValidVideoId(id) {
  return typeof id === "string" && /^[a-zA-Z0-9_-]{11}$/.test(id);
}

function reply(callback, data) {
  if (typeof callback === "function") callback(data);
}

function getParticipants(room) {
  return Object.values(room.users).map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
  }));
}

function getCurrentTime(room) {
  if (room.playState === "playing") {
    return room.currentTime + (Date.now() - room.updatedAt) / 1000;
  }
  return room.currentTime;
}

function getState(room) {
  return {
    playState: room.playState,
    currentTime: getCurrentTime(room),
    videoId: room.videoId,
  };
}

function sendRequests(room) {
  for (const user of Object.values(room.users)) {
    io.to(user.id).emit("requests_updated", {
      requests: can(user, "approve_request") ? room.requests : [],
    });
  }
}

function applyAction(room, action, data) {
  data = data || {};

  if (action === "play" || action === "pause") {
    const t = Number(data.currentTime);
    room.currentTime = Number.isFinite(t) && t >= 0 ? t : getCurrentTime(room);
    room.playState = action === "play" ? "playing" : "paused";
  } else if (action === "seek") {
    const t = Number(data.time);
    if (!Number.isFinite(t) || t < 0) return false;
    room.currentTime = t;
  } else if (action === "change_video") {
    if (!isValidVideoId(data.videoId)) return false;
    room.videoId = data.videoId;
    room.currentTime = 0;
    room.playState = "paused";
  } else {
    return false;
  }

  room.updatedAt = Date.now();
  io.to(room.id).emit("sync_state", getState(room));
  return true;
}

function addUser(room, socket, username, role) {
  const user = { id: socket.id, username, role };
  room.users[socket.id] = user;
  socket.join(room.id);
  socket.data.roomId = room.id;
  return user;
}

function leaveCurrentRoom(socket) {
  const roomId = socket.data.roomId;
  const room = rooms[roomId];
  socket.data.roomId = null;
  if (!room) return;

  const user = room.users[socket.id];
  delete room.users[socket.id];
  room.requests = room.requests.filter((r) => r.userId !== socket.id);
  socket.leave(roomId);
  if (!user) return;

  if (Object.keys(room.users).length === 0) {
    delete rooms[roomId];
    return;
  }

  if (user.role === "Host") {
    const others = Object.values(room.users);
    const newHost = others.find((u) => u.role === "Moderator") || others[0];
    newHost.role = "Host";
    io.to(roomId).emit("host_changed", {
      userId: newHost.id,
      username: newHost.username,
      participants: getParticipants(room),
    });
  }

  io.to(roomId).emit("user_left", {
    username: user.username,
    userId: user.id,
    participants: getParticipants(room),
  });
  sendRequests(room);
}

function getContext(socket, action) {
  const room = rooms[socket.data.roomId];
  if (!room) return null;
  const user = room.users[socket.id];
  if (!user) return null;

  if (action && !can(user, action)) {
    socket.emit("error_message", {
      message: `Permission denied: your role (${user.role}) cannot do "${action}".`,
    });
    return null;
  }
  return { room, user };
}

function sendError(socket, message) {
  socket.emit("error_message", { message });
}

io.on("connection", (socket) => {
  console.log("connected:", socket.id);

  socket.on("create_room", (data, callback) => {
    leaveCurrentRoom(socket);

    const roomId = makeRoomCode();
    const room = {
      id: roomId,
      users: {},
      videoId: "dQw4w9WgXcQ",
      playState: "paused",
      currentTime: 0,
      updatedAt: Date.now(),
      requests: [],
    };
    rooms[roomId] = room;

    const username = cleanName(data && data.username, "Host");
    addUser(room, socket, username, "Host");

    reply(callback, {
      ok: true,
      roomId,
      role: "Host",
      participants: getParticipants(room),
      ...getState(room),
    });
  });

  socket.on("join_room", (data, callback) => {
    const roomId = String((data && data.roomId) || "").trim().toUpperCase();
    const room = rooms[roomId];

    if (!room) {
      reply(callback, { ok: false, error: "Room not found. Check the code." });
      return;
    }

    leaveCurrentRoom(socket);
    const username = cleanName(data.username, "Guest");
    const user = addUser(room, socket, username, "Participant");
    const participants = getParticipants(room);

    reply(callback, {
      ok: true,
      roomId,
      role: user.role,
      participants,
      ...getState(room),
    });

    socket.to(roomId).emit("user_joined", {
      username: user.username,
      userId: user.id,
      role: user.role,
      participants,
    });
  });

  socket.on("leave_room", () => {
    leaveCurrentRoom(socket);
  });

  socket.on("disconnect", () => {
    console.log("disconnected:", socket.id);
    leaveCurrentRoom(socket);
  });

  socket.on("request_sync", () => {
    const ctx = getContext(socket);
    if (!ctx) return;
    socket.emit("sync_state", getState(ctx.room));
  });

  socket.on("play", (data) => {
    const ctx = getContext(socket, "play");
    if (ctx) applyAction(ctx.room, "play", data);
  });

  socket.on("pause", (data) => {
    const ctx = getContext(socket, "pause");
    if (ctx) applyAction(ctx.room, "pause", data);
  });

  socket.on("seek", (data) => {
    const ctx = getContext(socket, "seek");
    if (ctx && !applyAction(ctx.room, "seek", data)) {
      sendError(socket, "Invalid seek time.");
    }
  });

  socket.on("change_video", (data) => {
    const ctx = getContext(socket, "change_video");
    if (ctx && !applyAction(ctx.room, "change_video", data)) {
      sendError(socket, "Invalid YouTube video.");
    }
  });

 
  socket.on("assign_role", (data) => {
    const ctx = getContext(socket, "assign_role");
    if (!ctx) return;

    const target = ctx.room.users[data && data.userId];
    if (!target) return sendError(socket, "User not found.");
    if (target.id === ctx.user.id) {
      return sendError(socket, "You cannot change your own role.");
    }
    if (!["Moderator", "Participant"].includes(data.role)) {
      return sendError(socket, "Invalid role.");
    }

    target.role = data.role;
    io.to(ctx.room.id).emit("role_assigned", {
      userId: target.id,
      username: target.username,
      role: target.role,
      participants: getParticipants(ctx.room),
    });
    sendRequests(ctx.room);
  });

  socket.on("remove_participant", (data) => {
    const ctx = getContext(socket, "remove_participant");
    if (!ctx) return;

    const target = ctx.room.users[data && data.userId];
    if (!target) return sendError(socket, "User not found.");
    if (target.id === ctx.user.id) {
      return sendError(socket, "You cannot remove yourself.");
    }

    delete ctx.room.users[target.id];
    ctx.room.requests = ctx.room.requests.filter((r) => r.userId !== target.id);

    io.to(ctx.room.id).emit("participant_removed", {
      userId: target.id,
      username: target.username,
      participants: getParticipants(ctx.room),
    });

    const targetSocket = io.sockets.sockets.get(target.id);
    if (targetSocket) {
      targetSocket.leave(ctx.room.id);
      targetSocket.data.roomId = null;
    }
    sendRequests(ctx.room);
  });

  socket.on("transfer_host", (data) => {
    const ctx = getContext(socket, "transfer_host");
    if (!ctx) return;

    const target = ctx.room.users[data && data.userId];
    if (!target) return sendError(socket, "User not found.");
    if (target.id === ctx.user.id) {
      return sendError(socket, "You are already the Host.");
    }

    ctx.user.role = "Moderator"; // old host becomes Moderator
    target.role = "Host";
    io.to(ctx.room.id).emit("host_changed", {
      userId: target.id,
      username: target.username,
      participants: getParticipants(ctx.room),
    });
    sendRequests(ctx.room);
  });

  socket.on("request_action", (data) => {
    const ctx = getContext(socket);
    if (!ctx) return;

    const action = data && data.action;
    const info = (data && data.data) || {};

    if (!["play", "pause", "seek", "change_video"].includes(action)) {
      return sendError(socket, "Unknown request.");
    }
    if (can(ctx.user, action)) {
      return sendError(socket, "You can do this yourself, no request needed.");
    }
    if (action === "change_video" && !isValidVideoId(info.videoId)) {
      return sendError(socket, "Invalid YouTube video.");
    }
    if (action === "seek" && !Number.isFinite(Number(info.time))) {
      return sendError(socket, "Invalid seek time.");
    }
    const mine = ctx.room.requests.filter((r) => r.userId === socket.id);
    if (mine.length >= 5) {
      return sendError(socket, "You already have 5 pending requests.");
    }

    ctx.room.requests.push({
      id: nextRequestId++,
      userId: socket.id,
      username: ctx.user.username,
      action,
      data: { videoId: info.videoId, time: info.time },
    });
    socket.emit("info_message", { message: "Request sent to Host/Moderator." });
    sendRequests(ctx.room);
  });

  socket.on("approve_request", (data) => {
    const ctx = getContext(socket, "approve_request");
    if (!ctx) return;

    const index = ctx.room.requests.findIndex((r) => r.id === (data && data.requestId));
    if (index === -1) return;

    const request = ctx.room.requests.splice(index, 1)[0];
    applyAction(ctx.room, request.action, request.data);
    io.to(request.userId).emit("info_message", {
      message: `Your request was approved by ${ctx.user.username}.`,
    });
    sendRequests(ctx.room);
  });

  socket.on("reject_request", (data) => {
    const ctx = getContext(socket, "approve_request");
    if (!ctx) return;

    const index = ctx.room.requests.findIndex((r) => r.id === (data && data.requestId));
    if (index === -1) return;

    const request = ctx.room.requests.splice(index, 1)[0];
    io.to(request.userId).emit("error_message", {
      message: `Your request was rejected by ${ctx.user.username}.`,
    });
    sendRequests(ctx.room);
  });

  socket.on("chat_message", (data) => {
    const ctx = getContext(socket);
    if (!ctx) return;

    const text = String((data && data.text) || "").trim().slice(0, 300);
    if (!text) return;

    io.to(ctx.room.id).emit("chat_message", {
      id: nextMessageId++,
      userId: ctx.user.id,
      username: ctx.user.username,
      text,
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});