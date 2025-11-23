import { Context } from 'koishi'
import { QuestioningRecord } from '../../types/questioning'

// 扩展数据库类型
declare module 'koishi' {
  interface Tables {
    xiuxian_questioning_v3: QuestioningRecord
  }
}

/**
 * 初始化问心记录表
 */
export function initQuestioningModel(ctx: Context) {
  ctx.model.extend('xiuxian_questioning_v3', {
    // 主键
    id: 'unsigned',

    // 玩家信息
    userId: 'string',

    // 路径信息
    pathId: 'string',
    pathName: 'string',

    // 三次回答（向后兼容）
    answer1: 'string',
    answer2: 'string',
    answer3: 'text', // 文本题可能较长

    // v1.3.0 新增：完整答案数组（JSON格式）
    answersJson: 'text',

    // AI 完整响应（JSON）
    aiResponse: 'text',

    // 解析后的结果
    personality: 'text',
    tendency: 'string',
    rewardType: 'string',
    rewardValue: 'unsigned',
    rewardReason: 'text',

    // 时间
    createTime: 'timestamp',
  }, {
    primary: 'id',
    autoInc: true,
  })
}
