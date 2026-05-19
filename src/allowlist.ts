// avatarUrl 受け入れる host のallowlist pyon.
// env で上書きできるけど、未設定なら discord CDN だけ通す.
// schema.tsで初回validation、avatar.tsでredirectの各hopもこれで再check.

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
