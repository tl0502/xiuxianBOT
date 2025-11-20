/**
 * 灵根系统配置
 */

/**
 * 灵根类型
 */
export enum SpiritualRootType {
  // 天灵根
  LIGHT = 'light',        // 光
  DARK = 'dark',          // 暗

  // 五行灵根
  METAL = 'metal',        // 金
  WOOD = 'wood',          // 木
  WATER = 'water',        // 水
  FIRE = 'fire',          // 火
  EARTH = 'earth',        // 土

  // 真灵根
  QI = 'qi',              // 气

  // 伪灵根
  PSEUDO = 'pseudo',      // 伪灵根

  // 隐藏灵根
  HA = 'ha',              // 哈根
}

/**
 * 灵根分类
 */
export enum SpiritualRootCategory {
  HEAVENLY = 'heavenly',  // 天灵根
  FIVE_ELEMENT = 'five_element', // 五行灵根
  TRUE = 'true',          // 真灵根
  PSEUDO = 'pseudo',      // 伪灵根
  HIDDEN = 'hidden',      // 隐藏灵根
}

/**
 * 灵根定义
 */
export interface SpiritualRootDefinition {
  type: SpiritualRootType
  category: SpiritualRootCategory
  name: string
  description: string
  rarity: number // 稀有度 1-5，5最稀有
  // 性格特征（用于 AI 匹配）
  personalityTraits: string[]
  // 属性加成接口（预留）
  bonuses?: {
    cultivation?: number      // 修炼速度加成
    breakthrough?: number     // 突破成功率加成
    combatPower?: number      // 战力加成
    [key: string]: number | undefined
  }
}

/**
 * 所有灵根配置
 */
export const SPIRITUAL_ROOTS: Record<SpiritualRootType, SpiritualRootDefinition> = {
  // 天灵根
  [SpiritualRootType.LIGHT]: {
    type: SpiritualRootType.LIGHT,
    category: SpiritualRootCategory.HEAVENLY,
    name: '光灵根',
    description: '天生亲和光明之力，修炼光系功法事半功倍',
    rarity: 5,
    personalityTraits: ['正义', '善良', '光明磊落', '守护', '无私', '仁德'],
    bonuses: {
      cultivation: 1.5,
      breakthrough: 0.1
    }
  },
  [SpiritualRootType.DARK]: {
    type: SpiritualRootType.DARK,
    category: SpiritualRootCategory.HEAVENLY,
    name: '暗灵根',
    description: '天生亲和黑暗之力，修炼暗系功法威力倍增',
    rarity: 5,
    personalityTraits: ['冷静', '独立', '深沉', '果决', '神秘', '理智'],
    bonuses: {
      cultivation: 1.5,
      combatPower: 1.2
    }
  },

  // 五行灵根
  [SpiritualRootType.METAL]: {
    type: SpiritualRootType.METAL,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '金灵根',
    description: '金之力凝聚，攻击锋利如刃',
    rarity: 3,
    personalityTraits: ['果断', '锐利', '进取', '坚毅', '勇武', '刚强'],
    bonuses: {
      combatPower: 1.15
    }
  },
  [SpiritualRootType.WOOD]: {
    type: SpiritualRootType.WOOD,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '木灵根',
    description: '木之力生生不息，恢复能力极强',
    rarity: 3,
    personalityTraits: ['仁慈', '温和', '包容', '生机', '慈悲', '宽厚'],
    bonuses: {
      cultivation: 1.2
    }
  },
  [SpiritualRootType.WATER]: {
    type: SpiritualRootType.WATER,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '水灵根',
    description: '水之力柔韧变化，适应性强',
    rarity: 3,
    personalityTraits: ['灵活', '智慧', '适应', '圆融', '变通', '睿智'],
    bonuses: {
      cultivation: 1.15,
      breakthrough: 0.05
    }
  },
  [SpiritualRootType.FIRE]: {
    type: SpiritualRootType.FIRE,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '火灵根',
    description: '火之力狂暴炽热，攻击力强大',
    rarity: 3,
    personalityTraits: ['热情', '激情', '冲动', '勇敢', '直率', '豪爽'],
    bonuses: {
      combatPower: 1.2
    }
  },
  [SpiritualRootType.EARTH]: {
    type: SpiritualRootType.EARTH,
    category: SpiritualRootCategory.FIVE_ELEMENT,
    name: '土灵根',
    description: '土之力厚重稳固，防御力超群',
    rarity: 3,
    personalityTraits: ['稳重', '踏实', '坚韧', '沉着', '可靠', '厚重'],
    bonuses: {
      breakthrough: 0.08
    }
  },

  // 真灵根
  [SpiritualRootType.QI]: {
    type: SpiritualRootType.QI,
    category: SpiritualRootCategory.TRUE,
    name: '气灵根',
    description: '天地元气凝聚而成，修炼速度极快',
    rarity: 4,
    personalityTraits: ['超然', '悟性', '灵性', '天赋', '平衡', '通透'],
    bonuses: {
      cultivation: 1.8,
      breakthrough: 0.15
    }
  },

  // 伪灵根
  [SpiritualRootType.PSEUDO]: {
    type: SpiritualRootType.PSEUDO,
    name: '伪灵根',
    category: SpiritualRootCategory.PSEUDO,
    description: '驽钝之资，修炼艰难',
    rarity: 1,
    personalityTraits: ['平凡', '坚持', '意志', '不屈', '努力', '普通'],
    bonuses: {
      cultivation: 0.8
    }
  },

  // 隐藏灵根（不应在初始分配）
  [SpiritualRootType.HA]: {
    type: SpiritualRootType.HA,
    category: SpiritualRootCategory.HIDDEN,
    name: '哈根',
    description: '???神秘莫测的特殊灵根',
    rarity: 5,
    personalityTraits: ['神秘', '未知', '特殊'], // 隐藏灵根不应在初始获得
    bonuses: {
      cultivation: 2.0,
      breakthrough: 0.2,
      combatPower: 1.5
    }
  }
}

