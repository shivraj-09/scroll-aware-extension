document.addEventListener("DOMContentLoaded", function () {

  var dailySelect = document.getElementById("dailyLimit");
  var sessionSelect = document.getElementById("sessionLimit");

  var dailyCustom = document.getElementById("dailyCustom");
  var sessionCustom = document.getElementById("sessionCustom");

  var notificationsToggle = document.getElementById("notificationsToggle");
  var siteToggle = document.getElementById("siteToggle");
  var hardBlockToggle = document.getElementById("hardBlockToggle");

  var timeDisplay = document.getElementById("timeDisplay");
  var progressFill = document.getElementById("progressFill");
  var dailyUsageEl = document.getElementById("dailyUsage");
  var streakEl = document.getElementById("streakDisplay");

  var currentSiteKey = null;

  /* ---------------- DETECT CURRENT SITE ---------------- */

  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {

    var tab = tabs[0];
    var url = tab && tab.url ? tab.url : "";

    if (url.includes("instagram.com")) currentSiteKey = "instagram.com";
    if (url.includes("tiktok.com")) currentSiteKey = "tiktok.com";

    if (!currentSiteKey) {
      siteToggle.disabled = true;
    }

    chrome.storage.local.get(
      [
        "dailyLimitMinutes",
        "sessionLimitMinutes",
        "notificationsEnabled",
        "hardBlockEnabled",
        "siteEnabled"
      ],
      function (data) {

        /* ---------- LIMITS ---------- */

        var daily = data.dailyLimitMinutes || 15;
        var session = data.sessionLimitMinutes || 5;

        if ([5, 15, 30].includes(daily)) {
          dailySelect.value = daily;
        } else {
          dailySelect.value = "custom";
          dailyCustom.style.display = "block";
          dailyCustom.value = daily;
        }

        if ([3, 5, 10].includes(session)) {
          sessionSelect.value = session;
        } else {
          sessionSelect.value = "custom";
          sessionCustom.style.display = "block";
          sessionCustom.value = session;
        }

        /* ---------- TOGGLES ---------- */

        notificationsToggle.checked =
          typeof data.notificationsEnabled === "boolean"
            ? data.notificationsEnabled
            : true;

        hardBlockToggle.checked =
          typeof data.hardBlockEnabled === "boolean"
            ? data.hardBlockEnabled
            : false;

        if (currentSiteKey) {
          var enabledSites = data.siteEnabled || {};
          siteToggle.checked =
            typeof enabledSites[currentSiteKey] === "boolean"
              ? enabledSites[currentSiteKey]
              : true;
        }
      }
    );
  });

  /* ---------------- PROGRESS + ANALYTICS ---------------- */

  function updateProgress() {
    chrome.storage.local.get(
      ["currentSessionMs", "sessionLimitMinutes"],
      function (data) {

        var current = data.currentSessionMs || 0;
        var limitMinutes = data.sessionLimitMinutes || 5;
        var limitMs = limitMinutes * 60000;

        var percent = Math.min((current / limitMs) * 100, 100);

        var minutes = Math.floor(current / 60000);
        var seconds = Math.floor((current % 60000) / 1000);

        if (timeDisplay) {
          timeDisplay.textContent =
            minutes + "m " + seconds + "s / " + limitMinutes + "m";
        }

        if (progressFill) {
          progressFill.style.width = percent + "%";
        }
      }
    );
  }

  function updateAnalytics() {
    chrome.storage.local.get(
      ["dailyUsageMs", "currentStreak"],
      function (data) {

        var daily = data.dailyUsageMs || 0;
        var streak = data.currentStreak || 0;

        var dailyMinutes = Math.floor(daily / 60000);
        var dailySeconds = Math.floor((daily % 60000) / 1000);

        if (dailyUsageEl) {
          dailyUsageEl.textContent =
            "Today: " + dailyMinutes + "m " + dailySeconds + "s";
        }

        if (streakEl) {
          streakEl.textContent =
            "Streak: " + streak + " days 🔥";
        }
      }
    );
  }

  setInterval(function () {
    updateProgress();
    updateAnalytics();
  }, 1000);

  /* ---------------- DAILY CHANGE ---------------- */

  dailySelect.addEventListener("change", function () {

    if (dailySelect.value === "custom") {
      dailyCustom.style.display = "block";
      return;
    }

    dailyCustom.style.display = "none";

    chrome.storage.local.set({
      dailyLimitMinutes: Number(dailySelect.value)
    });
  });

  dailyCustom.addEventListener("change", function () {
    if (dailyCustom.value > 0) {
      chrome.storage.local.set({
        dailyLimitMinutes: Number(dailyCustom.value)
      });
    }
  });

  /* ---------------- SESSION CHANGE ---------------- */

  sessionSelect.addEventListener("change", function () {

    if (sessionSelect.value === "custom") {
      sessionCustom.style.display = "block";
      return;
    }

    sessionCustom.style.display = "none";

    chrome.storage.local.set({
      sessionLimitMinutes: Number(sessionSelect.value)
    });
  });

  sessionCustom.addEventListener("change", function () {
    if (sessionCustom.value > 0) {
      chrome.storage.local.set({
        sessionLimitMinutes: Number(sessionCustom.value)
      });
    }
  });

  /* ---------------- TOGGLES ---------------- */

  notificationsToggle.addEventListener("change", function () {
    chrome.storage.local.set({
      notificationsEnabled: notificationsToggle.checked
    });
  });

  hardBlockToggle.addEventListener("change", function () {
    chrome.storage.local.set({
      hardBlockEnabled: hardBlockToggle.checked
    });
  });

  siteToggle.addEventListener("change", function () {

    if (!currentSiteKey) return;

    chrome.storage.local.get(["siteEnabled"], function (data) {

      var enabledSites = data.siteEnabled || {};
      enabledSites[currentSiteKey] = siteToggle.checked;

      chrome.storage.local.set({
        siteEnabled: enabledSites
      });
    });
  });

});
