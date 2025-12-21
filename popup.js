document.addEventListener("DOMContentLoaded", function () {
  var scrollLimitSelect = document.getElementById("scrollLimit");
  var notificationsToggle = document.getElementById("notificationsToggle");
  var siteToggle = document.getElementById("siteToggle");

  if (!scrollLimitSelect || !notificationsToggle || !siteToggle) {
    console.error("Popup DOM missing");
    return;
  }

  function getSiteKey(url) {
    if (!url || typeof url !== "string") return null;
    if (url.indexOf("instagram.com") !== -1) return "instagram.com";
    if (url.indexOf("tiktok.com") !== -1) return "tiktok.com";
    return null;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    var tab = tabs && tabs[0];
    var siteKey = tab ? getSiteKey(tab.url) : null;

    if (!siteKey) {
      siteToggle.disabled = true;
      siteToggle.checked = false;
    }

    chrome.storage.local.get(
      [
        "scrollLimitMinutes",
        "notificationsEnabled",
        "siteEnabled"
      ],
      function (data) {
        var limit =
          typeof data.scrollLimitMinutes === "number"
            ? data.scrollLimitMinutes
            : 5;

        var notifications =
          typeof data.notificationsEnabled === "boolean"
            ? data.notificationsEnabled
            : true;

        var siteAllowed = true;
        
        if (data.siteEnabled && data.siteEnabled.hasOwnProperty(siteKey)) {
         siteAllowed = data.siteEnabled[siteKey];
        }

        scrollLimitSelect.value = limit;
        notificationsToggle.checked = notifications;
        siteToggle.checked = siteAllowed;
      }
    );

    scrollLimitSelect.addEventListener("change", function () {
      chrome.storage.local.set({
        scrollLimitMinutes: Number(scrollLimitSelect.value)
      });
    });

    notificationsToggle.addEventListener("change", function () {
      chrome.storage.local.set({
        notificationsEnabled: notificationsToggle.checked
      });
    });

    siteToggle.addEventListener("change", function () {
      if (!siteKey) return;

      chrome.storage.local.get(["siteEnabled"], function (data) {
        var updated = Object.assign({}, data.siteEnabled || {});
        updated[siteKey] = siteToggle.checked;

        chrome.storage.local.set({
          siteEnabled: updated
        });
      });
    });
  });
});
