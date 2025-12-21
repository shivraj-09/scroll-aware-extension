console.log("[ScrollAware] Reels-aware content script loaded");

var sessionStartTime = null;
var elapsedMs = 0;
var alertTriggered = false;
var timerInterval = null;

// --- CONFIG ---
var CHECK_INTERVAL = 1000;

// --- CONTEXT DETECTION ---
function isInstagramReels() {
  return (
    location.hostname.includes("instagram.com") &&
    (location.pathname.includes("/reels") ||
     location.pathname.includes("/reel/"))
  );
}

function isTikTokFeed() {
  return location.hostname.includes("tiktok.com");
}

function isInReelsContext() {
  return isInstagramReels() || isTikTokFeed();
}

// --- SESSION CONTROL ---
function startSession() {
  if (timerInterval) return;

  console.log("[ScrollAware] Session started");
  sessionStartTime = Date.now();
  elapsedMs = 0;
  alertTriggered = false;

  timerInterval = setInterval(tick, CHECK_INTERVAL);
}

function pauseSession() {
  if (!timerInterval) return;

  console.log("[ScrollAware] Session paused");
  clearInterval(timerInterval);
  timerInterval = null;
}

function endSession() {
  if (!timerInterval) return;

  console.log("[ScrollAware] Session ended");
  clearInterval(timerInterval);
  timerInterval = null;
  sessionStartTime = null;
  elapsedMs = 0;
  alertTriggered = false;
}

// --- TIMER LOOP ---
function tick() {
  if (document.visibilityState !== "visible") return;

  elapsedMs += CHECK_INTERVAL;

  chrome.storage.local.get(
    ["scrollLimitMinutes", "notificationsEnabled", "siteEnabled"],
    function (data) {
      var siteKey = null;
      if (location.hostname.includes("instagram.com")) siteKey = "instagram.com";
      if (location.hostname.includes("tiktok.com")) siteKey = "tiktok.com";

      if (!siteKey) return;
      if (data.siteEnabled && data.siteEnabled[siteKey] === false) return;

      var limitMinutes =
        typeof data.scrollLimitMinutes === "number"
          ? data.scrollLimitMinutes
          : 5;

      var notificationsEnabled =
        typeof data.notificationsEnabled === "boolean"
          ? data.notificationsEnabled
          : true;

      var limitMs = limitMinutes * 60 * 1000;

      if (elapsedMs >= limitMs && notificationsEnabled && !alertTriggered) {
        alertTriggered = true;
        console.log("[ScrollAware] Reels limit reached");

        chrome.runtime.sendMessage({
          type: "SCROLL_LIMIT_REACHED",
        });
      }
    }
  );
}

// --- OBSERVERS ---
setInterval(function () {
  if (!isInReelsContext()) {
    endSession();
    return;
  }

  chrome.storage.local.get(["siteEnabled"], function (data) {
    var siteKey = null;
    if (location.hostname.includes("instagram.com")) siteKey = "instagram.com";
    if (location.hostname.includes("tiktok.com")) siteKey = "tiktok.com";

    // If site explicitly disabled → ensure session is stopped
    if (data.siteEnabled && data.siteEnabled[siteKey] === false) {
      endSession();
      return;
    }

    // Site enabled → allow session
    startSession();
  });
}, 1000);


document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") {
    pauseSession();
  } else if (isInReelsContext()) {
    startSession();
  }
});
