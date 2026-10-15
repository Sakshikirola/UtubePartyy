
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Users,
  ArrowRight,
  Video,
  Shield,
  MessageCircle,
} from "lucide-react";

export default function HomePage({
  username,
  setUsername,
  onCreateRoom,
  onJoinRoom,
}) {
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState(
    (searchParams.get("room") || "").toUpperCase()
  );

  return (
    <main className="relative mx-auto min-h-[calc(100vh-76px)] max-w-5xl px-5 py-5 md:py-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-56 w-56 rounded-full bg-violet-700/10 blur-[100px]" />

      {/* Heading */}
      <section className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          YouTube Watch Party
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-sm leading-5 text-zinc-400">
          Create or join a room and watch YouTube videos in sync, with
          role-based playback control.
        </p>
      </section>

      {/* Create and Join cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Create Room */}
        <section className="rounded-3xl border border-violet-400/20 bg-linear-to-br from-violet-500/12 to-[#11111b] p-5 sm:p-6">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-violet-500/15 text-violet-300">
            <Plus size={21} />
          </div>

          <h2 className="text-lg font-semibold">Start a watch party</h2>

          <p className="mt-1 text-sm leading-5 text-zinc-400">
            Create a room and become its Host.
          </p>

          <label className="mt-4 block text-xs font-medium text-zinc-400">
            YOUR DISPLAY NAME
          </label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm outline-none focus:border-violet-400/60"
          />

          <button
            onClick={onCreateRoom}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Create a room <ArrowRight size={16} />
          </button>
        </section>

        {/* Join Room */}
        <section className="rounded-3xl border border-white/8 bg-[#11111a] p-5 sm:p-6">
          <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-blue-500/10 text-blue-300">
            <Users size={21} />
          </div>

          <h2 className="text-lg font-semibold">Join your friends</h2>

          <p className="mt-1 text-sm leading-5 text-zinc-400">
            Enter a room code to join as a Participant.
          </p>

          <label className="mt-4 block text-xs font-medium text-zinc-400">
            ROOM CODE
          </label>

          <div className="mt-1.5 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) =>
                e.key === "Enter" && onJoinRoom(joinCode)
              }
              placeholder="E.G. K7M2QX"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm uppercase tracking-widest outline-none focus:border-blue-400/60"
            />

            <button
              onClick={() => onJoinRoom(joinCode)}
              className="rounded-xl border border-white/10 bg-white/6 px-5 text-sm font-semibold transition hover:bg-white/10"
            >
              Join
            </button>
          </div>

          <div className="mt-4 flex gap-3 rounded-xl border border-white/6 bg-white/2.5 p-3">
            <Shield size={16} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs leading-4 text-zinc-400">
              Hosts and Moderators control playback. Participants can watch
              and send requests for them to approve.
            </p>
          </div>
        </section>
      </div>

      {/* Feature cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Video,
            title: "Watch in sync",
            description: "Play, pause and seek together",
          },
          {
            icon: Shield,
            title: "Stay in control",
            description: "Role-based room permissions",
          },
          {
            icon: MessageCircle,
            title: "Hang out together",
            description: "Chat while watching",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/2 p-3"
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/5 text-violet-300">
                <Icon size={18} />
              </div>

              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
