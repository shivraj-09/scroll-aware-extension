console.log(
  "[ScrollAware] Reels-aware content script loaded"
);

var elapsedMs = 0;
var timerInterval = null;
var siteEnabled = true;
var overlayShown = false;
var lastHiddenTime = null;
var isTemporarilyUnlocked = false;

var CHECK_INTERVAL = 1000;

scheduleMidnightReset();

chrome.storage.local.get(
  ["siteEnabled"],
  function (data) {

    var key = getSiteKey();

    if (!key) return;

    siteEnabled =
      data.siteEnabled &&
      typeof data.siteEnabled[key] === "boolean"
        ? data.siteEnabled[key]
        : true;
  }
);

setInterval(function () {

  var inReels = isInReelsContext();

  if (
    inReels &&
    siteEnabled &&
    !overlayShown
  ) {

    if (!timerInterval) {
      startSession();
    }

  } else {

    if (timerInterval) {
      endSession();
    }
  }

}, 1000);

document.addEventListener(
  "visibilitychange",
  function () {

    if (
      document.visibilityState === "hidden"
    ) {

      lastHiddenTime = Date.now();

      endSession();
    }
  }
);