import { useEffect, useRef, useState } from "react";
import { Plus, Play, Pause, Youtube, Volume2 } from "lucide-react";
import Modal from "./Modal";
import { getYouTubeVideoId } from "../utils/Youtube";
import { socket } from "../socket";

// Load the YouTube IFrame API script only once for the whole app.
let apiPromise = null;
function loadYouTubeApi() {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);

    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
  });

  return apiPromise;
}

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export default function VideoPlayer({ videoId, role, notify }) {
  const [showModal, setShowModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [position, setPosition] = useState(0); // seconds
  const [duration, setDuration] = useState(0); // seconds
  const [isPlaying, setIsPlaying] = useState(false); // what the ROOM state is
  const [volume, setVolume] = useState(100);

  const canControl = role === "Host" || role === "Moderator";

  const playerDiv = useRef(null); // the <div> YouTube replaces with an iframe
  const playerRef = useRef(null); // the YT.Player object
  const readyRef = useRef(false);
  const pendingState = useRef(null); // sync_state that arrived before the player was ready
  const loadedVideo = useRef(videoId); // which video the player currently has
  const dragging = useRef(false); // true while the user drags the slider

  // ---- Apply a state sent by the server to the real YouTube player ----
  function applyState(state) {
    const player = playerRef.current;
    if (!player || !readyRef.current) {
      pendingState.current = state;
      return;
    }

    setIsPlaying(state.playState === "playing");

    // Different video -> load it (loadVideoById autoplays, cueVideoById does not)
    if (state.videoId !== loadedVideo.current) {
      loadedVideo.current = state.videoId;
      if (state.playState === "playing") {
        player.loadVideoById({ videoId: state.videoId, startSeconds: state.currentTime });
      } else {
        player.cueVideoById({ videoId: state.videoId, startSeconds: state.currentTime });
      }
      return;
    }

    // Same video -> fix the time only if we drifted, then play/pause
    const drift = Math.abs(player.getCurrentTime() - state.currentTime);
    if (drift > 1.5 || (state.playState === "paused" && drift > 0.3)) {
      player.seekTo(state.currentTime, true);
    }

    if (state.playState === "playing") player.playVideo();
    else player.pauseVideo();
  }

  // ---- Create the YouTube player once ----
  useEffect(() => {
    let destroyed = false;

    loadYouTubeApi().then((YT) => {
      if (destroyed || !playerDiv.current) return;

      playerRef.current = new YT.Player(playerDiv.current, {
        videoId: loadedVideo.current,
        width: "100%",
        height: "100%",
        playerVars: {
          controls: 0, // we use our own buttons, so everyone stays in sync
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            if (pendingState.current) {
              applyState(pendingState.current);
              pendingState.current = null;
            }
          },
        },
      });
    });

    return () => {
      destroyed = true;
      readyRef.current = false;
      if (playerRef.current && playerRef.current.destroy) {
        playerRef.current.destroy();
      }
      playerRef.current = null;
    };
  }, []);

  // ---- Listen to the server ----
  useEffect(() => {
    function onSync(state) {
      applyState(state);
    }
    socket.on("sync_state", onSync);

    // Ask for the current state when we enter the room (late joiners)
    socket.emit("request_sync");

    // Every 5 seconds ask again to fix small drifts (buffering etc.)
    const timer = window.setInterval(() => socket.emit("request_sync"), 5000);

    return () => {
      socket.off("sync_state", onSync);
      window.clearInterval(timer);
    };
  }, []);

  // ---- Update the slider every 500ms from the real player ----
  useEffect(() => {
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || !readyRef.current || dragging.current) return;
      setPosition(player.getCurrentTime() || 0);
      setDuration(player.getDuration() || 0);
    }, 500);
    return () => window.clearInterval(timer);
  }, []);

  // ---- User actions ----
  // Host/Moderator -> send the real event. Participant -> send a request.
  function currentPlayerTime() {
    const player = playerRef.current;
    return player && readyRef.current ? player.getCurrentTime() : 0;
  }

  function send(action, data) {
    if (canControl) {
      socket.emit(action, data);
    } else {
      socket.emit("request_action", { action, data });
    }
  }

  function togglePlay() {
    const action = isPlaying ? "pause" : "play";
    send(action, { currentTime: currentPlayerTime() });
  }

  function finishSeek(e) {
    if (!dragging.current) return; // ignore keys like Tab
    dragging.current = false;
    send("seek", { time: Number(e.target.value) });
  }

  function loadVideo() {
    const id = getYouTubeVideoId(videoUrl);

    if (!id) {
      notify("Please enter a valid YouTube URL or video ID.");
      return;
    }

    send("change_video", { videoId: id });
    setVideoUrl("");
    setShowModal(false);
  }

  function changeVolume(e) {
    const v = Number(e.target.value);
    setVolume(v);
    if (playerRef.current && readyRef.current) playerRef.current.setVolume(v);
  }

  return (
    <section className="mx-auto w-full min-w-0 max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-[#11111a]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/6 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2 text-sm">
          <Youtube size={18} className="text-red-400" />
          <span className="font-medium">Now watching</span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/4 px-3 py-2 text-xs font-medium hover:bg-white/8"
        >
          <Plus size={15} />
          {canControl ? "Change video" : "Request new video"}
        </button>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        <div ref={playerDiv} className="h-full w-full" />
        {/* Transparent layer: nobody can click inside the video directly.
            All control goes through our buttons -> server -> everyone. */}
        <div className="absolute inset-0" />
      </div>

      <div className="p-4 sm:p-5">
        <div className="mt-1">
          <div className="mb-2 flex justify-between text-[11px] text-zinc-500">
            <span>
              {canControl
                ? "You control playback"
                : "Participant: your actions are sent as requests"}
            </span>
            <span>
              {formatTime(position)} / {formatTime(duration)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max={Math.max(duration, 1)}
            step="1"
            value={Math.min(position, Math.max(duration, 1))}
            onChange={(e) => {
              dragging.current = true;
              setPosition(Number(e.target.value));
            }}
            onPointerUp={finishSeek}
            onKeyUp={finishSeek}
            aria-label="Playback position"
            className="w-full accent-violet-500"
          />

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              className="grid h-10 w-10 place-items-center rounded-xl bg-violet-600 hover:bg-violet-500"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </button>

            <span className="text-xs text-zinc-400">
              {isPlaying ? "Playing" : "Paused"}
              {!canControl && " (request to change)"}
            </span>

            <div className="ml-auto flex items-center gap-2 text-zinc-400">
              <Volume2 size={15} />
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={changeVolume}
                aria-label="Volume (only for you)"
                className="w-24 accent-violet-500"
              />
            </div>
          </div>

          {!canControl && (
            <p className="mt-3 text-xs text-amber-300/80">
              The Host or a Moderator must approve your requests.
            </p>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-white/6 bg-black/20 px-3.5 py-3">
          <p className="text-xs font-medium">Synchronization status</p>
          <p className="mt-1 text-[10px] text-emerald-300">
            Live — connected to the room through WebSocket
          </p>
        </div>
      </div>

      {showModal && (
        <Modal
          title={canControl ? "Change the video" : "Request a new video"}
          description={
            canControl
              ? "Paste a YouTube URL or video ID."
              : "Paste a YouTube URL. The Host/Moderator will approve it."
          }
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
              {canControl ? "Load video" : "Send request"}
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
