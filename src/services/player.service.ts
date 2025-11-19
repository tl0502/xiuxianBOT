import { Context } from 'koishi'
import { Player, CreatePlayerInput, PlayerDisplayInfo, ServiceResult } from '../types/player'
import { REALMS, GameConfig, PlayerStatus } from '../config/constants'
import {
  calculateCombatPower,
  getRealmName,
  getNextRealmMaxCultivation,
  calculateCultivationSpeed,
  calculateBreakthroughRate
} from '../utils/calculator'
import { randomInt, randomSuccess } from '../utils/random'
import { formatDate } from '../utils/formatter'

/**
 * 玩家服务类
 */
export class PlayerService {
  constructor(private ctx: Context) {}

  /**
   * 获取玩家信息
   */
  async getPlayer(userId: string): Promise<Player | null> {
    const [player] = await this.ctx.database.get('xiuxian_player_v2', { userId })
    return player || null
  }

  /**
   * 检查玩家是否存在
   */
  async exists(userId: string): Promise<boolean> {
    const player = await this.getPlayer(userId)
    return player !== null
  }

  /**
   * 创建新玩家
   */
  async create(input: CreatePlayerInput): Promise<ServiceResult<{ player: Player; spiritualRoot: number }>> {
    // 检查是否已存在
    const existing = await this.getPlayer(input.userId)
    if (existing) {
      return {
        success: false,
        message: `你已踏入仙途，道号：${existing.username}`
      }
    }

    // 随机生成灵根
    const spiritualRoot = randomInt(GameConfig.MIN_SPIRITUAL_ROOT, GameConfig.MAX_SPIRITUAL_ROOT)

    // 创建玩家
    const player = await this.ctx.database.create('xiuxian_player_v2', {
      userId: input.userId,
      username: input.username,
      realm: GameConfig.INITIAL_REALM,
      realmLevel: GameConfig.INITIAL_REALM_LEVEL,
      cultivation: GameConfig.INITIAL_CULTIVATION,
      cultivationMax: REALMS[0].maxCultivation / 4, // 初期需要的修��
      spiritStone: GameConfig.INITIAL_SPIRIT_STONE,
      spiritualRoot,
      combatPower: spiritualRoot * 10, // 初始战力
      status: PlayerStatus.IDLE,
      statusEndTime: null,
      sectId: null,
      sectContribution: 0,
      createTime: new Date(),
      lastActiveTime: new Date(),
      totalCombatWin: 0,
      totalCombatLose: 0,
    })

    return {
      success: true,
      data: { player, spiritualRoot },
      message: '���建成功'
    }
  }

  /**
   * 获取玩家展示信息
   */
  async getDisplayInfo(userId: string): Promise<ServiceResult<PlayerDisplayInfo>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return {
        success: false,
        message: '玩家不存在'
      }
    }

    return {
      success: true,
      data: {
        name: player.username,
        realm: getRealmName(player.realm, player.realmLevel),
        cultivation: player.cultivation,
        cultivationMax: player.cultivationMax,
        spiritStone: player.spiritStone,
        spiritualRoot: player.spiritualRoot,
        combatPower: calculateCombatPower(player),
        createDate: formatDate(player.createTime)
      },
      message: '查询成功'
    }
  }

  /**
   * 开始修炼
   */
  async startCultivation(userId: string, hours: number = 1): Promise<ServiceResult<{ speed: number; gain: number }>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }

    if (player.status !== PlayerStatus.IDLE) {
      return { success: false, message: '你正在忙碌中，无法修炼' }
    }

    const speed = calculateCultivationSpeed(player)
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000)

    await this.ctx.database.set('xiuxian_player_v2', { userId }, {
      status: PlayerStatus.CULTIVATING,
      statusEndTime: endTime,
      lastActiveTime: new Date()
    })

    return {
      success: true,
      data: { speed, gain: speed * hours },
      message: '修炼开始'
    }
  }

  /**
   * 结算修炼
   */
  async settleCultivation(userId: string): Promise<ServiceResult<{ gained: number; current: number; max: number }>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }

    if (player.status !== PlayerStatus.CULTIVATING || !player.statusEndTime) {
      return { success: false, message: '你当前并未在修炼中' }
    }

    // 计算实际修炼时间（小��）
    const startTime = player.lastActiveTime.getTime()
    const endTime = Math.min(Date.now(), new Date(player.statusEndTime).getTime())
    const hours = (endTime - startTime) / (60 * 60 * 1000)

    // 计算收益
    const speed = calculateCultivationSpeed(player)
    const gained = Math.floor(speed * hours)
    const newCultivation = Math.min(player.cultivation + gained, player.cultivationMax)

    // 更新数据
    await this.ctx.database.set('xiuxian_player_v2', { userId }, {
      cultivation: newCultivation,
      status: PlayerStatus.IDLE,
      statusEndTime: null,
      lastActiveTime: new Date()
    })

    return {
      success: true,
      data: {
        gained,
        current: newCultivation,
        max: player.cultivationMax
      },
      message: '修炼结算完成'
    }
  }

  /**
   * 尝试突破
   */
  async breakthrough(userId: string): Promise<ServiceResult<{ success: boolean; newRealm?: string; rate: number }>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }

    // 检查是否达到修为上限
    if (player.cultivation < player.cultivationMax) {
      return {
        success: false,
        message: `修为未满，当前：${player.cultivation}/${player.cultivationMax}`
      }
    }

    // 检查是否已达最高境界
    if (player.realm >= REALMS.length - 1 && player.realmLevel >= 3) {
      return { success: false, message: '你已达到最高境界' }
    }

    // 计算突破成功率
    const rate = calculateBreakthroughRate(player)
    const isSuccess = randomSuccess(rate)

    if (isSuccess) {
      // 突破成功
      let newRealm = player.realm
      let newRealmLevel = player.realmLevel + 1

      if (newRealmLevel > 3) {
        newRealm++
        newRealmLevel = 0
      }

      const newCultivationMax = getNextRealmMaxCultivation(newRealm, newRealmLevel)
      const newCombatPower = calculateCombatPower({ ...player, realm: newRealm, realmLevel: newRealmLevel })

      await this.ctx.database.set('xiuxian_player_v2', { userId }, {
        realm: newRealm,
        realmLevel: newRealmLevel,
        cultivation: 0,
        cultivationMax: newCultivationMax,
        combatPower: newCombatPower,
        lastActiveTime: new Date()
      })

      return {
        success: true,
        data: {
          success: true,
          newRealm: getRealmName(newRealm, newRealmLevel),
          rate
        },
        message: '突破成功'
      }
    } else {
      // 突破失败，修为清空
      await this.ctx.database.set('xiuxian_player_v2', { userId }, {
        cultivation: 0,
        lastActiveTime: new Date()
      })

      return {
        success: true,
        data: {
          success: false,
          rate
        },
        message: '突破失败'
      }
    }
  }
}
