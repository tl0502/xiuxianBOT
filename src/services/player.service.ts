import { Player, CreatePlayerInput, PlayerDisplayInfo, ServiceResult } from '../types/player'
import { REALMS, REALM_LEVELS, GameConfig, PlayerStatus } from '../config/constants'
import {
  calculateCombatPower,
  getRealmName,
  getNextRealmMaxCultivation,
  getSpiritualRootInfo
} from '../utils/calculator'
import { randomSuccess } from '../utils/random'
import { formatDate } from '../utils/formatter'
import { IAppContext } from '../adapters/interfaces'
import { BuffService } from './buff.service'
import { BonusCalculatorService } from './bonus-calculator.service'

/**
 * 玩家服务类
 *
 * 注意：此服务已解耦 Koishi 框架，依赖 IAppContext 接口
 * v1.0.0 更新：集成Buff系统，支持多来源加成
 */
export class PlayerService {
  private buffService: BuffService
  private bonusCalculator: BonusCalculatorService

  constructor(private context: IAppContext) {
    // 初始化buff相关服务
    this.buffService = new BuffService(context)
    this.bonusCalculator = new BonusCalculatorService(this.buffService)
  }

  /**
   * 获取玩家信息
   */
  async getPlayer(userId: string): Promise<Player | null> {
    const players = await this.context.database.get<Player>('xiuxian_player_v3', { userId })
    return players[0] || null
  }

  /**
   * 检查玩家是否存在
   */
  async exists(userId: string): Promise<boolean> {
    const player = await this.getPlayer(userId)
    return player !== null
  }

  /**
   * 创建新玩家（由 AI 分配道号和灵根）
   */
  async create(input: CreatePlayerInput): Promise<ServiceResult<{ player: Player }>> {
    // 检查是否已存在
    const existing = await this.getPlayer(input.userId)
    if (existing) {
      return {
        success: false,
        message: `你已踏入仙途，道号：${existing.username}`
      }
    }

    // 创建玩家（使用 AI 分配的道号和灵根）
    let player: Player
    try {
      player = await this.context.database.create('xiuxian_player_v3', {
        userId: input.userId,
        username: input.username,  // AI 分配的道号
        spiritualRoot: input.spiritualRoot,  // 当前灵根（可升级）
        initialSpiritualRoot: input.spiritualRoot,  // 初始灵根（不可变，用于统计）
        realm: GameConfig.INITIAL_REALM,
        realmLevel: GameConfig.INITIAL_REALM_LEVEL,
        cultivation: GameConfig.INITIAL_CULTIVATION,
        cultivationMax: REALMS[0].maxCultivation / 4,
        spiritStone: GameConfig.INITIAL_SPIRIT_STONE,
        combatPower: 0,  // 初始战力，会在下面计算
        status: PlayerStatus.IDLE,
        statusEndTime: null,
        sectId: null,
        sectContribution: 0,
        createTime: new Date(),
        lastActiveTime: new Date(),
        totalCombatWin: 0,
        totalCombatLose: 0,
      }) as unknown as Player
    } catch (err: any) {
      // 并发下可能触发唯一键冲突，这里做二次确认并友好提示
      const existed = await this.getPlayer(input.userId)
      if (existed) {
        return {
          success: false,
          message: `你已踏入仙途，道号：${existed.username}`
        }
      }
      // 其他错误向上抛出通用提示
      this.context.logger.error('创建玩家失败:', err)
      return { success: false, message: '创建玩家失败，请稍后再试' }
    }

    // 计算初始战力
    const combatPower = calculateCombatPower(player)
    await this.context.database.set<Player>('xiuxian_player_v3', { userId: input.userId }, {
      combatPower
    })

    // 重新获取更新后的玩家数据
    const updatedPlayer = await this.getPlayer(input.userId)

    return {
      success: true,
      data: { player: updatedPlayer! },
      message: '创建成功'
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

    const spiritualRootInfo = getSpiritualRootInfo(player.spiritualRoot)

    return {
      success: true,
      data: {
        name: player.username,
        realm: getRealmName(player.realm, player.realmLevel),
        cultivation: player.cultivation,
        cultivationMax: player.cultivationMax,
        spiritStone: player.spiritStone,
        spiritualRoot: spiritualRootInfo.name,
        spiritualRootDesc: spiritualRootInfo.description,
        combatPower: calculateCombatPower(player),
        createDate: formatDate(player.createTime)
      },
      message: '查询成功'
    }
  }

  /**
   * 开始修炼
   * v1.0.0 更新：使用BonusCalculatorService计算修炼速度（包含buff加成）
   */
  async startCultivation(userId: string, hours: number = 1): Promise<ServiceResult<{ speed: number; gain: number }>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }

    if (player.status !== PlayerStatus.IDLE) {
      return { success: false, message: '你正在忙碌中，无法修炼' }
    }

    // ✨ v1.0.0：使用包含buff加成的计算
    const cultivationMultiplier = await this.bonusCalculator.calculateCultivationMultiplier(player)
    const speed = Math.floor(GameConfig.CULTIVATION_BASE_SPEED * cultivationMultiplier)
    const endTime = new Date(Date.now() + hours * 60 * 60 * 1000)

