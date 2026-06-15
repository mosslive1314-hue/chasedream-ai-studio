import { useMemo } from 'react';
import { useNarrativeStore } from '@/store';
import { calculateTensionCurve, getTensionStats } from '@/lib/tension-curve';

export function useTensionCurve() {
  const storyNodes = useNarrativeStore(s => s.storyNodes);
  const narrativeIntents = useNarrativeStore(s => s.narrativeIntents);
  const consequenceChains = useNarrativeStore(s => s.consequenceChains);
  const variables = useNarrativeStore(s => s.variables);

  const curve = useMemo(() => calculateTensionCurve({
    storyNodes, narrativeIntents, consequenceChains, variables,
  }), [storyNodes, narrativeIntents, consequenceChains, variables]);

  const stats = useMemo(() => getTensionStats(curve), [curve]);

  return { curve, stats };
}
