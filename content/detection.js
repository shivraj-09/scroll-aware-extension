function isInstagramReels() {

  if (!location.hostname.includes("instagram.com")) {
    return false;
  }

  return (
    location.pathname.includes("/reels/") ||
    location.pathname.includes("/reel/")
  );
}

function isTikTokFeed() {
  return location.hostname.includes("tiktok.com");
}

function isInReelsContext() {
  return isInstagramReels() || isTikTokFeed();
}

function getSiteKey() {
  if (location.hostname.includes("instagram.com")) return "instagram.com";
  if (location.hostname.includes("tiktok.com")) return "tiktok.com";
  return null;
}