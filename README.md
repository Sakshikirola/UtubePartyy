# UtubeParty — YouTube Watch Party

Watch YouTube videos together in real time. One person creates a room, friends join with a code or link, and play / pause / seek / change-video stay in sync for everyone. Rooms have roles (Host, Moderator, Participant) that are enforced on the server.

**Live demo:** https://YOUR-FRONTEND-URL (add after deploying)
**Backend:** https://YOUR-BACKEND-URL (add after deploying)

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router |
| Backend | Node.js, Express, Socket.IO (WebSockets) |
| Video | YouTube IFrame Player API |
| Storage | In-memory (rooms live in server memory) |

## Features

- Create a room (you become **Host**) and share the 6-character code or invite link
- Join a room with a code or link (you become **Participant**)
- Real-time sync of play, pause, seek and change video
- Roles: Host / Moderator / Participant, shown in the participant list
- Host can assign roles, remove participants and transfer the Host role
- Participants can send a **request** (play, pause, seek, new video) that the Host/Moderator approves or rejects
- Live room chat

## Roles

| Role | Permissions |
| --- | --- |
| Host (room creator) | play, pause, seek, change video, approve requests, assign roles, remove participants, transfer host |
| Moderator (assigned by Host) | play, pause, seek, change video, approve requests |
| Participant (default) | watch, chat, send requests |

All permission checks happen on the server (`backend/server.js`, the `PERMISSIONS` table and `can()`), so hiding a button in the UI is only for convenience — a Participant who sends `change_video` by hand is rejected.

## Run locally

You need Node.js 20+ and npm.

**1. Backend**

```bash
cd backend
npm install
npm start          # runs on http://localhost:4000
```

**2. Frontend** (in a second terminal, from the project root)

```bash
npm install
npm run dev        # open the URL Vite prints, usually http://localhost:5173
```

The frontend connects to `http://localhost:4000` by default. To use another backend, copy `.env.example` to `.env` and change `VITE_SERVER_URL`.

**3. Test it:** open the app in two different browsers (or one normal and one incognito window), create a room in the first, join with the code in the second.

## Architecture

```
Browser (React)  <——— WebSocket (Socket.IO) ———>  Node server (Express + Socket.IO)
  YouTube IFrame player                              rooms = { CODE: { users, videoId,
  our own play/seek buttons                                           playState, currentTime,
                                                                      requests } }
```

How a play/pause/seek works:

1. A Host/Moderator clicks a button. The browser sends an event (`play`, `pause`, `seek`, `change_video`) to the server. It does **not** touch its own player yet.
2. The server checks the sender's role. If not allowed, it replies with `error_message`.
3. If allowed, the server updates the room state and broadcasts `sync_state { playState, currentTime, videoId }` to everyone in the room.
4. Every browser (including the sender) receives `sync_state` and tells its YouTube player to play, pause or seek.

So the server is the single source of truth. Late joiners and drifting clients ask for the current state (`request_sync`, also automatically every 5 seconds) and correct themselves. The YouTube player's own controls are hidden so nobody can change their video out of sync; all control goes through the server.

### WebSocket events

| Event | Direction | Notes |
| --- | --- | --- |
| `create_room`, `join_room`, `leave_room` | client → server | Creator = Host, joiner = Participant |
| `play`, `pause`, `seek`, `change_video` | client → server | Host / Moderator only |
| `sync_state` | server → clients | Current video state |
| `assign_role`, `remove_participant`, `transfer_host` | client → server | Host only |
| `user_joined`, `user_left`, `role_assigned`, `participant_removed`, `host_changed` | server → clients | Include the updated participant list |
| `request_action`, `approve_request`, `reject_request`, `requests_updated` | both | Participant request flow |
| `chat_message` | both | Room chat |
| `error_message`, `info_message` | server → client | Shown as toasts |

## Deployment (Render)

Deploy the backend and the frontend as two services from the same repository.

**Backend → Render "Web Service"**

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Environment variable: `CLIENT_URL` = your frontend URL (for example `https://your-frontend.onrender.com`, no trailing slash)

**Frontend → Render "Static Site"**

- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_SERVER_URL` = your backend URL (for example `https://your-backend.onrender.com`)
- Add a **Rewrite** rule: source `/*`, destination `/index.html` (needed so invite links like `/room/ABC123` work on refresh)

Notes:

- `VITE_SERVER_URL` is read at build time, so redeploy the frontend after changing it.
- Free Render services sleep when idle; the first request after a pause can take about 30–60 seconds.
- Rooms are stored in memory, so a server restart clears all rooms.

## Trade-offs and limitations

- Rooms are in memory (no database), so they are lost on restart and the app runs as a single server instance. Scaling to several instances would need the Socket.IO Redis adapter.
- Refreshing the page leaves the room (a new socket connection is a new user).
- Browsers may block autoplay with sound until the user has interacted with the page.
- Volume is controlled per person and is not synchronized.