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
  // /?room=ABC123 (from an invite link) pre-fills the room code
  const [searchParams] = useSearchParams();
  const [joinCode, setJoinCode] = useState(
    (searchParams.get("room") || "").toUpperCase()
  );

  return (
    <main className="relative mx-auto min-h-[calc(100vh-76px)] max-w-5xl px-5 py-12 md:py-16">
      <div className="pointer-events-none absolute left-1/4 top-0 -z-10 h-72 w-72 rounded-full bg-violet-700/10 blur-[120px]" />

      <section className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          YouTube Watch Party
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-zinc-400">
          Create or join a room and watch YouTube videos in sync, with
          role-based playback control.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-3xl border border-violet-400/20 bg-linear-to-br from-violet-500/12 to-[#11111b] p-6 sm:p-8">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/15 text-violet-300">
            <Plus size={24} />
          </div>

          <h2 className="text-xl font-semibold">Start a watch party</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Create a room and become its Host.
          </p>

          <label className="mt-6 block text-xs font-medium text-zinc-400">
            YOUR DISPLAY NAME
          </label>

          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none focus:border-violet-400/60"
          />

          <button
            onClick={onCreateRoom}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold transition hover:-translate-y-0.5 hover:brightness-110"
          >
            Create a room <ArrowRight size={17} />
          </button>
        </section>

        <section className="rounded-3xl border border-white/8 bg-[#11111a] p-6 sm:p-8">
          <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-blue-500/10 text-blue-300">
            <Users size={23} />
          </div>

          <h2 className="text-xl font-semibold">Join your friends</h2>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Enter a room code to join as a Participant.
          </p>

          <label className="mt-6 block text-xs font-medium text-zinc-400">
            ROOM CODE
          </label>

          <div className="mt-2 flex gap-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={(e) =>
                e.key === "Enter" && onJoinRoom(joinCode)
              }
              placeholder="E.G. K7M2QX"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm uppercase tracking-widest outline-none focus:border-blue-400/60"
            />

            <button
              onClick={() => onJoinRoom(joinCode)}
              className="rounded-xl border border-white/10 bg-white/6 px-5 text-sm font-semibold transition hover:bg-white/10"
            >
              Join
            </button>
          </div>

          <div className="mt-6 flex gap-3 rounded-xl border border-white/6 bg-white/2.5 p-4">
            <Shield size={17} className="mt-0.5 shrink-0 text-emerald-400" />
            <p className="text-xs leading-5 text-zinc-400">
              Hosts and Moderators control playback. Participants can watch
              and send requests for them to approve.
            </p>
          </div>
        </section>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-3">
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
              className="flex items-center gap-4 rounded-2xl border border-white/6 bg-white/2 p-4"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/5 text-violet-300">
                <Icon size={19} />
              </div>

              <div>
                <p className="text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-500">
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