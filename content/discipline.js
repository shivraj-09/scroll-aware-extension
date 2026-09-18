function calculateDisciplineScore(
  dailyUsageMs,
  dailyLimitMinutes,
  existingScore
) {

  var dailyLimitMs = dailyLimitMinutes * 60000;

  var overMinutes = Math.max(
    0,
    Math.floor((dailyUsageMs - dailyLimitMs) / 60000)
  );

  var overPenalty = overMinutes * 2;

  var score = 100 - overPenalty;

  if (existingScore !== undefined) {
    score = Math.min(score, existingScore);
  }

  score = Math.max(0, Math.min(100, score));

  return {
    score: score
  };
}