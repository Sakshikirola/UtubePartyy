
import { useState } from "react";
import {BrowserRouter, Routes, Route, useNavigate, useParams,} from "react-router-dom";

import Navbar from "./components/Navbar";
import HomePage from "./pages/Homepage";
import WatchRoom from "./pages/WatchRoom";
import Toast from "./components/Toast"; 

const initialPeople = [
  {
    id: 1,
    name: "Sakshi",
    initials: "S",
    role: "Host",
    color: "from-violet-500 to-indigo-500",
    you: true,
  },
  {
    id: 2,
    name: "Aarav",
    initials: "A",
    role: "Moderator",
    color: "from-sky-500 to-cyan-400",
  },
  {
    id: 3,
    name: "Priya",
    initials: "P",
    role: "Participant",
    color: "from-pink-500 to-rose-400",
  },
];

function AppContent() {
  const navigate = useNavigate();
  const { roomCode } = useParams();

  const [username, setUsername] = useState("Sakshi");
  const [people, setPeople] = useState(initialPeople);
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [role, setRole] = useState("Host");
  const [toast, setToast] = useState("");

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function createRoom() {
    const code = Math.random()
      .toString(36)
      .slice(2, 8)
      .toUpperCase();

    const name = username.trim() || "Host";

    setUsername(name);
    setRole("Host");
    setPeople([
      {
        id: Date.now(),
        name,
        initials: name[0].toUpperCase(),
        role: "Host",
        color: "from-violet-500 to-indigo-500",
        you: true,
      },
    ]);

    navigate(`/room/${code}`);
    notify("Watch room created!");
  }

  function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      notify("Please enter a room code.");
      return;
    }

    const name = username.trim() || "Participant";

    setUsername(name);
    setRole("Participant");
    setPeople([
      {
        id: 1,
        name: "Room Host",
        initials: "H",
        role: "Host",
        color: "from-violet-500 to-indigo-500",
      },
      {
        id: Date.now(),
        name,
        initials: name[0].toUpperCase(),
        role: "Participant",
        color: "from-sky-500 to-cyan-400",
        you: true,
      },
    ]);

    navigate(`/room/${cleanCode}`);
    notify(`Joined demo room ${cleanCode}`);
  }

  return (
    <>
      <Navbar onHome={() => navigate("/")} />

      <Routes>
        <Route
          path="/"
          element={
            <HomePage
              username={username}
              setUsername={setUsername}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
            />
          }
        />

        <Route
          path="/room/:roomCode"
          element={
            <WatchRoom
              roomCode={roomCode}
              username={username}
              role={role}
              setRole={setRole}
              people={people}
              setPeople={setPeople}
              videoId={videoId}
              setVideoId={setVideoId}
              notify={notify}
            />
          }
        />

        <Route
          path="*"
          element={
            <main className="mx-auto max-w-3xl px-5 py-24 text-center">
              <h1 className="text-3xl font-bold">Page not found</h1>
              <button
                onClick={() => navigate("/")}
                className="mt-5 rounded-xl bg-violet-600 px-5 py-3"
              >
                Back to Home
              </button>
            </main>
          }
        />
      </Routes>

      <Toast message={toast} />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
