/**
 * Condition Engine — evaluates boolean expressions based on narrative state.
 * Used to determine: edge traversability, node visibility, option availability, asset unlocking.
 */

import type { GameVariable } from '@/lib/studio-data';
import type { NarrativeState } from '@/lib/studio-data';

export type ConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'not_contains';
export type LogicOperator = 'AND' | 'OR' | 'NOT';

export interface AtomicCondition {
  type: 'atomic';
  targetId: string;        // variable ID or state ID
  targetType: 'variable' | 'state';
  operator: ConditionOperator;
  value: number | string | boolean;
}

export interface CompositeCondition {
  type: 'composite';
  operator: LogicOperator;
  conditions: Condition[];
}

export type Condition = AtomicCondition | CompositeCondition;

/**
 * Evaluate a condition against current variables and states
 */
export function evaluateCondition(
  condition: Condition,
  variables: GameVariable[],
  states: NarrativeState[],
  runtimeValues?: Record<string, number | string | boolean>
): boolean {
  if (condition.type === 'atomic') {
    let currentValue: number | string | boolean;
    
    if (condition.targetType === 'variable') {
      const v = variables.find(v => v.id === condition.targetId);
      currentValue = runtimeValues?.[condition.targetId] ?? v?.initialValue ?? 0;
    } else {
      const s = states.find(s => s.id === condition.targetId);
      currentValue = runtimeValues?.[condition.targetId] ?? s?.currentValue ?? '';
    }
    
    switch (condition.operator) {
      case 'eq': return currentValue === condition.value;
      case 'neq': return currentValue !== condition.value;
      case 'gt': return Number(currentValue) > Number(condition.value);
      case 'gte': return Number(currentValue) >= Number(condition.value);
      case 'lt': return Number(currentValue) < Number(condition.value);
      case 'lte': return Number(currentValue) <= Number(condition.value);
      case 'contains': return String(currentValue).includes(String(condition.value));
      case 'not_contains': return !String(currentValue).includes(String(condition.value));
      default: return false;
    }
  }
  
  if (condition.type === 'composite') {
    switch (condition.operator) {
      case 'AND': return condition.conditions.every(c => evaluateCondition(c, variables, states, runtimeValues));
      case 'OR': return condition.conditions.some(c => evaluateCondition(c, variables, states, runtimeValues));
      case 'NOT': return !evaluateCondition(condition.conditions[0], variables, states, runtimeValues);
      default: return false;
    }
  }
  
  return false;
}

/**
 * Convert a condition to a human-readable string
 */
export function conditionToLabel(condition: Condition, getVarName?: (id: string) => string): string {
  if (condition.type === 'atomic') {
    const name = getVarName?.(condition.targetId) ?? condition.targetId;
    const opLabel: Record<ConditionOperator, string> = {
      eq: '=', neq: '\u2260', gt: '>', gte: '\u2265', lt: '<', lte: '\u2264',
      contains: '\u5305\u542b', not_contains: '\u4e0d\u5305\u542b'
    };
    return `${name} ${opLabel[condition.operator]} ${condition.value}`;
  }
  if (condition.type === 'composite') {
    if (condition.operator === 'NOT') return `\u975e (${conditionToLabel(condition.conditions[0], getVarName)})`;
    const labels = condition.conditions.map(c => conditionToLabel(c, getVarName));
    return labels.join(` ${condition.operator === 'AND' ? '\u4e14' : '\u6216'} `);
  }
  return '';
}

/**
 * Find all conditions that reference a specific variable or state
 */
export function findConditionsReferencing(
  conditions: Condition[],
  targetId: string
): Condition[] {
  const results: Condition[] = [];
  for (const c of conditions) {
    if (c.type === 'atomic' && c.targetId === targetId) {
      results.push(c);
    } else if (c.type === 'composite') {
      results.push(...findConditionsReferencing(c.conditions, targetId));
    }
  }
  return results;
}
