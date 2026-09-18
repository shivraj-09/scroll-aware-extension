function checkHardBlock() {

  if (isTemporarilyUnlocked) return;

  chrome.storage.local.get(
    [
      "dailyUsageMs",
      "dailyLimitMinutes",
      "hardBlockEnabled"
    ],
    function (data) {

      var daily = data.dailyUsageMs || 0;

      var limit =
        (data.dailyLimitMinutes || 15) * 60000;

      if (
        data.hardBlockEnabled &&
        daily >= limit
      ) {
        showOverlay();
      }
    }
  );
}

function showOverlay() {

  if (overlayShown) return;

  overlayShown = true;

  if (timerInterval) {

    clearInterval(timerInterval);

    timerInterval = null;
  }

  chrome.storage.local.get(
    [
      "dailyUsageMs",
      "dailyLimitMinutes",
      "disciplineScoreToday",
      "unlockCountToday"
    ],
    function (data) {

      var daily =
        data.dailyUsageMs || 0;

      var score =
        data.disciplineScoreToday || 100;

      var unlockCount =
        data.unlockCountToday || 0;

      var unlocksLeft =
        Math.max(0, 3 - unlockCount);

      var dailyMinutes =
        Math.floor(daily / 60000);

      var overlay =
        document.createElement("div");

      overlay.id =
        "scrollaware-overlay";

      overlay.innerHTML = `
        <div style="
          width:380px;
          background:#0f172a;
          color:white;
          padding:30px;
          border-radius:20px;
          text-align:center;
        ">
          <h2>Daily Limit Reached</h2>

          <p>${dailyMinutes} min used today</p>

          <p>Discipline: ${score}/100</p>

          <button
            id="scrollaware-leave"
            style="
              width:100%;
              padding:12px;
              margin-top:10px;
            "
          >
            Leave Site
          </button>

          ${
            unlocksLeft > 0
              ? `
              <button
                id="scrollaware-unlock"
                style="
                  width:100%;
                  padding:12px;
                  margin-top:10px;
                "
              >
                Unlock 60s (-5)
              </button>
              `
              : ""
          }
        </div>
      `;

      document.body.appendChild(
        overlay
      );
      console.log("OVERLAY APPENDED");
    console.log(overlay);

      document
        .getElementById(
          "scrollaware-leave"
        )
        .addEventListener(
          "click",
          function () {

            window.location.href =
              "https://www.google.com";
          }
        );

      var unlockBtn =
        document.getElementById(
          "scrollaware-unlock"
        );

      if (unlockBtn) {

        unlockBtn.addEventListener(
          "click",
          function () {

            unlockCount += 1;

            score = Math.max(
              0,
              score - 5
            );

            isTemporarilyUnlocked = true;

            chrome.storage.local.set({
              unlockCountToday:
                unlockCount,

              disciplineScoreToday:
                score
            });

            overlay.remove();

            overlayShown = false;

            startSession();

            setTimeout(function () {

    isTemporarilyUnlocked = false;

}, 60000);
          }
        );
      }
    }
  );
}