/**
 * DSL Token 和 AST 类型定义
 * 借鉴 VoidNovelEngine 的 .vns 语法，适配 ChaseDream 数据模型
 */

// ── Token 类型 ──────────────────────────────────────────────

export type TokenType =
  | 'LABEL'    // #标签名
  | 'JUMP'     // @jump(#标签)
  | 'SAY'      // 角色:文本 或 :文本
  | 'CHOICE'   // @choice
  | 'OPTION'   // - "文本" -> #标签
  | 'SCENE'    // @scene(场景ID)
  | 'BG'       // @bg(资产ID)
  | 'BGM'      // @bgm(资产ID)
  | 'SFX'      // @sfx(资产ID)
  | 'IF'       // @if(条件)
  | 'ELIF'     // @elif(条件)
  | 'ELSE'     // @else
  | 'END'      // @end
  | 'VAR_SET'  // @set 变量 += 值
  | 'ENDING'   // @ending good/bad
  | 'TEXT'     // 普通文本行
  | 'COMMENT'  // ; 或 // 注释（跳过）
  | 'EOF';

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

// ── AST 节点类型 ────────────────────────────────────────────

export interface ASTLabel {
  kind: 'label';
  name: string;
  line: number;
}

export interface ASTSay {
  kind: 'say';
  character?: string;
  text: string;
  line: number;
}

export interface ASTChoiceOption {
  text: string;
  target: string;
  effects?: string[];
}

export interface ASTChoice {
  kind: 'choice';
  options: ASTChoiceOption[];
  line: number;
}

export interface ASTScene {
  kind: 'scene';
  sceneId: string;
  line: number;
}

export interface ASTBg {
  kind: 'bg';
  assetId: string;
  line: number;
}

export interface ASTBgm {
  kind: 'bgm';
  assetId: string;
  line: number;
}

export interface ASTSfx {
  kind: 'sfx';
  assetId: string;
  line: number;
}

export interface ASTIf {
  kind: 'if';
  condition: string;
  body: ASTNode[];
  elifs: { condition: string; body: ASTNode[] }[];
  elseBody?: ASTNode[];
  line: number;
}

export interface ASTVarSet {
  kind: 'var_set';
  varId: string;
  operator: '+' | '-' | '=';
  value: number;
  line: number;
}

export interface ASTEnding {
  kind: 'ending';
  endingType: 'good' | 'bad';
  line: number;
}

export interface ASTJump {
  kind: 'jump';
  target: string;
  line: number;
}

export interface ASTText {
  kind: 'text';
  text: string;
  line: number;
}

export type ASTNode =
  | ASTLabel
  | ASTSay
  | ASTChoice
  | ASTScene
  | ASTBg
  | ASTBgm
  | ASTSfx
  | ASTIf
  | ASTVarSet
  | ASTEnding
  | ASTJump
  | ASTText;
