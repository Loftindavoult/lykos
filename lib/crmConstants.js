export const STAGES = ["Cold Lead", "Warm Lead", "Qualified", "Proposal", "Won", "Lost"];
export const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Note"];

export function stageClass(stage) {
  return String(stage).replace(/\s+/g, "-");
}

// Only meaningful for the open, forward-moving stages — Won/Lost are terminal
// and have no "next" (the board's advance button hides itself there).
export function nextStage(stage) {
  const idx = STAGES.indexOf(stage);
  if (idx === -1 || idx >= STAGES.indexOf("Proposal")) return null;
  return STAGES[idx + 1];
}
