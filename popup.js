const scrollLimitSelect = document.getElementById("scrollLimit");
const siteToggle = document.getElementById("siteToggle");
const notificationsToggle = document.getElementById("notificationsToggle");
const alertsCountEl = document.getElementById("alertsCount");
const longestSessionEl = document.getElementById("longestSession");

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  const hostname = new URL(tab.url).hostname;

  chrome.storage.local.get(
    [
      "scrollLimitMinutes",
      "notificationsEnabled",
      "siteEnabled",
      "alertsToday",
      "longestSessionMs"
    ],
    (data) => {
      scrollLimitSelect.value = data.scrollLimitMinutes || 5;
      notificationsToggle.checked = data.notificationsEnabled !== false;
      siteToggle.checked = data.siteEnabled?.[hostname] !== false;

      alertsCountEl.textContent = data.alertsToday || 0;
      longestSessionEl.textContent = Math.floor(
        (data.longestSessionMs || 0) / 60000
      );
    }
  );

  scrollLimitSelect.addEventListener("change", () => {
    chrome.storage.local.set({
      scrollLimitMinutes: Number(scrollLimitSelect.value)
    });
  });

  notificationsToggle.addEventListener("change", () => {
    chrome.storage.local.set({
      notificationsEnabled: notificationsToggle.checked
    });
  });

  siteToggle.addEventListener("change", () => {
    chrome.storage.local.get(["siteEnabled"], (data) => {
      chrome.storage.local.set({
        siteEnabled: {
          ...(data.siteEnabled || {}),
          [hostname]: siteToggle.checked
        }
      });
    });
  });
});
