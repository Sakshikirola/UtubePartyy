
import { X } from "lucide-react";

export default function Modal({ title, description, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#151520] p-6 shadow-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description && (
              <p className="mt-1 text-xs leading-5 text-zinc-500">
                {description}
              </p>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-white/[0.07] hover:text-white"
          >
            <X size={17} />
          </button>
        </div>

        {children}
      </section>
    </div>
  );
}
