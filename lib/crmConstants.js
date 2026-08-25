export const STAGES = ["Lead", "Opportunity", "Build", "Approval", "Negotiations", "Deploy", "Active", "Inactive"];
export const ACTIVITY_TYPES = ["Call", "Email", "Meeting", "Note"];

export function stageClass(stage) {
  return String(stage).replace(/\s+/g, "-");
}

// Only meaningful for the open, forward-moving stages — "Active" is as far as
// the quick-advance button goes. "Inactive" is terminal and reached only by
// hand from the stage dropdown (a deal falling through, or a churn), never
// via quick-advance.
export function nextStage(stage) {
  const idx = STAGES.indexOf(stage);
  if (idx === -1 || idx >= STAGES.indexOf("Active")) return null;
  return STAGES[idx + 1];
}
