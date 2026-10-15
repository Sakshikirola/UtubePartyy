import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Link2, LogOut, Radio } from "lucide-react";

import VideoPlayer from "../components/VideoPlayer";
import ParticipantList from "../components/Participants";
import RoomChat from "../components/RoomChat";
import Requests from "../components/Requests";
import Modal from "../components/Modal";
import { socket } from "../socket";
import { formatPeople } from "../utils/people";

export default function WatchRoomPage({
  joinedRoomId,
  role,
  setRole,
  people,
  setPeople,
  videoId,
  notify,
}) {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const [showInvite, setShowInvite] = useState(false);

  const inviteLink = `${window.location.origin}/room/${roomCode}`;

  // Opened /room/CODE directly (or refreshed) without joining first?
  // Send the user to the home page with the code already filled in.
  const notJoined = joinedRoomId !== roomCode;
  useEffect(() => {
    if (notJoined) navigate(`/?room=${roomCode}`, { replace: true });
  }, [notJoined, roomCode]);

  // Update the participant list AND my own role from what the server says.
  function applyParticipants(list) {
    setPeople(formatPeople(list, socket.id));
    const me = list.find((p) => p.id === socket.id);
    if (me) setRole(me.role);
  }

  // Events the server sends to the whole room
  useEffect(() => {
    function onJoined(d) {
      applyParticipants(d.participants);
      notify(`${d.username} joined the room`);
    }
    function onLeft(d) {
      applyParticipants(d.participants);
      notify(`${d.username} left the room`);
    }
    function onRoleAssigned(d) {
      applyParticipants(d.participants);
      if (d.userId === socket.id) notify(`You are now a ${d.role}`);
      else notify(`${d.username} is now a ${d.role}`);
    }
    function onHostChanged(d) {
      applyParticipants(d.participants);
      if (d.userId === socket.id) notify("You are now the Host");
      else notify(`${d.username} is now the Host`);
    }
    function onRemoved(d) {
      if (d.userId === socket.id) {
        notify("You were removed from the room by the Host.");
        navigate("/");
        return;
      }
      applyParticipants(d.participants);
      notify(`${d.username} was removed from the room`);
    }

    socket.on("user_joined", onJoined);
    socket.on("user_left", onLeft);
    socket.on("role_assigned", onRoleAssigned);
    socket.on("host_changed", onHostChanged);
    socket.on("participant_removed", onRemoved);

    return () => {
      socket.off("user_joined", onJoined);
      socket.off("user_left", onLeft);
      socket.off("role_assigned", onRoleAssigned);
      socket.off("host_changed", onHostChanged);
      socket.off("participant_removed", onRemoved);
    };
  }, []);

  function copyText(text, label) {
    if (!navigator.clipboard) {
      notify(`${label}: ${text}`);
      return;
    }

    navigator.clipboard
      .writeText(text)
      .then(() => notify(`${label} copied!`))
      .catch(() => notify(`${label}: ${text}`));
  }

  if (notJoined) return null;

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
                onClick={() => copyText(roomCode, "Room code")}
                aria-label="Copy room code"
                className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.07] hover:text-white"
              >
                <Copy size={15} />
              </button>
            </div>
          </div>

          <VideoPlayer videoId={videoId} role={role} notify={notify} />
        </div>

        <aside className="space-y-5">
          <Requests />

          <ParticipantList people={people} role={role} notify={notify} />

          <RoomChat />

          <section className="rounded-2xl border border-violet-400/15 bg-linear-to-br from-violet-500/8 to-blue-500/4 p-4">
            <div className="flex items-center gap-2 text-violet-200">
              <Radio size={15} />
              <span className="text-xs font-semibold">Your permissions</span>
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-400">
              Your role:{" "}
              <strong className="text-zinc-200">{role}</strong>.{" "}
              {role === "Host" && "You can control playback, assign roles and remove people."}
              {role === "Moderator" && "You can control playback and approve requests."}
              {role === "Participant" && "You can watch and send requests to the Host/Moderator."}
            </p>
          </section>
        </aside>
      </div>

      {showInvite && (
        <Modal
          title="Invite your friends"
          description="Share this room code or link with your friends."
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
              onClick={() => copyText(roomCode, "Room code")}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-semibold hover:bg-violet-500"
            >
              <Copy size={14} />
              Copy code
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
            <p className="min-w-0 truncate font-mono text-xs text-zinc-400">
              {inviteLink}
            </p>

            <button
              onClick={() => copyText(inviteLink, "Invite link")}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/5"
            >
              <Copy size={14} />
              Copy link
            </button>
          </div>

          <p className="mt-4 text-xs leading-5 text-zinc-500">
            Friends can paste the code on the home page, or open the link and
            just press Join.
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
