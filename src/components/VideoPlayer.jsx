import { useState } from "react";
import { Plus, Play, Pause, Youtube } from "lucide-react";
import Modal from "./Modal";
import { getYouTubeVideoId } from "../utils/youtube";

export default function VideoPlayer({
  videoId,
  setVideoId,
  role,
  notify,
}) {
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [position, setPosition] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const canControl = role === "Host" || role === "Moderator";

  function loadVideo() {
    const id = getYouTubeVideoId(videoUrl);

    if (!id) {
      notify("Please enter a valid YouTube URL or video ID.");
      return;
    }

    setVideoId(id);
    setPosition(0);
    setIsPlaying(false);
    setVideoUrl("");
    setShowModal(false);
    notify("Video loaded in the prototype.");
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#11111a]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-sm">
          <Youtube size={18} className="text-red-400" />
          <span className="font-medium">Now watching</span>
        </div>

        <button
          disabled={!canControl}
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium hover:bg-white/8 disabled:opacity-40"
        >
          <Plus size={15} />
          Change video
        </button>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          key={videoId}
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
          title="YouTube watch party video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>

      <div className="p-4 sm:p-5">
        <h2 className="font-semibold">Video in your watch party</h2>

        <p className="mt-1 text-xs text-zinc-500">
          YouTube · Embedded video
        </p>

        <div className="mt-5">
          <div className="mb-2 flex justify-between text-[11px] text-zinc-500">
            <span>
              {canControl
                ? "Playback demo controls"
                : "Playback access: Host / Moderator"}
            </span>
            <span>{position}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            value={position}
            disabled={!canControl}
            onChange={(e) => setPosition(Number(e.target.value))}
            aria-label="Demo playback position"
            className="w-full accent-violet-500 disabled:opacity-40"
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              disabled={!canControl}
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? "Pause demo" : "Play demo"}
              className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40"
            >
              {isPlaying ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>

            <span className="text-xs text-zinc-400">
              {isPlaying ? "Playing demo state" : "Paused demo state"}
            </span>
          </div>

          {!canControl && (
            <p className="mt-3 text-xs text-amber-300/80">
              Ask the Host to grant playback access.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-white/6 bg-black/20 px-3.5 py-3">
          <p className="text-xs font-medium">Synchronization status</p>
          <p className="mt-1 text-[10px] text-amber-300">
            Frontend demo — WebSocket connection pending
          </p>
        </div>
      </div>

      {showModal && (
        <Modal
          title="Change the video"
          description="Paste a YouTube URL or video ID."
          onClose={() => setShowModal(false)}
        >
          <label className="text-xs font-medium text-zinc-400">
            YOUTUBE URL
          </label>

          <input
            autoFocus
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadVideo()}
            placeholder="https://youtube.com/watch?v=..."
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none focus:border-violet-400/50"
          />

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowModal(false)}
              className="rounded-xl px-4 py-2.5 text-sm text-zinc-400 hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              onClick={loadVideo}
              className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold hover:bg-violet-500"
            >
              Load video
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
