/**
 * DSL 词法分析器 — 把源代码文本切分为 Token 数组
 * 借鉴 VoidNovelEngine 的 .vns 语法
 */

import type { Token } from './types';

/**
 * 把 DSL 源代码切分为 Token 数组
 * 支持中文标签名、对白文本、注释等
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  const lines = source.split('\n');

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const line = rawLine.trim();
    const lineNo = lineIdx + 1;

    // 空行跳过
    if (!line) continue;

    // 注释：; 或 // 开头
    if (line.startsWith(';') || line.startsWith('//')) continue;

    // 标签：#标签名
    if (line.startsWith('#')) {
      const name = line.slice(1).trim();
      tokens.push({ type: 'LABEL', value: name, line: lineNo, col: 1 });
      continue;
    }

    // 命令：@开头
    if (line.startsWith('@')) {
      const token = parseCommand(line, lineNo);
      if (token) tokens.push(token);
      continue;
    }

    // 选项：- "文本" -> #标签
    if (line.startsWith('-')) {
      const token = parseOption(line, lineNo);
      if (token) tokens.push(token);
      continue;
    }

    // 对白：角色名: 文本 或 : 文本（旁白）
    const colonIdx = indexOfColon(line);
    if (colonIdx > 0) {
      const character = line.slice(0, colonIdx).trim();
      const text = line.slice(colonIdx + 1).trim();
      tokens.push({
        type: 'SAY',
        value: `${character}|${text}`,
        line: lineNo,
        col: 1,
      });
      continue;
    }

    // 旁白：: 开头
    if (line.startsWith(':')) {
      const text = line.slice(1).trim();
      tokens.push({ type: 'SAY', value: `|${text}`, line: lineNo, col: 1 });
      continue;
    }

    // 普通文本行
    tokens.push({ type: 'TEXT', value: line, line: lineNo, col: 1 });
  }

  tokens.push({ type: 'EOF', value: '', line: lines.length + 1, col: 1 });
  return tokens;
}

/** 解析 @ 开头的命令行 */
function parseCommand(line: string, lineNo: number): Token | null {
  // 提取命令名和括号内容
  const parenMatch = line.match(/^@(\w+)\s*\(([^]*)\)\s*$/);
  const spaceMatch = line.match(/^@(\w+)\s+(.+)$/);

  if (parenMatch) {
    const cmd = parenMatch[1];
    const arg = parenMatch[2].trim();
    return mapCommand(cmd, arg, lineNo);
  }

  if (spaceMatch) {
    const cmd = spaceMatch[1];
    const arg = spaceMatch[2].trim();
    return mapCommand(cmd, arg, lineNo);
  }

  // 无参数命令
  const bareCmd = line.slice(1).trim();
  return mapCommand(bareCmd, '', lineNo);
}

/** 命令名 → TokenType 映射 */
function mapCommand(cmd: string, arg: string, lineNo: number): Token | null {
  const col = 1;
  switch (cmd) {
    case 'jump': {
      // @jump(#标签) 或 @jump(#标签名)
      const m = arg.match(/^#(.+)$/);
      return { type: 'JUMP', value: m ? m[1] : arg, line: lineNo, col };
    }
    case 'choice':
      return { type: 'CHOICE', value: '', line: lineNo, col };
    case 'if':
      return { type: 'IF', value: arg, line: lineNo, col };
    case 'elif':
      return { type: 'ELIF', value: arg, line: lineNo, col };
    case 'else':
      return { type: 'ELSE', value: '', line: lineNo, col };
    case 'end':
      return { type: 'END', value: '', line: lineNo, col };
    case 'scene':
      return { type: 'SCENE', value: arg, line: lineNo, col };
    case 'bg':
    case 'background':
      return { type: 'BG', value: arg, line: lineNo, col };
    case 'bgm':
    case 'music':
      return { type: 'BGM', value: arg, line: lineNo, col };
    case 'sfx':
    case 'sound':
      return { type: 'SFX', value: arg, line: lineNo, col };
    case 'set': {
      // @set 变量 += 值 / @set 变量 -= 值 / @set 变量 = 值
      const m = arg.match(/^(\S+)\s*([+\-]?=)\s*(.+)$/);
      if (m) {
        const varId = m[1];
        const opStr = m[2];
        const val = m[3].trim();
        const operator = opStr === '+=' ? '+' : opStr === '-=' ? '-' : '=';
        return { type: 'VAR_SET', value: `${varId}|${operator}|${val}`, line: lineNo, col };
      }
      return null;
    }
    case 'ending': {
      const endingType = arg === 'bad' ? 'bad' : 'good';
      return { type: 'ENDING', value: endingType, line: lineNo, col };
    }
    default:
      // 未知命令当作文本处理
      return { type: 'TEXT', value: `@${cmd} ${arg}`.trim(), line: lineNo, col };
  }
}

/** 解析选项行：- "文本" -> #标签 {效果} */
function parseOption(line: string, lineNo: number): Token | null {
  // 匹配 - "选项文本" -> #标签 或 - '选项文本' -> #标签
  const m = line.match(/^-\s*["']([^"']+)["']\s*(?:->\s*#?(\S+))?\s*(?:\{([^}]*)\})?\s*$/);
  if (m) {
    const text = m[1];
    const target = m[2] || '';
    const effects = m[3]?.trim();
    const value = effects ? `${text}|${target}|${effects}` : `${text}|${target}`;
    return { type: 'OPTION', value, line: lineNo, col: 1 };
  }
  // 无引号的选项
  const m2 = line.match(/^-\s*(.+?)(?:\s*->\s*#?(\S+))?\s*$/);
  if (m2) {
    return { type: 'OPTION', value: `${m2[1]}|${m2[2] || ''}`, line: lineNo, col: 1 };
  }
  return null;
}

/** 查找对白分隔冒号的位置（排除 URL 中的冒号） */
function indexOfColon(line: string): number {
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ':') {
      // 排除 :: 或 :// 的情况
      if (i > 0 && line[i - 1] === ':') continue;
      if (line[i + 1] === '/') continue;
      return i;
    }
  }
  return -1;
}
