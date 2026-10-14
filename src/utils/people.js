const colors = [
  "from-violet-500 to-indigo-500",
  "from-sky-500 to-cyan-400",
  "from-pink-500 to-rose-400",
  "from-emerald-500 to-teal-400",
  "from-amber-500 to-orange-400",
];

export function formatPeople(list, myId) {
  return list.map((p) => ({
    id: p.id,
    name: p.username,
    initials: p.username[0].toUpperCase(),
    role: p.role,
    color: colors[p.username.charCodeAt(0) % colors.length],
    you: p.id === myId,
  }));
}