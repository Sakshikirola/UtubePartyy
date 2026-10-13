export default function Avatar({ person, size = "md" }) {
  const sizeClass =
    size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";

  return (
    <div
      className={`grid ${sizeClass} shrink-0 place-items-center rounded-full bg-linear-to-br ${person.color} font-bold text-white ring-2 ring-[#151520]`}
    >
      {person.initials}
    </div>
  );
} 
