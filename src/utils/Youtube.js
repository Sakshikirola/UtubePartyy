export function getYouTubeVideoId(value) {
  try {
    const url = new URL(value);

    if (url.hostname === "youtu.be" || url.hostname.endsWith(".youtu.be")) {
      return url.pathname.split("/").filter(Boolean)[0] || null;
    }

    if (
      url.hostname === "youtube.com" ||
      url.hostname.endsWith(".youtube.com")
    ) {
      if (url.pathname === "/watch") {
        return url.searchParams.get("v");
      }

      if (
        url.pathname.startsWith("/embed/") ||
        url.pathname.startsWith("/shorts/")
      ) {
        return url.pathname.split("/")[2] || null;
      }
    }
  } catch {
    // The input may be a video ID instead of a URL.
  }

  const id = value.trim();

  return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
}