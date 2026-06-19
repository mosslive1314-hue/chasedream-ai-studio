/**
 * DSL 语法分析器 — 把 Token 数组解析为 AST
 * 处理 if/elif/else/end 嵌套结构
 */

import type { Token, ASTNode, ASTChoiceOption } from './types';

/**
 * 把 Token 数组解析为 AST 节点数组
 * label 作为分隔标记，不嵌套
 */
export function parse(tokens: Token[]): ASTNode[] {
  const ast: ASTNode[] = [];
  let i = 0;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'EOF') break;

    switch (token.type) {
      case 'LABEL':
        ast.push({ kind: 'label', name: token.value, line: token.line });
        i++;
        break;

      case 'SAY': {
        const parts = token.value.split('|');
        const character = parts[0] || undefined;
        const text = parts.slice(1).join('|');
        ast.push({ kind: 'say', character, text, line: token.line });
        i++;
        break;
      }

      case 'CHOICE': {
        // 收集后续 OPTION tokens 直到 END
        const options: ASTChoiceOption[] = [];
        i++; // 跳过 @choice
        while (i < tokens.length && tokens[i].type === 'OPTION') {
          const optParts = tokens[i].value.split('|');
          const optText = optParts[0];
          const optTarget = optParts[1] || '';
          const optEffects = optParts[2] ? optParts[2].split(/[;,]/).map(e => e.trim()).filter(Boolean) : undefined;
          options.push({ text: optText, target: optTarget, effects: optEffects });
          i++;
        }
        // 跳过可选的 @end
        if (i < tokens.length && tokens[i].type === 'END') i++;
        ast.push({ kind: 'choice', options, line: token.line });
        break;
      }

      case 'IF': {
        const condition = token.value;
        i++; // 跳过 @if
        const body = parseBlockBody(tokens, i);
        i = body.nextIndex;

        const elifs: { condition: string; body: ASTNode[] }[] = [];
        let elseBody: ASTNode[] | undefined;

        // 处理 elif 链
        while (i < tokens.length && tokens[i].type === 'ELIF') {
          const elifCond = tokens[i].value;
          i++;
          const elifBody = parseBlockBody(tokens, i);
          i = elifBody.nextIndex;
          elifs.push({ condition: elifCond, body: elifBody.nodes });
        }

        // 处理 else
        if (i < tokens.length && tokens[i].type === 'ELSE') {
          i++;
          const elseResult = parseBlockBody(tokens, i);
          i = elseResult.nextIndex;
          elseBody = elseResult.nodes;
        }

        // 跳过 @end
        if (i < tokens.length && tokens[i].type === 'END') i++;

        ast.push({ kind: 'if', condition, body: body.nodes, elifs, elseBody, line: token.line });
        break;
      }

      case 'SCENE':
        ast.push({ kind: 'scene', sceneId: token.value, line: token.line });
        i++;
        break;

      case 'BG':
        ast.push({ kind: 'bg', assetId: token.value, line: token.line });
        i++;
        break;

      case 'BGM':
        ast.push({ kind: 'bgm', assetId: token.value, line: token.line });
        i++;
        break;

      case 'SFX':
        ast.push({ kind: 'sfx', assetId: token.value, line: token.line });
        i++;
        break;

      case 'VAR_SET': {
        const parts = token.value.split('|');
        const varId = parts[0];
        const operator = parts[1] as '+' | '-' | '=';
        const value = parseFloat(parts[2]) || 0;
        ast.push({ kind: 'var_set', varId, operator, value, line: token.line });
        i++;
        break;
      }

      case 'ENDING':
        ast.push({ kind: 'ending', endingType: token.value as 'good' | 'bad', line: token.line });
        i++;
        break;

      case 'JUMP':
        ast.push({ kind: 'jump', target: token.value, line: token.line });
        i++;
        break;

      case 'TEXT':
        ast.push({ kind: 'text', text: token.value, line: token.line });
        i++;
        break;

      default:
        // 跳过未知 token
        i++;
        break;
    }
  }

  return ast;
}

/** 解析块体（直到遇到 ELIF/ELSE/END） */
function parseBlockBody(tokens: Token[], startIdx: number): { nodes: ASTNode[]; nextIndex: number } {
  const nodes: ASTNode[] = [];
  let i = startIdx;

  while (i < tokens.length) {
    const token = tokens[i];
    if (token.type === 'EOF') break;
    if (token.type === 'ELIF' || token.type === 'ELSE' || token.type === 'END') break;

    switch (token.type) {
      case 'SAY': {
        const parts = token.value.split('|');
        nodes.push({ kind: 'say', character: parts[0] || undefined, text: parts.slice(1).join('|'), line: token.line });
        break;
      }
      case 'TEXT':
        nodes.push({ kind: 'text', text: token.value, line: token.line });
        break;
      case 'JUMP':
        nodes.push({ kind: 'jump', target: token.value, line: token.line });
        break;
      case 'SCENE':
        nodes.push({ kind: 'scene', sceneId: token.value, line: token.line });
        break;
      case 'BG':
        nodes.push({ kind: 'bg', assetId: token.value, line: token.line });
        break;
      case 'BGM':
        nodes.push({ kind: 'bgm', assetId: token.value, line: token.line });
        break;
      case 'SFX':
        nodes.push({ kind: 'sfx', assetId: token.value, line: token.line });
        break;
      case 'VAR_SET': {
        const parts = token.value.split('|');
        nodes.push({ kind: 'var_set', varId: parts[0], operator: parts[1] as '+' | '-' | '=', value: parseFloat(parts[2]) || 0, line: token.line });
        break;
      }
      case 'ENDING':
        nodes.push({ kind: 'ending', endingType: token.value as 'good' | 'bad', line: token.line });
        break;
      case 'CHOICE': {
        const options: ASTChoiceOption[] = [];
        i++;
        while (i < tokens.length && tokens[i].type === 'OPTION') {
          const optParts = tokens[i].value.split('|');
          const optEffects = optParts[2] ? optParts[2].split(/[;,]/).map(e => e.trim()).filter(Boolean) : undefined;
          options.push({ text: optParts[0], target: optParts[1] || '', effects: optEffects });
          i++;
        }
        if (i < tokens.length && tokens[i].type === 'END') i++;
        nodes.push({ kind: 'choice', options, line: token.line });
        continue; // 已经手动递增 i
      }
      default:
        break;
    }
    i++;
  }

  return { nodes, nextIndex: i };
}
