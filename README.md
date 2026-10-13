# SyncRoom — YouTube Watch Party UI Prototype

A beginner-friendly React + Tailwind CSS interface prototype for a YouTube Watch Party assignment.

## Features in this prototype

- Create a demo room and receive a room code
- Join a demo room using a room code
- Embed a YouTube video and load another YouTube URL
- Demo play/pause and seek controls
- Show participants and roles
- Host can promote a participant to Moderator or return them to Participant
- Host can remove a participant
- Invite dialog and copy room code
- Optional local demo chat
- Responsive dark UI with purple/blue accents

## Important limitation

This is the **frontend UI prototype only**. It does not yet have a Node/Express backend, Socket.IO/WebSocket communication, real multi-user room sharing, secure backend role enforcement, or persistent database storage. The playback buttons and role changes currently update local React state only. Do not describe the app as real-time synchronized until the backend is implemented and tested with separate browsers/devices.

## Requirements

- Node.js 20+ recommended
- npm

## Run locally

1. Extract this project.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL Vite prints, commonly `http://localhost:5173`.

## Build check

```bash
npm run build
```

## Suggested next steps for the assignment

1. Create a Node.js + Express server.
2. Add Socket.IO to the server and frontend.
3. Implement `create_room`, `join_room`, `play`, `pause`, `seek`, `change_video`, `assign_role`, and `remove_participant` events.
4. Keep room state and participant roles on the server.
5. Validate permissions on the backend before broadcasting actions.
6. Use the YouTube IFrame Player API to control playback. The current iframe is embedded, but the prototype's custom controls do not yet control the actual YouTube player.
7. Add Supabase only where persistence is needed (e.g. room metadata or user profiles).
8. Deploy the frontend and WebSocket server, then test with two separate browser sessions.

## Suggested folder structure

```text
youtube-watch-party-prototype/
├── index.html
├── package.json
├── vite.config.js
├── README.md
└── src/
    ├── App.jsx
    ├── index.css
    └── main.jsx
```
