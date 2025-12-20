let cooldownUntil = 0;
const COOLDOWN_TIME = 10 * 60 * 1000;

chrome.runtime.onMessage.addListener((message) => {
  if (message.type !== "SCROLL_LIMIT_REACHED") return;

  const now = Date.now();
  if (now < cooldownUntil) return;

  cooldownUntil = now + COOLDOWN_TIME;

  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "Take a break",
    message: "You've been scrolling for over your set limit. Consider pausing."
  });
});
