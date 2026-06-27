// Check if a match stage is playoff/knockout (where penalty shootouts can occur)
export function isPlayoffStage(stage: string): boolean {
  const playoffStages = ['round-of-16', 'quarter-final', 'semi-final', 'final', 'round_16', 'quarterfinal'];
  return playoffStages.some(s => stage.toLowerCase().includes(s.toLowerCase()));
}
