function startSession() {
    console.log("Creating HUD");
createLiveDisciplineHUD();

  if (
    timerInterval ||
    !siteEnabled ||
    overlayShown
  ) {
    return;
  }

  createLiveDisciplineHUD();

  timerInterval =
    setInterval(tick, CHECK_INTERVAL);
}

function endSession() {

  if (!timerInterval) return;

  clearInterval(timerInterval);

  timerInterval = null;
}

function tick() {
   

  if (!siteEnabled) return;

  if (document.visibilityState !== "visible") return;

  if (overlayShown) return;

  chrome.storage.local.get(
    [
      "dailyUsageMs",
      "dailyLimitMinutes",
      "disciplineScoreToday",
      "hardBlockEnabled"
    ],
    function (data) {

      var dailyUsage =
        data.dailyUsageMs || 0;

      var dailyLimitMinutes =
        data.dailyLimitMinutes || 15;

        console.log(
  "Usage:",
  dailyUsage,
  "Limit:",
  dailyLimitMinutes * 60000,
  "HardBlock:",
  data.hardBlockEnabled
);

      var existingScore =
        data.disciplineScoreToday || 100;

      dailyUsage += CHECK_INTERVAL;

      var scoreData =
        calculateDisciplineScore(
          dailyUsage,
          dailyLimitMinutes,
          existingScore
        );

      chrome.storage.local.set({
        dailyUsageMs: dailyUsage,
        disciplineScoreToday:
          scoreData.score
      });

      updateLiveHUD(scoreData.score);

      if (
        dailyUsage >=
          dailyLimitMinutes * 60000 &&
        data.hardBlockEnabled &&
        !isTemporarilyUnlocked
      ) {
        console.log("CALLING OVERLAY");
        showOverlay();
      }
    }
  );
}