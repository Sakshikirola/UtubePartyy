import { Check } from "lucide-react";

export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 z-100 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-white/10 bg-[#20202d] px-5 py-3 text-sm shadow-2xl"
    >
      <Check size={16} className="text-emerald-400" />
      {message}
    </div>
  );
}
