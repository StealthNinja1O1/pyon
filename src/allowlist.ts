// schema validation と avatar.ts の redirect 各hop 両方で呼ぶ pyon

const DEFAULT_HOSTS = "cdn.discordapp.com,media.discordapp.net";

const allowed = new Set(
  (process.env.PYON_AVATAR_ALLOWED_HOSTS && process.env.PYON_AVATAR_ALLOWED_HOSTS.trim().length > 0
    ? process.env.PYON_AVATAR_ALLOWED_HOSTS
    : DEFAULT_HOSTS
  )
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

export function isAllowedAvatarUrl(url: string): boolean {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  return allowed.has(u.hostname.toLowerCase());
}

export function allowedAvatarHosts(): string[] {
  return [...allowed];
}
