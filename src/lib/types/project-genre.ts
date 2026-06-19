// 项目题材/行业模式类型
export type Genre = 'suspense' | 'romance' | 'horror' | 'scifi' | 'fantasy' | 'daily' | 'custom';

// 题材对应的创作指引（注入 system prompt，影响 AI 创作倾向）
export const GENRE_GUIDE: Record<Genre, string> = {
  suspense: '悬疑推理题材：注重伏笔与反转，信息揭露节奏要克制，每个选择都应影响真相揭露的方向。角色动机要可推理但不易猜透。多用环境暗示和心理描写。',
  romance: '恋爱养成题材：注重角色情感弧线与关系发展，选择应影响好感度与关系走向。对话要细腻有温度，设置心动、误会、和解等情感节点。',
  horror: '恐怖惊悚题材：注重氛围营造与心理压迫，信息要逐步揭露制造未知恐惧。选择应带来不安感，多用感官描写和空间压迫感。',
  scifi: '科幻未来题材：注重世界观逻辑与技术设定一致性，选择应涉及技术伦理或文明走向。描写要有未来感但符合设定逻辑。',
  fantasy: '奇幻冒险题材：注重世界观丰富度与英雄旅程，选择应影响阵营关系与命运走向。设置探索、战斗、抉择等冒险节点。',
  daily: '日常治愈题材：注重生活细节与情感温度，选择应影响人际关系与生活走向。对话要自然真实，多用日常场景和温暖描写。',
  custom: '自定义题材：按用户描述的风格创作。',
};

export function getGenreGuide(genre: Genre, custom?: string): string {
  if (genre === 'custom' && custom) return `自定义题材：${custom}`;
  return GENRE_GUIDE[genre] ?? GENRE_GUIDE.suspense;
}
