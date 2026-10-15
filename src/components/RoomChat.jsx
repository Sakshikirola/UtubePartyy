import { useEffect, useRef, useState } from "react";
import { ChevronDown, MessageCircle, Send } from "lucide-react";
import { socket } from "../socket";

export default function RoomChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const bottomRef = useRef(null);

  // The server sends every chat message to everyone in the room (including me)
  useEffect(() => {
    function onChat(msg) {
      setMessages((current) => [...current, msg]);
    }
    socket.on("chat_message", onChat);
    return () => socket.off("chat_message", onChat);
  }, []);

  // Scroll to the newest message
  useEffect(() => {
    if (isOpen && bottomRef.current) {
      bottomRef.current.scrollIntoView({ block: "end" });
    }
  }, [messages, isOpen]);

  function sendMessage(e) {
    e.preventDefault();

    const text = message.trim();
    if (!text) return;

    socket.emit("chat_message", { text });
    setMessage("");
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-white/8 bg-[#11111a]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <MessageCircle size={19} className="text-blue-300" />
          <div>
            <h2 className="text-sm font-semibold">Room chat</h2>
            <p className="mt-1 text-xs text-zinc-500">
              {messages.length === 0
                ? "Say hi to your friends"
                : `${messages.length} messages`}
            </p>
          </div>
        </div>

        <ChevronDown
          size={17}
          className={`text-zinc-500 transition ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-white/6">
          <div className="max-h-60 space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <p className="text-xs text-zinc-500">No messages yet.</p>
            )}

            {messages.map((item) => (
              <div key={item.id} className="flex gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-linear-to-br from-blue-500 to-violet-500 text-xs font-bold">
                  {item.username[0].toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {item.username}
                    {item.userId === socket.id && (
                      <span className="ml-1 text-[10px] text-zinc-500">
                        (you)
                      </span>
                    )}
                  </p>
                  <p className="mt-1 wrap-break-word text-xs leading-5 text-zinc-400">
                    {item.text}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={sendMessage}
            className="flex gap-2 border-t border-white/6 p-3"
          >
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write a message..."
              maxLength={300}
              className="min-w-0 flex-1 rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 text-xs outline-none focus:border-violet-400/40"
            />

            <button
              type="submit"
              aria-label="Send message"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-600 hover:bg-violet-500"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </section>
  );
}