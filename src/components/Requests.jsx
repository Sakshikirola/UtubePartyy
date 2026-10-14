import { useEffect, useState } from "react";
import { Bell, Check, X } from "lucide-react";
import { socket } from "../socket";

function describe(request) {
  if (request.action === "play") return "play the video";
  if (request.action === "pause") return "pause the video";
  if (request.action === "seek") return `jump to ${Math.round(request.data.time)}s`;
  if (request.action === "change_video")
    return `change video to ${request.data.videoId}`;
  return request.action;
}

// Shown only to Host / Moderator (the server sends an empty list to others)
export default function Requests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    function onUpdate(data) {
      setRequests(data.requests);
    }
    socket.on("requests_updated", onUpdate);
    return () => socket.off("requests_updated", onUpdate);
  }, []);

  if (requests.length === 0) return null;

  return (
    <section className="rounded-3xl border border-amber-400/20 bg-[#11111a] p-4">
      <div className="mb-3 flex items-center gap-2 text-amber-300">
        <Bell size={16} />
        <h2 className="text-sm font-semibold">
          Requests ({requests.length})
        </h2>
      </div>

      <div className="space-y-2">
        {requests.map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-white/4 px-3 py-2"
          >
            <p className="min-w-0 text-xs text-zinc-300">
              <strong>{request.username}</strong> wants to {describe(request)}
            </p>

            <div className="flex shrink-0 gap-1">
              <button
                onClick={() =>
                  socket.emit("approve_request", { requestId: request.id })
                }
                aria-label="Approve"
                className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
              >
                <Check size={15} />
              </button>

              <button
                onClick={() =>
                  socket.emit("reject_request", { requestId: request.id })
                }
                aria-label="Reject"
                className="grid h-8 w-8 place-items-center rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
