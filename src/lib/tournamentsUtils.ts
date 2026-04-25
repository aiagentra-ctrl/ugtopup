export const maskPassword = (pw: string) => "●".repeat(Math.max(6, pw.length));

export const formatCoins = (n: number) => n.toLocaleString("en-US");

export const formatRoomId = (id: string) => id.toUpperCase();

export const relativeTime = (iso: string) => {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} d ago`;
  return new Date(iso).toLocaleDateString();
};

export const nameToColor = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 65%, 45%)`;
};

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

export const generateRoomId = () =>
  "RM-" + Math.floor(1000 + Math.random() * 9000);

export const generatePassword = () =>
  Math.random().toString(36).slice(2, 10).toUpperCase();
