/**
 * 消息文案常量
 */

export const Messages = {
  // 系统消息
  NO_SESSION: '系统错误：无法获取会话信息',
  NOT_REGISTERED: ' 你尚未踏入仙途，使用 步入仙途 开启修仙之路吧！',

  // 玩家相关
  ALREADY_REGISTERED: (name: string) =>
    ` 你已踏入仙途，无需重复入门。\n道号：${name}`,

  WELCOME: (name: string, spiritualRoot: number) =>
    ` 恭喜你踏入修仙世界！\n\n✨ 你的仙途由此开启 ✨\n道号：${name}\n灵根资质：${spiritualRoot}\n\n${getSpiritualRootComment(spiritualRoot)}\n\n愿你在这修仙世界中破开虚妄，证得大道！\n\n💡 使用 天道记录 查看你的信息`,

  PLAYER_INFO: (data: {
    name: string
    realm: string
    cultivation: number
    cultivationMax: number
    spiritStone: number
    spiritualRoot: number
    combatPower: number
    createDate: string
  }) =>
    `\n\n━━━━ 天道记录 ━━━━\n\n` +
    `👤 道号：${data.name}\n` +
    `⭐ 境界：${data.realm}\n` +
    `📊 修为：${data.cultivation}/${data.cultivationMax}\n` +
    `💎 灵石：${data.spiritStone}\n` +
    `🌟 灵根：${data.spiritualRoot}\n` +
    `⚔️ 战力：${data.combatPower}\n` +
    `📅 入门时间：${data.createDate}\n\n` +
    `━━━━━━━━━━━━━━`,

  // 错误消息
  CREATE_ERROR: ' 踏入仙途时遇到了天劫阻碍，请稍后再试...',
  QUERY_ERROR: ' 查询天道记录时遇到了问题，请稍后再试...',
  CULTIVATION_ERROR: ' 修炼过程中遇到了心魔，请稍后再试...',
  BREAKTHROUGH_ERROR: ' 突破时遇到了问题，请稍后再试...',

  // 修炼相关
  ALREADY_CULTIVATING: ' 你正在修炼中，无法重复打坐',
  START_CULTIVATION: (hours: number, gainPerHour: number) =>
    ` 你开始盘膝打坐，进入修炼状态...\n\n修炼时长：${hours}小时\n预计收益：${gainPerHour * hours}修为\n\n${hours}小时后再次使用本命令结算收益`,

  CULTIVATION_COMPLETE: (gained: number, currentCultivation: number, maxCultivation: number) =>
    ` 你结束了这次修炼\n\n获得修为：+${gained}\n当前修为：${currentCultivation}/${maxCultivation}\n\n${currentCultivation >= maxCultivation ? '💫 你已达到瓶颈，可以尝试 突破 冲击下一境界！' : ''}`,

  NOT_CULTIVATING: ' 你当前并未在修炼中',

  // 突破相关
  CANNOT_BREAKTHROUGH: (current: number, max: number) =>
    ` 你的修为尚未达到瓶颈\n\n当前修为：${current}/${max}\n还需修炼：${max - current}`,

  BREAKTHROUGH_SUCCESS: (newRealm: string) =>
    ` 🎉 突破成功！恭喜你踏入 ${newRealm} 境界！\n\n你感觉到体内灵力澎湃，实力大增！`,

  BREAKTHROUGH_FAIL: (rate: number) =>
    ` 💔 突破失败...\n\n天劫太过凶险，你未能成功突破。修为已清空，需重新修炼。\n本次突破成功率：${(rate * 100).toFixed(1)}%`,

  MAX_REALM: ' 你已达到大乘期大圆满，已是这方世界的巅峰！',

  // 冷却相关
  COOLDOWN: (seconds: number) =>
    ` 操作过于频繁，请稍后再试\n剩余冷却：${seconds}秒`,
} as const

/**
 * 根据灵根给出评价
 */
function getSpiritualRootComment(spiritualRoot: number): string {
  if (spiritualRoot >= 90) return '🌟 天灵根！你拥有万中无一的修仙资质！'
  if (spiritualRoot >= 75) return '⭐ 优秀灵根，修炼速度将远超常人'
  if (spiritualRoot >= 50) return '✨ 中等灵根，只要勤加修炼，必有所成'
  if (spiritualRoot >= 25) return '💫 普通灵根，修仙之路任重道远'
  return '🌫️ 驽钝之资，修炼将十分艰难'
}
