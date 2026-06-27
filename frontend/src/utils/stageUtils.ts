// Check if a match stage is playoff/knockout (where penalty shootouts can occur)
export function isPlayoffStage(stage: string): boolean {
  const playoffStages = ['round-of-32', 'round-of-16', 'quarter-final', 'semi-final', 'final'];
  return playoffStages.some(s => stage.toLowerCase().includes(s.toLowerCase()));
}
