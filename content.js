console.log("[ScrollAware] Reels-aware content script loaded");

var elapsedMs = 0;
var alertTriggered = false;
var timerInterval = null;
var siteEnabled = true; // default true

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

function getSiteKey() {
  if (location.hostname.includes("instagram.com")) return "instagram.com";
  if (location.hostname.includes("tiktok.com")) return "tiktok.com";
  return null;
}

// --- SESSION CONTROL ---
function startSession() {
  if (timerInterval || !siteEnabled) return;

  console.log("[ScrollAware] Session started");
  elapsedMs = 0;
  alertTriggered = false;

  timerInterval = setInterval(tick, CHECK_INTERVAL);
}

function endSession() {
  if (!timerInterval) return;

  console.log("[ScrollAware] Session ended");
  clearInterval(timerInterval);
  timerInterval = null;
  elapsedMs = 0;
  alertTriggered = false;
}

// --- TIMER ---
function tick() {
  if (!siteEnabled) return;
  if (document.visibilityState !== "visible") return;

  elapsedMs += CHECK_INTERVAL;

  chrome.storage.local.get(
    ["scrollLimitMinutes", "notificationsEnabled"],
    function (data) {
      var limitMinutes =
        typeof data.scrollLimitMinutes === "number"
          ? data.scrollLimitMinutes
          : 5;

      var notificationsEnabled =
        typeof data.notificationsEnabled === "boolean"
          ? data.notificationsEnabled
          : true;

      if (
        elapsedMs >= limitMinutes * 60 * 1000 &&
        notificationsEnabled &&
        !alertTriggered
      ) {
        alertTriggered = true;

        chrome.runtime.sendMessage({
          type: "SCROLL_LIMIT_REACHED",
        });
      }
    }
  );
}

// --- INITIAL LOAD OF siteEnabled ---
chrome.storage.local.get(["siteEnabled"], function (data) {
  var key = getSiteKey();
  if (!key) return;

  if (data.siteEnabled && typeof data.siteEnabled[key] === "boolean") {
    siteEnabled = data.siteEnabled[key];
  } else {
    siteEnabled = true;
  }

  if (isInReelsContext() && siteEnabled) {
    startSession();
  }
});

// --- LISTEN FOR TOGGLE CHANGES ---
chrome.storage.onChanged.addListener(function (changes, area) {
  if (area !== "local") return;
  if (!changes.siteEnabled) return;

  var key = getSiteKey();
  if (!key) return;

  var newValue = changes.siteEnabled.newValue;

  if (newValue && typeof newValue[key] === "boolean") {
    siteEnabled = newValue[key];
  }

  if (!siteEnabled) {
    endSession();
  } else if (isInReelsContext()) {
    startSession();
  }
});

// --- CONTEXT OBSERVER ---
setInterval(function () {
  if (!isInReelsContext()) {
    endSession();
  } else if (siteEnabled) {
    startSession();
  }
}, 1000);

// --- VISIBILITY ---
document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") {
    endSession();
  } else if (isInReelsContext() && siteEnabled) {
    startSession();
  }
});