/**
 * 根据灵根类型获取定义
 */
export function getSpiritualRoot(type: SpiritualRootType): SpiritualRootDefinition {
  return SPIRITUAL_ROOTS[type]
}

/**
 * 根据分类获取所有灵根
 */
export function getSpiritualRootsByCategory(category: SpiritualRootCategory): SpiritualRootDefinition[] {
  return Object.values(SPIRITUAL_ROOTS).filter(root => root.category === category)
}

/**
 * 获取灵根显示名称
 */
export function getSpiritualRootDisplayName(type: SpiritualRootType): string {
  const root = SPIRITUAL_ROOTS[type]
  const categoryName = getCategoryDisplayName(root.category)
  return `${categoryName} · ${root.name}`
}

/**
 * 获取分类显示名称
 */
function getCategoryDisplayName(category: SpiritualRootCategory): string {
  const names: Record<SpiritualRootCategory, string> = {
    [SpiritualRootCategory.HEAVENLY]: '天灵根',
    [SpiritualRootCategory.FIVE_ELEMENT]: '五行灵根',
    [SpiritualRootCategory.TRUE]: '真灵根',
    [SpiritualRootCategory.PSEUDO]: '伪灵根',
    [SpiritualRootCategory.HIDDEN]: '隐藏灵根'
  }
  return names[category]
}

/**
 * 获取稀有度描述
 */
export function getRarityDescription(rarity: number): string {
  const descriptions: Record<number, string> = {
    1: '凡品',
    2: '良品',
    3: '上品',
    4: '极品',
    5: '神品'
  }
  return descriptions[rarity] || '未知'
}

/**
 * 获取初始可分配的灵根列表（排除隐藏灵根）
 */
export function getInitialSpiritualRoots(): SpiritualRootType[] {
  return [
    SpiritualRootType.LIGHT,
    SpiritualRootType.DARK,
    SpiritualRootType.METAL,
    SpiritualRootType.WOOD,
    SpiritualRootType.WATER,
    SpiritualRootType.FIRE,
    SpiritualRootType.EARTH,
    SpiritualRootType.QI,
    SpiritualRootType.PSEUDO
    // 不包含 HA（哈根），这是隐藏灵根
  ]
}

/**
 * 获取灵根性格特征描述（用于 AI prompt）
 */
export function getSpiritualRootPersonalityGuide(): string {
  const roots = getInitialSpiritualRoots()
  const guide = roots.map(rootType => {
    const root = SPIRITUAL_ROOTS[rootType]
    return `- ${rootType}（${root.name}）：适合${root.personalityTraits.join('、')}的修士`
  }).join('\n')

  return guide
}