    await this.context.database.set<Player>('xiuxian_player_v3', { userId }, {
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
   * v1.0.0 更新：使用包含buff加成的修炼速度和修为需求计算
   */
  async settleCultivation(userId: string): Promise<ServiceResult<{ gained: number; current: number; max: number }>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }

    if (player.status !== PlayerStatus.CULTIVATING || !player.statusEndTime) {
      return { success: false, message: '你当前并未在修炼中' }
    }

    // 计算实际修炼时间（小时）
    const startTime = player.lastActiveTime.getTime()
    const endTime = Math.min(Date.now(), new Date(player.statusEndTime).getTime())
    const hours = (endTime - startTime) / (60 * 60 * 1000)

    // ✨ v1.0.0：使用包含buff加成的计算
    const cultivationMultiplier = await this.bonusCalculator.calculateCultivationMultiplier(player)
    const speed = Math.floor(GameConfig.CULTIVATION_BASE_SPEED * cultivationMultiplier)
    const gained = Math.floor(speed * hours)

    // ✨ v1.0.0：考虑修为需求倍率（可能被buff修改）
    const cultivationMax = await this.bonusCalculator.calculateCultivationRequirement(player, player.cultivationMax)
    const newCultivation = Math.min(player.cultivation + gained, cultivationMax)

    // 更新数据
    await this.context.database.set<Player>('xiuxian_player_v3', { userId }, {
      cultivation: newCultivation,
      cultivationMax,  // ✨ 更新可能被buff修改的上限
      status: PlayerStatus.IDLE,
      statusEndTime: null,
      lastActiveTime: new Date()
    })

    return {
      success: true,
      data: {
        gained,
        current: newCultivation,
        max: cultivationMax
      },
      message: '修炼结算完成'
    }
  }

  /**
   * 尝试突破
   * v1.0.0 更新：使用包含buff加成的突破率计算
   * v1.0.1 更新：区分小境界和大境界突破机制
   */
  async breakthrough(userId: string): Promise<ServiceResult<{ success: boolean; newRealm?: string; rate: number }>> {
    const player = await this.getPlayer(userId)
    if (!player) {
      return { success: false, message: '玩家不存在' }
    }

    // ✨ v1.0.0：使用可能被buff修改的修为需求检查
    const cultivationMax = await this.bonusCalculator.calculateCultivationRequirement(player, player.cultivationMax)

    // 检查是否达到修为上限
    if (player.cultivation < cultivationMax) {
      return {
        success: false,
        message: `修为未满，当前：${player.cultivation}/${cultivationMax}`
      }
    }

    // ✨ v1.0.1：动态获取最大小境界等级（支持未来扩展）
    const maxRealmLevel = REALM_LEVELS.length - 1

    // 检查是否已达最高境界
    if (player.realm >= REALMS.length - 1 && player.realmLevel >= maxRealmLevel) {
      return { success: false, message: '你已达到最高境界' }
    }

    // ✨ v1.0.1：判断是否为大境界突破
    const isMajorBreakthrough = player.realmLevel === maxRealmLevel

    if (isMajorBreakthrough) {
      // ========== 大境界突破：有失败风险 ==========
      // 计算突破率（基础 + 灵根 + buff）
      const rate = await this.bonusCalculator.calculateBreakthroughRate(player)
      const isSuccess = randomSuccess(rate)

      if (isSuccess) {
        // 突破成功：进入下一个大境界的初期
        const newRealm = player.realm + 1
        const newRealmLevel = 0

        // 计算新境界的修为上限
        const baseNewCultivationMax = getNextRealmMaxCultivation(newRealm, newRealmLevel)
        const newCultivationMax = await this.bonusCalculator.calculateCultivationRequirement(
          { ...player, realm: newRealm, realmLevel: newRealmLevel },
          baseNewCultivationMax
        )

        const newCombatPower = calculateCombatPower({ ...player, realm: newRealm, realmLevel: newRealmLevel })

        await this.context.database.set<Player>('xiuxian_player_v3', { userId }, {
          realm: newRealm,
          realmLevel: newRealmLevel,
          cultivation: 0,  // 大境界突破成功，修为清零
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
          message: '突破成功！踏入新的大境界'
        }
      } else {
        // 突破失败：修为清空，境界不变
        await this.context.database.set<Player>('xiuxian_player_v3', { userId }, {
          cultivation: 0,
          lastActiveTime: new Date()
        })

        return {
          success: true,
          data: {
            success: false,
            rate
          },
          message: '突破失败，修为散尽'
        }
      }
    } else {
      // ========== 小境界突破：100%成功，不清空修为 ==========
      const newRealmLevel = player.realmLevel + 1

      // 计算新小境界的修为上限
      const baseNewCultivationMax = getNextRealmMaxCultivation(player.realm, newRealmLevel)
      const newCultivationMax = await this.bonusCalculator.calculateCultivationRequirement(
        { ...player, realmLevel: newRealmLevel },
        baseNewCultivationMax
      )

      const newCombatPower = calculateCombatPower({ ...player, realmLevel: newRealmLevel })

      await this.context.database.set<Player>('xiuxian_player_v3', { userId }, {
        realmLevel: newRealmLevel,
        cultivationMax: newCultivationMax,
        combatPower: newCombatPower,
        lastActiveTime: new Date()
        // 注意：cultivation 不更新，保留当前修为继续累积
      })

      return {
        success: true,
        data: {
          success: true,
          newRealm: getRealmName(player.realm, newRealmLevel),
          rate: 1.0  // 小境界突破100%成功
        },
        message: '突破成功！修为更上一层'
      }
    }
  }

  /**
   * 获取BuffService实例（供其他模块使用）
   */
  getBuffService(): BuffService {
    return this.buffService
  }

  /**
   * 获取BonusCalculatorService实例（供其他模块使用）
   */
  getBonusCalculator(): BonusCalculatorService {
    return this.bonusCalculator
  }
}
