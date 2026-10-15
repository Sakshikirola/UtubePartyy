import { useState } from "react";
import { Crown, MoreHorizontal, Shield, Users, X } from "lucide-react";
import Avatar from "./Avatar";
import { socket } from "../socket";

export default function ParticipantList({ people, role, notify }) {
  const [openMenu, setOpenMenu] = useState(null);
  const isHost = role === "Host";

  // The server checks the role again, and then tells everyone (role_assigned).
  function assignRole(id, nextRole) {
    if (!isHost) {
      notify("Only the Host can assign roles.");
      return;
    }
    socket.emit("assign_role", { userId: id, role: nextRole });
    setOpenMenu(null);
  }

  function removePerson(id) {
    if (!isHost) {
      notify("Only the Host can remove participants.");
      return;
    }
    socket.emit("remove_participant", { userId: id });
    setOpenMenu(null);
  }

  function makeHost(id) {
    if (!isHost) {
      notify("Only the Host can transfer the Host role.");
      return;
    }
    socket.emit("transfer_host", { userId: id });
    setOpenMenu(null);
  }

  return (
    <section className="rounded-3xl border border-white/8 bg-[#11111a]">
      <div className="flex items-center justify-between border-b border-white/6 px-5 py-4">
        <div>
          <h2 className="font-semibold">People in room</h2>
          <p className="mt-1 text-xs text-zinc-500">
            {people.length} {people.length === 1 ? "person" : "people"} here
          </p>
        </div>

        <Users size={19} className="text-violet-300" />
      </div>

      <div className="space-y-1 p-3">
        {people.map((person) => (
          <div
            key={person.id}
            className="group relative flex items-center gap-3 rounded-2xl px-2 py-3 hover:bg-white/[0.035]"
          >
            <Avatar person={person} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-sm font-medium">
                  {person.name}
                  {person.you && (
                    <span className="ml-1 text-[10px] text-zinc-500">
                      (you)
                    </span>
                  )}
                </p>

                {person.role === "Host" && (
                  <Crown size={13} className="text-amber-300" />
                )}
              </div>

              <p
                className={`mt-1 text-[11px] ${
                  person.role === "Host"
                    ? "text-amber-300"
                    : person.role === "Moderator"
                    ? "text-violet-300"
                    : "text-zinc-500"
                }`}
              >
                {person.role}
              </p>
            </div>

            {isHost && !person.you && (
              <div className="relative">
                <button
                  onClick={() =>
                    setOpenMenu(openMenu === person.id ? null : person.id)
                  }
                  aria-label={`Manage ${person.name}`}
                  className="grid h-8 w-8 place-items-center rounded-lg text-zinc-400 hover:bg-white/[0.07]"
                >
                  <MoreHorizontal size={17} />
                </button>

                {openMenu === person.id && (
                  <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-white/10 bg-[#1b1b28] p-1.5 shadow-2xl">
                    <button
                      onClick={() => assignRole(person.id, "Moderator")}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-white/[0.07]"
                    >
                      <Shield size={14} />
                      Make Moderator
                    </button>

                    <button
                      onClick={() => assignRole(person.id, "Participant")}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-white/[0.07]"
                    >
                      <Users size={14} />
                      Make Participant
                    </button>

                    <button
                      onClick={() => makeHost(person.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs hover:bg-white/[0.07]"
                    >
                      <Crown size={14} />
                      Make Host
                    </button>

                    <button
                      onClick={() => removePerson(person.id)}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-rose-300 hover:bg-rose-400/10"
                    >
                      <X size={14} />
                      Remove participant
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
