import { Context } from 'koishi'
import { AIQuestioningResponse, AI_PROMPT_TEMPLATE } from '../config/questioning'
import { Player } from '../types/player'
import { getRealmName } from './calculator'

/**
 * AI 辅助工具类
 */
export class AIHelper {
  constructor(private ctx: Context) {}

  /**
   * 调用 ChatLuna 生成问心评估
   */
  async generateQuestioningResponse(
    pathName: string,
    pathDescription: string,
    questions: string[],
    answers: string[],
    player: Player
  ): Promise<AIQuestioningResponse> {
    try {
      // 构建 prompt
      const prompt = AI_PROMPT_TEMPLATE
        .replace('{pathName}', pathName)
        .replace('{pathDescription}', pathDescription)
        .replace('{question1}', questions[0])
        .replace('{answer1}', answers[0])
        .replace('{question2}', questions[1])
        .replace('{answer2}', answers[1])
        .replace('{question3}', questions[2])
        .replace('{answer3}', answers[2])
        .replace('{realm}', getRealmName(player.realm, player.realmLevel))
        .replace('{spiritualRoot}', player.spiritualRoot.toString())
        .replace('{cultivation}', player.cultivation.toString())
        .replace('{cultivationMax}', player.cultivationMax.toString())

      this.ctx.logger('xiuxian').info('调用 AI 评估问心结果...')

      // 调用 ChatLuna
      // 注意：这里需要根据实际的 ChatLuna API 进行调整
      const response = await this.callChatLuna(prompt)

      // 解析 JSON 响应
      const result = this.parseAIResponse(response)

      return result
    } catch (error) {
      this.ctx.logger('xiuxian').error('AI 评估失败:', error)
      // 返回默认奖励
      return this.getDefaultResponse()
    }
  }

  /**
   * 调用 ChatLuna API
   */
  private async callChatLuna(prompt: string): Promise<string> {
    try {
      // 方法1: 使用 chatluna service（如果已注入）
      const chatluna = this.ctx.chatluna
      if (chatluna) {
        const result = await chatluna.chat({
          message: prompt,
          userId: 'system',
          conversationId: 'questioning_' + Date.now()
        })
        return result?.text || ''
      }

      // 方法2: 如果没有注入 service，返回模拟响应
      this.ctx.logger('xiuxian').warn('ChatLuna service 未找到，使用默认响应')
      return this.getMockResponse()
    } catch (error) {
      this.ctx.logger('xiuxian').error('ChatLuna 调用失败:', error)
      return this.getMockResponse()
    }
  }

  /**
   * 解析 AI 响应
   */
  private parseAIResponse(response: string): AIQuestioningResponse {
    try {
      // 提取 JSON 部分（可能有前后文字）
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('未找到 JSON 格式响应')
      }

      const parsed = JSON.parse(jsonMatch[0])

      // 验证必需字段
      if (!parsed.personality || !parsed.tendency || !parsed.reward || !parsed.reason) {
        throw new Error('AI 响应缺少必需字段')
      }

      return {
        personality: parsed.personality,
        tendency: parsed.tendency,
        reward: {
          type: parsed.reward.type,
          value: Number(parsed.reward.value)
        },
        reason: parsed.reason
      }
    } catch (error) {
      this.ctx.logger('xiuxian').error('解析 AI 响应失败:', error)
      return this.getDefaultResponse()
    }
  }

  /**
   * 获取模拟响应（用于测试）
   */
  private getMockResponse(): string {
    return JSON.stringify({
      personality: '你的回答体现出对修仙本质的深刻理解，道心坚定，不为外物所动。',
      tendency: '智慧型修仙者',
      reward: {
        type: 'cultivation',
        value: 300
      },
      reason: '问心诚恳，天道有感，赐予修为奖励'
    })
  }

  /**
   * 获取默认响应（发生错误时）
   */
  private getDefaultResponse(): AIQuestioningResponse {
    return {
      personality: '你完成了问心试炼，对修仙之道有了更深的理解。',
      tendency: '求道者',
      reward: {
        type: 'cultivation',
        value: 200
      },
      reason: '完成问心，获得修为奖励'
    }
  }
}

// 扩展 Context 类型（如果需要注入 chatluna）
declare module 'koishi' {
  interface Context {
    chatluna?: any
  }
}
