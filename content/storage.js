function scheduleMidnightReset() {

  var now = new Date();

  var tomorrow = new Date();

  tomorrow.setHours(24, 0, 0, 0);

  setTimeout(function () {

    performDailyReset();

    scheduleMidnightReset();

  }, tomorrow - now);
}

function performDailyReset() {

  chrome.storage.local.get(
    [
      "dailyUsageMs",
      "dailyLimitMinutes",
      "currentStreak"
    ],
    function (data) {

      var dailyUsage = data.dailyUsageMs || 0;

      var dailyLimitMinutes =
        data.dailyLimitMinutes || 15;

      var dailyLimitMs =
        dailyLimitMinutes * 60000;

      var streak =
        data.currentStreak || 0;

      if (dailyUsage <= dailyLimitMs) {
        streak += 1;
      } else {
        streak = 0;
      }

      chrome.storage.local.set({
        dailyUsageMs: 0,
        unlockCountToday: 0,
        disciplineScoreToday: 100,
        currentStreak: streak
      });
    }
  );
}