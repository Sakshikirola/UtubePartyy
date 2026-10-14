import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import HomePage from "./pages/Homepage";
import WatchRoom from "./pages/WatchRoom";
import Toast from "./components/Toast";
import { socket } from "./socket.js";
import { formatPeople } from "./utils/people.js";

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [people, setPeople] = useState([]); // filled by the server
  const [videoId, setVideoId] = useState("dQw4w9WgXcQ");
  const [role, setRole] = useState("Participant");
  const [toast, setToast] = useState("");

  function notify(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  useEffect(() => {
    function onError(data) {
      notify(data.message);
    }
    function onInfo(data) {
      notify(data.message);
    }
    function onDisconnect() {
      notify("Disconnected from server.");
      navigate("/");
    }

    socket.on("error_message", onError);
    socket.on("info_message", onInfo);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("error_message", onError);
      socket.off("info_message", onInfo);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (location.pathname === "/") {
      socket.emit("leave_room");
    }
  }, [location.pathname]);

  function enterRoom(res) {
    setPeople(formatPeople(res.participants, socket.id));
    setRole(res.role);
    setVideoId(res.videoId);
    navigate(`/room/${res.roomId}`);
  }

  function createRoom() {
    if (!socket.connected) {
      notify("Cannot reach the server. Is the backend running?");
      return;
    }

    const name = username.trim() || "Host";
    setUsername(name);

    socket.emit("create_room", { username: name }, (res) => {
      if (!res.ok) {
        notify(res.error);
        return;
      }
      enterRoom(res);
      notify("Watch room created!");
    });
  }

  function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      notify("Please enter a room code.");
      return;
    }
    if (!socket.connected) {
      notify("Cannot reach the server. Is the backend running?");
      return;
    }

    const name = username.trim() || "Guest";
    setUsername(name);

    socket.emit("join_room", { roomId: cleanCode, username: name }, (res) => {
      if (!res.ok) {
        notify(res.error);
        return;
      }
      enterRoom(res);
      notify(`Joined room ${cleanCode}`);
    });
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
