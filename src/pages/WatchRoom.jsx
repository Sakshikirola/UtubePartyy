import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Link2, LogOut, Radio } from "lucide-react";

import VideoPlayer from "../components/VideoPlayer";
import ParticipantList from "../components/Participants";
import RoomChat from "../components/RoomChat";
import Modal from "../components/Modal";

export default function WatchRoomPage({
  roomCode,
  username,
  role,
  people,
  setPeople, 
  videoId,
  setVideoId,
  notify,
}) {
  const navigate = useNavigate();
  const [showInvite, setShowInvite] = useState(false);

  function copyRoomCode() {
    if (!navigator.clipboard) {
      notify(`Your room code is ${roomCode}`);
      return;
    }

    navigator.clipboard
      .writeText(roomCode)
      .then(() => notify("Room code copied!"))
      .catch(() => notify(`Your room code is ${roomCode}`));
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-76px)] max-w-360 px-5 pt-3 pb-8 md:px-8 md:pt-4 md:pb-12">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => navigate("/")}
            className="mb-3 flex items-center gap-2 text-xs text-zinc-500 hover:text-white"
          >
            <ArrowLeft size={14} />
            Back to home
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Your watch room
            </h1>

            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Room active
            </span>
          </div>

          <p className="mt-2 text-sm text-zinc-500">
            Settle in, share the room code, and press play.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-4 py-2.5 text-sm hover:bg-white/8"
          >
            <Link2 size={16} />
            Invite friends
          </button>

          <button
            onClick={() => navigate("/")}
            title="Leave room"
            className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/6 hover:text-white"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#11111a] px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Radio size={17} className="text-violet-300" />
              <span className="font-medium">Room code</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-sm tracking-widest text-zinc-300">
                {roomCode}
              </span>

              <button
                onClick={copyRoomCode}
                aria-label="Copy room code"
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.07] hover:text-white"
              >
                <Copy size={15} />
              </button>
            </div>
          </div>

          <VideoPlayer
            videoId={videoId}
            setVideoId={setVideoId}
            role={role}
            notify={notify}
          />
        </div>

        <aside className="space-y-5">
          <ParticipantList
            people={people}
            role={role}
            setPeople={setPeople}
            notify={notify}
          />

          <RoomChat username={username} />

          <section className="rounded-2xl border border-violet-400/15 bg-linear-to-br from-violet-500/8 to-blue-500/4 p-4">
            <div className="flex items-center gap-2 text-violet-200">
              <Radio size={15} />
              <span className="text-xs font-semibold">Prototype status</span>
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Your role:{" "}
              <strong className="text-zinc-200">{role}</strong>.
              Playback synchronization and shared rooms require the backend.
            </p>
          </section>
        </aside>
      </div>

      {showInvite && (
        <Modal
          title="Invite your friends"
          description="Share this room code with your friends."
          onClose={() => setShowInvite(false)}
        >
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-violet-400/20 bg-violet-400/6 p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Room code
              </p>

              <p className="mt-1 font-mono text-2xl font-bold tracking-widest">
                {roomCode}
              </p>
            </div>

            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-semibold hover:bg-violet-500"
            >
              <Copy size={14} />
              Copy code
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-500">
            This prototype displays a room code but does not yet connect
            separate browsers to the same room.
          </p>

          <button
            onClick={() => setShowInvite(false)}
            className="mt-5 w-full rounded-xl border border-white/10 px-4 py-3 text-sm hover:bg-white/5"
          >
            Done
          </button>
        </Modal>
      )}
    </main>
  );
}
