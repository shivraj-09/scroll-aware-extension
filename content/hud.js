function createLiveDisciplineHUD() {

  if (document.getElementById("scrollaware-hud")) return;

  var hud = document.createElement("div");

  hud.id = "scrollaware-hud";

  hud.innerHTML = `
    <svg width="60" height="60">
      <circle class="hud-bg" cx="30" cy="30" r="25" stroke-width="6"/>
      <circle class="hud-fill" cx="30" cy="30" r="25" stroke-width="6"/>
    </svg>

    <div class="hud-text">100</div>
  `;

  document.body.appendChild(hud);
}

function updateLiveHUD(score) {

  var fill = document.querySelector(".hud-fill");
  var text = document.querySelector(".hud-text");

  if (!fill || !text) return;

  var radius = 25;
  var circumference = 2 * Math.PI * radius;

  fill.style.strokeDasharray = circumference;

  fill.style.strokeDashoffset =
    circumference - (score / 100) * circumference;

  text.textContent = score;

  if (score >= 80) {
    fill.style.stroke = "#10b981";
  } else if (score >= 50) {
    fill.style.stroke = "#f59e0b";
  } else {
    fill.style.stroke = "#ef4444";
  }
}

var style = document.createElement("style");

style.textContent = `
#scrollaware-hud {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 70px;
  height: 70px;
  z-index: 999999;
  background: rgba(15,23,42,0.9);
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.hud-bg {
  fill: none;
  stroke: #334155;
}

.hud-fill {
  fill: none;
  stroke: #10b981;
  stroke-linecap: round;
  transition: all .3s ease;
}

.hud-text {
  position: absolute;
  color: white;
  font-weight: bold;
  font-size: 12px;
}
`;

document.head.appendChild(style);