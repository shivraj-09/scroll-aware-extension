console.log("[ScrollAware] Content script active");

let scrollStartTime = null;
let lastActivityTime = null;
let alertTriggered = false;

const PAUSE_THRESHOLD = 2000; // 2 seconds

function getHostname() {
  return location.hostname;
}

function isToday(dateStr) {
  const today = new Date().toDateString();
  return new Date(dateStr).toDateString() === today;
}

function handleUserScrollActivity() {
  const now = Date.now();

  if (!lastActivityTime || now - lastActivityTime > PAUSE_THRESHOLD) {
    scrollStartTime = now;
    alertTriggered = false;
    console.log("[ScrollAware] New scroll session started");
  }

  lastActivityTime = now;
}

// Capture scroll intent
window.addEventListener("wheel", handleUserScrollActivity, { passive: true });
window.addEventListener("touchmove", handleUserScrollActivity, { passive: true });

// Monitor scrolling duration
setInterval(() => {
  if (!scrollStartTime || alertTriggered) return;

  chrome.storage.local.get(
    [
      "scrollLimitMinutes",
      "notificationsEnabled",
      "siteEnabled",
      "alertsToday",
      "longestSessionMs",
      "lastResetDate"
    ],
    (data) => {
      const hostname = getHostname();
      const siteAllowed = data.siteEnabled?.[hostname] !== false;
      if (!siteAllowed) return;

      const scrollLimitMs =
        (data.scrollLimitMinutes || 5) * 60 * 1000;

      const now = Date.now();
      const elapsed = now - scrollStartTime;

      // Daily reset
      if (!isToday(data.lastResetDate)) {
        chrome.storage.local.set({
          alertsToday: 0,
          longestSessionMs: 0,
          lastResetDate: new Date().toISOString()
        });
      }

      // Track longest session
      if (elapsed > (data.longestSessionMs || 0)) {
        chrome.storage.local.set({
          longestSessionMs: elapsed
        });
      }

      // Trigger alert
      if (elapsed >= scrollLimitMs && data.notificationsEnabled !== false) {
        alertTriggered = true;

        chrome.storage.local.set({
          alertsToday: (data.alertsToday || 0) + 1
        });

        chrome.runtime.sendMessage({
          type: "SCROLL_LIMIT_REACHED"
        });
      }
    }
  );
}, 1000);
