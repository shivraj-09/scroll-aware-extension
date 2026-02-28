console.log("[ScrollAware] Reels-aware content script loaded");

var elapsedMs = 0;
var timerInterval = null;
var siteEnabled = true;
var overlayShown = false;
var sessionWarningShown = false;

var CHECK_INTERVAL = 1000;

/* ---------------- CONTEXT ---------------- */

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

/* ---------------- MOTIVATION ---------------- */

function getMotivationMessage(overMinutes) {
  if (overMinutes <= 1) return "You crossed the line. Pull it back.";
  if (overMinutes <= 3) return "This is how discipline slips.";
  if (overMinutes <= 5) return "You're choosing comfort over growth.";
  if (overMinutes <= 10) return "Be honest. This isn’t helping you.";
  return "You’re wasting time you said mattered.";
}

/* ---------------- BANNER ---------------- */

function showBanner(message, type) {
  var banner = document.createElement("div");
  banner.className = "scrollaware-banner " + type;
  banner.textContent = message;

  document.body.appendChild(banner);

  setTimeout(function () {
    banner.style.opacity = "0";
    setTimeout(function () {
      banner.remove();
    }, 300);
  }, 5000);
}

/* ---------------- OVERLAY ---------------- */

function showOverlay() {
  if (overlayShown) return;
  overlayShown = true;

  chrome.storage.local.get(
    ["dailyUsageMs", "dailyLimitMinutes", "unlockCountToday", "unlockDate"],
    function (data) {

      var today = new Date().toDateString();

      var daily = data.dailyUsageMs || 0;
      var dailyLimitMinutes = data.dailyLimitMinutes || 15;

      var dailyMinutes = Math.floor(daily / 60000);
      var dailySeconds = Math.floor((daily % 60000) / 1000);

      var limitMs = dailyLimitMinutes * 60 * 1000;
      var overuseMs = daily - limitMs;
      var overMinutes = Math.max(0, Math.floor(overuseMs / 60000));
      var severity = Math.min(overMinutes, 10);

      var unlockCount = data.unlockCountToday || 0;
      if (data.unlockDate !== today) unlockCount = 0;
      var unlocksLeft = Math.max(0, 4 - unlockCount);

      var now = new Date();
      var tomorrow = new Date();
      tomorrow.setHours(24, 0, 0, 0);
      var diffMs = tomorrow - now;
      var resetHours = Math.floor(diffMs / (1000 * 60 * 60));
      var resetMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      var overlay = document.createElement("div");
      overlay.id = "scrollaware-overlay";

      overlay.innerHTML = `
        <div class="scrollaware-box severity-${severity}">
          <div class="scrollaware-icon">⛔</div>
          <h2>${getMotivationMessage(overMinutes)}</h2>

          <p class="usage">${dailyMinutes}m ${dailySeconds}s used today</p>
          <p class="reset">Resets in ${resetHours}h ${resetMinutes}m</p>
          <p class="unlock-info">Unlocks left today: ${unlocksLeft}</p>

          <div class="buttons">
            <button id="scrollaware-leave" class="strong">
              Leave Site
            </button>

            <button id="scrollaware-unlock" class="weak"
              ${unlocksLeft === 0 ? "disabled" : ""}>
              I need more time
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);
      document.body.style.overflow = "hidden";

      document.getElementById("scrollaware-leave")
        .addEventListener("click", function () {
          window.location.href = "https://www.google.com";
        });

      var unlockBtn = document.getElementById("scrollaware-unlock");

      if (unlockBtn && unlocksLeft > 0) {
        unlockBtn.addEventListener("click", function () {

          unlockCount += 1;

          var unlockSeconds =
            unlockCount === 1 ? 60 :
            unlockCount === 2 ? 45 :
            unlockCount === 3 ? 30 : 15;

          chrome.storage.local.set({
            unlockCountToday: unlockCount,
            unlockDate: today
          });

          overlay.remove();
          document.body.style.overflow = "auto";

          setTimeout(function () {
            overlayShown = false;
            checkHardBlock();
          }, unlockSeconds * 1000);
        });
      }
    }
  );
}

/* ---------------- HARD BLOCK ---------------- */

function checkHardBlock() {
  chrome.storage.local.get(
    ["dailyUsageMs", "dailyLimitMinutes", "hardBlockEnabled"],
    function (data) {
      var daily = data.dailyUsageMs || 0;
      var limit = (data.dailyLimitMinutes || 15) * 60 * 1000;

      if (data.hardBlockEnabled && daily >= limit) {
        showOverlay();
      }
    }
  );
}

/* ---------------- SESSION ---------------- */

function startSession() {
  if (timerInterval || !siteEnabled) return;
  elapsedMs = 0;
  sessionWarningShown = false;
  timerInterval = setInterval(tick, CHECK_INTERVAL);
  checkHardBlock();
}

function endSession() {
  if (!timerInterval) return;
  clearInterval(timerInterval);
  timerInterval = null;
  elapsedMs = 0;
  sessionWarningShown = false;
}

/* ---------------- TIMER ---------------- */

function tick() {
  if (!siteEnabled) return;
  if (document.visibilityState !== "visible") return;

  elapsedMs += CHECK_INTERVAL;

  chrome.storage.local.set({ currentSessionMs: elapsedMs });

  chrome.storage.local.get(
    [
      "dailyUsageMs",
      "lastActiveDate",
      "currentStreak",
      "dailyLimitMinutes",
      "sessionLimitMinutes",
      "hardBlockEnabled"
    ],
    function (data) {

      var today = new Date().toDateString();
      var dailyUsage = data.dailyUsageMs || 0;
      var lastDate = data.lastActiveDate;
      var streak = data.currentStreak || 0;
      var dailyLimitMs = (data.dailyLimitMinutes || 15) * 60000;
      var sessionLimitMs = (data.sessionLimitMinutes || 5) * 60000;

      if (!sessionWarningShown && elapsedMs >= sessionLimitMs) {
        sessionWarningShown = true;
        showBanner("Session limit reached. Step back before it compounds.", "neutral");
      }

      if (lastDate && lastDate !== today) {
        streak = dailyUsage <= dailyLimitMs ? streak + 1 : 0;
        dailyUsage = 0;
        overlayShown = false;
      }

      dailyUsage += CHECK_INTERVAL;

      chrome.storage.local.set({
        dailyUsageMs: dailyUsage,
        lastActiveDate: today,
        currentStreak: streak
      });

      if (dailyUsage >= dailyLimitMs && data.hardBlockEnabled) {
        showOverlay();
      }
    }
  );
}

/* ---------------- INITIAL LOAD ---------------- */

chrome.storage.local.get(["siteEnabled"], function (data) {
  var key = getSiteKey();
  if (!key) return;

  siteEnabled =
    data.siteEnabled && typeof data.siteEnabled[key] === "boolean"
      ? data.siteEnabled[key]
      : true;

  if (isInReelsContext() && siteEnabled) startSession();
  checkHardBlock();
});

/* ---------------- OBSERVERS ---------------- */

setInterval(function () {
  if (!isInReelsContext()) endSession();
  else if (siteEnabled) {
    startSession();
    checkHardBlock();
  }
}, 1000);

document.addEventListener("visibilitychange", function () {
  if (document.visibilityState === "hidden") endSession();
  else if (isInReelsContext() && siteEnabled) {
    startSession();
    checkHardBlock();
  }
});

/* ---------------- STYLES ---------------- */

var style = document.createElement("style");
style.innerHTML = `

.scrollaware-banner {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 1000000;
  animation: slideDown 0.3s ease;
  transition: opacity 0.3s ease;
}
.scrollaware-banner.positive { background: #10b981; color: white; }
.scrollaware-banner.negative { background: #ef4444; color: white; }
.scrollaware-banner.neutral  { background: #334155; color: white; }

#scrollaware-overlay {
  position: fixed;
  inset: 0;
  background: radial-gradient(circle at center, #0f172a, #020617);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999999;
}

.scrollaware-box {
  background: rgba(30, 41, 59, 0.95);
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  color: white;
  width: 320px;
}

.buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 18px;
}

.scrollaware-box button {
  padding: 12px;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  font-weight: 600;
}

.scrollaware-box .strong {
  background: #ef4444;
  color: white;
}

.scrollaware-box .weak {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
}

`;
document.head.appendChild(style);