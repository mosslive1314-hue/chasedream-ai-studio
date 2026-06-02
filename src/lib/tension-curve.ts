/**
 * Narrative Tension Curve Calculator
 * Computes per-node tension values based on emotional intensity, choice pressure,
 * consequence severity, and variable fluctuations.
 */

import type { StoryNode, NarrativeIntent, ConsequenceChain, GameVariable } from '@/lib/studio-data';

export interface TensionPoint {
  nodeId: string;
  nodeLabel: string;
  tension: number;       // 0-10 overall tension
  factors: {
    emotion: number;     // from NarrativeIntent.emotionValue (1-10)
    choice: number;      // choice pressure (0 if not a choice node, higher = more impactful)
    consequence: number; // consequence severity (0-10)
    variable: number;    // variable change magnitude (0-10)
  };
  category: 'calm' | 'building' | 'tense' | 'climax' | 'resolution';
}

interface TensionInput {
  storyNodes: StoryNode[];
  narrativeIntents: NarrativeIntent[];
  consequenceChains: ConsequenceChain[];
  variables: GameVariable[];
}

/**
 * Calculate tension curve for all nodes
 */
export function calculateTensionCurve(input: TensionInput): TensionPoint[] {
  return input.storyNodes.map(node => {
    const intent = input.narrativeIntents.find(ni => ni.nodeId === node.id);
    const consequences = input.consequenceChains.filter(cc => cc.sourceNodeId === node.id);

    // Factor 1: Emotional intensity from narrative intent (1-10, default 5)
    const emotion = intent?.emotionValue ?? 5;

    // Factor 2: Choice pressure (0-10)
    let choice = 0;
    if (node.type === 'choice') {
      choice = 7; // Base choice pressure
      if (intent?.choiceImpact) choice += 2; // Impactful choice
      if (intent?.variableChanges?.length) choice += 1; // Variable-affecting choice
    } else if (node.type === 'condition') {
      choice = 5; // Conditions create moderate tension
    } else if (node.type === 'qte') {
      choice = 9; // QTE = high pressure
    }

    // Factor 3: Consequence severity (0-10)
    let consequence = 0;
    if (consequences.length > 0) {
      const maxSeverity = consequences.reduce((max, cc) => {
        if (cc.timing === 'ending') return Math.max(max, 10);
        if (cc.timing === 'delayed') return Math.max(max, 7);
        return Math.max(max, 4);
      }, 0);
      consequence = maxSeverity;
    }

    // Factor 4: Variable change magnitude (0-10)
    let variable = 0;
    if (intent?.variableChanges) {
      const totalChange = intent.variableChanges.reduce((sum, vc) => sum + Math.abs(vc.value), 0);
      variable = Math.min(10, totalChange / 5);
    }

    // Weighted average: emotion 30%, choice 25%, consequence 25%, variable 20%
    const tension = Math.round((emotion * 0.3 + choice * 0.25 + consequence * 0.25 + variable * 0.2) * 10) / 10;

    // Categorize
    let category: TensionPoint['category'];
    if (tension <= 2) category = 'calm';
    else if (tension <= 4) category = 'building';
    else if (tension <= 6) category = 'tense';
    else if (tension <= 8) category = 'climax';
    else category = 'resolution'; // High tension at end = resolution

    // Override for ending nodes
    if (['ending_good', 'ending_bad'].includes(node.type)) {
      category = 'resolution';
    }

    return {
      nodeId: node.id,
      nodeLabel: node.label,
      tension: Math.min(10, tension),
      factors: {
        emotion: Math.round(emotion * 10) / 10,
        choice: Math.round(choice * 10) / 10,
        consequence: Math.round(consequence * 10) / 10,
        variable: Math.round(variable * 10) / 10,
      },
      category,
    };
  });
}

/**
 * Get tension statistics
 */
export function getTensionStats(curve: TensionPoint[]) {
  if (curve.length === 0) return { avg: 0, max: 0, min: 0, peakNodeId: null, distribution: { calm: 0, building: 0, tense: 0, climax: 0, resolution: 0 } };

  const tensions = curve.map(p => p.tension);
  const avg = Math.round((tensions.reduce((a, b) => a + b, 0) / tensions.length) * 10) / 10;
  const max = Math.max(...tensions);
  const min = Math.min(...tensions);
  const peak = curve.find(p => p.tension === max);

  const distribution = {
    calm: curve.filter(p => p.category === 'calm').length,
    building: curve.filter(p => p.category === 'building').length,
    tense: curve.filter(p => p.category === 'tense').length,
    climax: curve.filter(p => p.category === 'climax').length,
    resolution: curve.filter(p => p.category === 'resolution').length,
  };

  return { avg, max, min, peakNodeId: peak?.nodeId ?? null, distribution };
}

export const TENSION_COLORS: Record<TensionPoint['category'], string> = {
  calm: '#10B981',       // green
  building: '#3B82F6',   // blue
  tense: '#F59E0B',      // amber
  climax: '#EF4444',     // red
  resolution: '#8B5CF6', // purple
};
