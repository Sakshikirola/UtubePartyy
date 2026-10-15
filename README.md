# UtubeParty — YouTube Watch Party

Watch YouTube videos together in real time. One person creates a room, friends
join with a 6-character code or an invite link, and play / pause / seek /
change-video stay in sync for everyone. Rooms have roles (Host, Moderator,
Participant) that the **server** enforces.

Live app: https://utube-partyy.vercel.app/
Backend: https://utubepartyy.onrender.com

## Tech stack

| Layer | Technology | Why |
| --- | --- | --- |
| Frontend | React 18, Vite, Tailwind CSS, React Router | UI, routing for `/room/:code` |
| Backend | Node.js, Express, Socket.IO | HTTP server plus WebSocket communication |
| Real-time | Socket.IO (WebSocket transport) | Rooms, broadcast, automatic reconnect |
| Video | YouTube IFrame Player API | Embedded, scriptable player |
| Database | Supabase (PostgreSQL), optional | Saves rooms and chat history |

## Features

- Create a room (you become **Host**); share the code or invite link
- Join with a code or link (you become **Participant**)
- Real-time sync of play, pause, seek and change video
- Participant list showing each person's role
- Host can assign roles, remove participants and transfer the Host role
- Participants can send **requests** (play, pause, seek, new video) that a
  Host or Moderator approves or rejects
- Live chat with saved history
- Rooms survive a server restart (when Supabase is configured)

## Roles

| Role | Who assigns it | Permissions |
| --- | --- | --- |
| Host | Automatic (room creator) | play, pause, seek, change video, approve requests, assign roles, remove participants, transfer host |
| Moderator | Host | play, pause, seek, change video, approve requests |
| Participant | Default for joiners | Watch, chat, send requests |

Permissions live in one table (`PERMISSIONS` in `backend/server.js`) and are
checked by `can()` before every event. Hiding a button in the UI is only for
convenience: a Participant who emits `change_video` by hand gets
`Permission denied`.

## Run locally

Requires Node.js 20+.

```bash
# 1. Backend
cd backend
cp .env.example .env       # Supabase values are optional
npm install
npm start                  # http://localhost:4000

# 2. Frontend (second terminal, project root)
cp .env.example .env
npm install
npm run dev                # http://localhost:5173
```

Test it: open the app in a normal window and an incognito window. Create a
room in one and join with the code in the other.

### Optional: Supabase (persistent rooms and chat)

Without these variables the app works, but rooms live only in memory. To enable
persistence, create a Supabase project, run this SQL, and put `SUPABASE_URL`
and `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`:

```sql
create table rooms (
  id text primary key,
  video_id text,
  play_state text,
  current_time_sec double precision default 0,
  host_name text,
  participants jsonb default '[]',
  updated_at timestamptz default now()
);

create table messages (
  id bigint generated always as identity primary key,
  room_id text not null,
  username text not null,
  text text not null,
  created_at timestamptz default now()
);
```

The service-role key is used **only on the backend** and must never be put in
the frontend or committed to Git.

## Architecture

```
Browser (React) ←— WebSocket (Socket.IO) —→ Node server (Express + Socket.IO)
  YouTube IFrame player                       rooms = { CODE: { users, videoId,
  custom play/seek controls                                    playState, currentTime,
                                                               requests } }
                                                          │
                                                          └→ Supabase (optional)
```

### How a play / pause / seek works

1. A Host or Moderator clicks a control. The browser emits `play`, `pause`,
   `seek` or `change_video`. It does **not** touch its own player yet.
2. The server looks up the sender's role and calls `can(user, action)`. If it
   is not allowed, the server replies with `error_message` and stops.
3. If allowed, the server updates the room state and broadcasts
   `sync_state { playState, currentTime, videoId }` to everyone in the room.
4. Every browser, including the sender, receives `sync_state` and tells its
   YouTube player to play, pause or seek.

The server is the single source of truth. The YouTube player's own controls
are hidden (`controls: 0` plus a transparent overlay), so nobody can change
their video out of sync.

### Staying in sync

- **Late joiners:** on entering the room, the client emits `request_sync` and
  gets the current state. While playing, the server computes the live position
  as `currentTime + (now − updatedAt)`.
- **Drift correction:** every client asks for the state every 5 seconds and
  seeks only if it is more than 1.5 s off. This fixes buffering and tab
  throttling without constant jumping.

### Participant requests

A Participant's controls emit `request_action` instead of the real event. The
server stores the request, sends the list **only** to users who can approve
(`requests_updated`), and a Host or Moderator approves or rejects it. Approval
runs the same `applyAction()` used by direct actions, so there is one code path.

### Host leaving

If the Host disconnects, the server promotes a Moderator (or else the next
user) to Host and broadcasts `host_changed`. An empty room is removed from
memory, but its state stays in Supabase.

### WebSocket events

| Event | Direction | Notes |
| --- | --- | --- |
| `create_room`, `join_room`, `leave_room` | client → server | Creator = Host, joiner = Participant |
| `play`, `pause`, `seek`, `change_video` | client → server | Host / Moderator only |
| `sync_state` | server → clients | Current video state |
| `request_sync` | client → server | Late join and drift correction |
| `assign_role`, `remove_participant`, `transfer_host` | client → server | Host only |
| `user_joined`, `user_left`, `role_assigned`, `participant_removed`, `host_changed` | server → clients | Carry the updated participant list |
| `request_action`, `approve_request`, `reject_request`, `requests_updated` | both | Participant request flow |
| `chat_message`, `request_chat_history`, `chat_history` | both | Chat |
| `error_message`, `info_message` | server → client | Shown as toasts |

## Deployment

- **Backend → Render** (Web Service, root directory `backend`)
- **Frontend → Vercel** (Vite project, root directory `/`)

Environment variables:

| Where | Variable | Value |
| --- | --- | --- |
| Render | `CLIENT_URL` | Vercel URL, no trailing slash |
| Render | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Optional |
| Vercel | `VITE_SERVER_URL` | Render URL, no trailing slash |

`VITE_SERVER_URL` is baked in at build time, so **redeploy the frontend after
changing it**. `vercel.json` rewrites every path to `index.html`, so invite
links like `/room/ABC123` work on refresh.

## Trade-offs and limitations

- The Socket.IO server runs as one instance, with rooms in memory. To scale
  horizontally you would add the Socket.IO Redis adapter (Pub/Sub) so
  broadcasts reach clients on other instances, plus sticky sessions on the
  load balancer.
- Refreshing the page leaves the room, because a new socket is a new user.
  Fixing this needs a persistent user ID (for example, authentication).
- Identity is only a display name, so there is no authentication. Anyone with
  a code can join.
- Browsers may block autoplay with sound until the user interacts.
- Volume is per person and not synchronized.
- Free Render services sleep when idle, and rooms held only in memory are lost
  on restart unless Supabase is configured.