
import { Radio, CircleHelp } from "lucide-react";

export default function Navbar({ onHome }) {
  return (
    <header className="relative z-10 border-b border-white/[0.07] bg-[#09090f]/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-360 items-center justify-between px-5 md:px-8">
        <button
          onClick={onHome}
          className="flex items-center gap-2.5"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-violet-500 to-blue-600">
            <Radio size={19} />
          </span>

          <span className="text-left">
            <span className="block text-base font-bold tracking-tight">
              Utube<span className="text-violet-400">Party</span>
            </span>
            <span className="block text-[9px] font-semibold uppercase tracking-[.2em] text-zinc-500">
              watch together
            </span>
          </span>
        </button>

        <button
          onClick={() => alert("Create or join a room to get started!")}
          className="flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white"
        >
          <CircleHelp size={15} />
          Help
        </button>
      </div>
    </header>
  );
}
