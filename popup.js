document.addEventListener("DOMContentLoaded", () => {
  const scrollLimitSelect = document.getElementById("scrollLimit");
  const siteToggle = document.getElementById("siteToggle");
  const notificationsToggle = document.getElementById("notificationsToggle");
  const alertsCountEl = document.getElementById("alertsCount");
  const longestSessionEl = document.getElementById("longestSession");

  // Absolute safety check
  if (
    !scrollLimitSelect ||
    !siteToggle ||
    !notificationsToggle ||
    !alertsCountEl ||
    !longestSessionEl
  ) {
    console.error("[ScrollAware] Popup DOM mismatch");
    return;
  }

  function getBaseSite(hostname) {
    if (hostname.includes("instagram")) return "instagram.com";
    if (hostname.includes("tiktok")) return "tiktok.com";
    return hostname;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (
      !tab ||
      !tab.url ||
      !(tab.url.startsWith("http://") || tab.url.startsWith("https://"))
    ) {
      siteToggle.disabled = true;
      siteToggle.parentElement.style.opacity = "0.6";
      alertsCountEl.textContent = "—";
      longestSessionEl.textContent = "—";
      return;
    }

    const rawHostname = new URL(tab.url).hostname;
    const siteKey = getBaseSite(rawHostname);
    const isSupported =
      siteKey === "instagram.com" || siteKey === "tiktok.com";

    siteToggle.disabled = !isSupported;
    siteToggle.parentElement.style.opacity = isSupported ? "1" : "0.6";

    chrome.storage.local.get(
      [
        "scrollLimitMinutes",
        "notificationsEnabled",
        "siteEnabled",
        "alertsToday",
        "longestSessionMs"
      ],
      (data) => {
        const scrollLimit =
          typeof data.scrollLimitMinutes === "number"
            ? data.scrollLimitMinutes
            : 5;

        const notificationsEnabled =
          typeof data.notificationsEnabled === "boolean"
            ? data.notificationsEnabled
            : true;

        const siteEnabled = data.siteEnabled?.[siteKey] !== false;

        scrollLimitSelect.value = scrollLimit;
        notificationsToggle.checked = notificationsEnabled;
        siteToggle.checked = siteEnabled;

        alertsCountEl.textContent = data.alertsToday || 0;
        longestSessionEl.textContent = Math.floor(
          (data.longestSessionMs || 0) / 60000
        );

        // Write defaults ONCE
        const defaults = {};
        if (data.scrollLimitMinutes === undefined)
          defaults.scrollLimitMinutes = 5;
        if (data.notificationsEnabled === undefined)
          defaults.notificationsEnabled = true;

        if (Object.keys(defaults).length) {
          chrome.storage.local.set(defaults);
        }
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
            [siteKey]: siteToggle.checked
          }
        });
      });
    });
  });
});
