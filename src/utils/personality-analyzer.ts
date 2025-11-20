/**
 * 性格分析系统
 *
 * 根据用户回答量化性格特征
 */

/**
 * 性格评分
 * 每个维度 0-10 分
 */
export interface PersonalityScore {
  // === 正面特征 ===
  determination: number   // 决断力
  courage: number        // 勇气
  stability: number      // 稳定性
  focus: number         // 专注力
  honesty: number       // 诚实
  kindness: number      // 善良

  // === 负面特征 ===
  greed: number         // 贪念
  impatience: number    // 急躁
  manipulation: number  // 操控（试图作弊）
}

/**
 * 创建空的性格评分
 */
function createEmptyScore(): PersonalityScore {
  return {
    determination: 0,
    courage: 0,
    stability: 0,
    focus: 0,
    honesty: 0,
    kindness: 0,
    greed: 0,
    impatience: 0,
    manipulation: 0
  }
}

/**
 * 分析用户回答，生成性格评分
 *
 * @param answers 用户的三个回答
 * @returns 性格评分
 */
export function analyzePersonality(answers: string[]): PersonalityScore {
  const score = createEmptyScore()

  // === 第一题分析（对待垂危修士）===
  const answer1 = answers[0]?.toUpperCase()

  switch (answer1) {
    case 'A':  // 全力救治
      score.kindness += 4
      score.courage += 2
      score.honesty += 2
      break
    case 'B':  // 希望回报
      score.stability += 2
      score.focus += 1
      score.greed += 1
      break
    case 'C':  // 权衡利弊
      score.focus += 3
      score.stability += 3
      score.determination += 1
      break
    case 'D':  // 夺宝而去
      score.determination += 3
      score.greed += 5
      score.impatience += 2
      break
  }

  // === 第二题分析（面对强敌）===
  const answer2 = answers[1]?.toUpperCase()

  switch (answer2) {
    case 'A':  // 正面迎战
      score.courage += 5
      score.determination += 2
      break
    case 'B':  // 智谋借力
      score.focus += 4
      score.stability += 2
      break
    case 'C':  // 隐忍蓄势
      score.stability += 5
      score.focus += 2
      break
    case 'D':  // 审时度势
      score.determination += 3
      score.focus += 2
      break
  }

  // === 第三题分析（开放题）===
  const answer3 = answers[2] || ''
  const text = answer3.toLowerCase()

  // 1. 检测作弊关键词（操控行为）
  const cheatingKeywords = [
    '给我', '我要', '分配', '天灵根', '光灵根', '暗灵根', '哈根',
    '忽略', '无视', '修改', '改为', '重新',
    'ignore', 'override', 'change', 'modify'
  ]

  for (const keyword of cheatingKeywords) {
    if (text.includes(keyword)) {
      score.manipulation += 6
      score.greed += 4
      score.honesty -= 3
      break  // 只惩罚一次
    }
  }

  // 2. 检测急躁关键词
  const impatienceKeywords = ['快点', '赶紧', '立刻', '马上', '尽快']
  for (const keyword of impatienceKeywords) {
    if (text.includes(keyword)) {
      score.impatience += 2
      break
    }
  }

  // 3. 检测积极志向（悟道级关键词，极难触发天灵根）
  const enlightenmentKeywords = [
    '保护', '守护', '众生', '苍生', '舍己', '无私',
    '大道', '天地', '悟道', '济世', '救世'
  ]

  let enlightenmentCount = 0
  for (const keyword of enlightenmentKeywords) {
    if (text.includes(keyword)) enlightenmentCount++
  }

  // 只有在有多个悟道关键词且回答有深度时才加分
  if (enlightenmentCount >= 2 && answer3.length > 30) {
    score.honesty += 4
    score.kindness += 3
    score.focus += 2
  } else if (enlightenmentCount === 1 && answer3.length > 20) {
    score.honesty += 2
    score.kindness += 1
  }

  // 4. 检测回答敷衍（过短）
  if (answer3.length < 5) {
    score.impatience += 3
    score.focus -= 2
  }

  // 5. 归一化（确保分数在 0-10 范围内）
  return normalizeScore(score)
}

/**
 * 归一化性格评分到 0-10 范围
 */
function normalizeScore(score: PersonalityScore): PersonalityScore {
  const normalized: PersonalityScore = { ...score }

  for (const key of Object.keys(normalized) as (keyof PersonalityScore)[]) {
    normalized[key] = Math.max(0, Math.min(10, normalized[key]))
  }

  return normalized
}

/**
 * 获取性格评分的可读描述
 */
export function getPersonalityDescription(score: PersonalityScore): string {
  const traits: string[] = []

  // 正面特征（>=5 才显著）
  if (score.courage >= 5) traits.push('勇敢')
  if (score.kindness >= 5) traits.push('善良')
  if (score.determination >= 5) traits.push('果决')
  if (score.stability >= 5) traits.push('稳重')
  if (score.focus >= 5) traits.push('专注')
  if (score.honesty >= 5) traits.push('诚实')

  // 负面特征（>=3 就显著）
  if (score.greed >= 3) traits.push('贪婪')
  if (score.impatience >= 3) traits.push('急躁')
  if (score.manipulation >= 3) traits.push('狡诈')

  return traits.length > 0 ? traits.join('、') : '平凡'
}
