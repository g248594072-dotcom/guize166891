/**
 * MVU ZOD Store
 * 提供响应式的变量访问和修改
 */

import { defineMvuDataStore } from '@util/mvu';
import { Schema } from './schema';
import type { CharacterData, RuleData, RegionData } from './types';

/**
 * 主数据存储
 * 使用 defineMvuDataStore 自动与酒馆变量同步
 */
export const useDataStore = defineMvuDataStore(
  Schema,
  { type: 'message', message_id: getCurrentMessageId() }
);

/**
 * 获取角色列表（响应式）
 */
export function useCharacters() {
  const store = useDataStore();
  return computed((): CharacterData[] => {
    const chars = store.data.角色档案 || {};
    return Object.entries(chars).map(([id, char]) => {
      // 支持中文字段和英文字段回退
      // 如果姓名为空或"未知"，回退到英文字段 name 或 ID
      console.log('[useCharacters] 处理角色:', id, { 姓名: char.姓名, name: char.name });
      const name = (char.姓名 && char.姓名 !== '未知' && char.姓名.trim() !== '')
        ? char.姓名
        : (char.name || id);
      console.log('[useCharacters] 计算后的名字:', name);
      const description = char.描写 || char.description || char.desc || '';
      const status = char.状态 === '出场中' ? 'active' : 'inactive';

      const currentThought = char.当前内心想法 || char.currentThought || '';
      const traits = char.性格 || char.traits || [];
      const fetishes = char.性癖 || char.fetishes || [];
      const sensitiveParts = char.敏感部位 || char.sensitiveParts || [];
      const hiddenFetish = char.隐藏性癖 || char.hiddenFetish || '';

      const body = char.身体信息 || {};
      const stats = char.数值 || {};

      return {
        id,
        name,
        description,
        status,
        basic: {
          age: String(body.年龄 || body.age || ''),
          height: String(body.身高 || body.height || ''),
          weight: String(body.体重 || body.weight || ''),
          threeSize: body.三围 || body.threeSize || '',
          physique: body.体质特征 || body.physique || '',
        },
        stats: {
          affection: stats.好感度 || stats.affection || char.affection || 0,
          fetish: stats.性癖开发值 || stats.fetish || char.fetish_dev || char.fetish || 0,
          lust: stats.发情值 || stats.lust || char.estrus || char.lust || 0,
        },
        currentThought,
        traits,
        fetishes,
        sensitiveParts,
        hiddenFetish,
        currentPhysiologicalDesc: char.当前综合生理描述 || char.currentPhysiologicalDesc || '',
      };
    });
  });
}

/**
 * 获取世界规则列表（响应式）
 */
export function useWorldRules() {
  const store = useDataStore();
  return computed((): RuleData[] => {
    const rules = store.data.世界规则 || {};
    const ruleEntries = Object.entries(rules);

    // 如果有世界规则数据，解析并返回
    if (ruleEntries.length > 0) {
      return ruleEntries.map(([title, rule]) => {
        // 支持中文字段和英文字段回退
        const displayTitle = rule.名称 || rule.name || title;
        const desc = rule.效果描述 || rule.desc || rule.description || '';
        const status = rule.状态 === '生效中' || rule.active === true ? 'active' : 'inactive';
        const tag = rule.标记 || rule.tag;

        return {
          id: `world-${title}`,
          title: displayTitle,
          desc,
          status,
          category: 'world' as const,
          tag,
        };
      });
    }

    // 如果世界规则为空，从 openingConfig.selectedRules 构建
    const selectedRules = store.data.openingConfig?.selectedRules;
    if (selectedRules && Array.isArray(selectedRules) && selectedRules.length > 0) {
      return selectedRules.map((r: any) => ({
        id: `world-${r.name}`,
        title: r.name,
        desc: r.desc || '',
        status: 'active' as const,
        category: 'world' as const,
      }));
    }

    return [];
  });
}

/**
 * 获取区域规则（响应式）
 */
export function useRegionalRules() {
  const store = useDataStore();
  return computed((): RegionData[] => {
    const regions = store.data.区域规则 || {};
    return Object.entries(regions).map(([name, region]) => ({
      id: `region-${name}`,
      name: region.名称 || name,
      description: region.效果描述,
      status: region.状态 === '生效中' ? 'active' : 'inactive',
      rules: Object.entries(region.细分规则 || {}).map(([subName, sub]) => ({
        id: `regional-${name}-${subName}`,
        title: subName,
        desc: sub.描述,
        status: sub.状态 === '生效中' ? 'active' : 'inactive',
        category: 'regional',
      })),
    }));
  });
}

/**
 * 获取个人规则（响应式）
 */
export function usePersonalRules() {
  const store = useDataStore();
  return computed((): RuleData[] => {
    const rules = store.data.个人规则 || {};
    return Object.entries(rules).map(([id, rule]) => ({
      id: `personal-${id}`,
      title: rule.名称 || rule.适用对象 || id,
      desc: rule.效果描述,
      status: rule.状态 === '生效中' ? 'active' : 'inactive',
      category: 'personal',
      target: rule.适用对象,
      tag: rule.标记,
    }));
  });
}

/**
 * 按角色分组的个人规则
 */
export function usePersonalRulesByCharacter() {
  const rules = usePersonalRules();
  return computed(() => {
    const map = new Map<string, { active: RuleData[]; archived: RuleData[] }>();
    for (const r of rules.value) {
      const key = r.target || r.title || '未命名';
      if (!map.has(key)) map.set(key, { active: [], archived: [] });
      const bucket = map.get(key)!;
      if (r.status === 'active') bucket.active.push(r);
      else bucket.archived.push(r);
    }
    return Array.from(map.entries()).map(([groupName, { active, archived }]) => ({
      groupName,
      active,
      archived,
    }));
  });
}

/**
 * 区域规则中按区域汇总归档规则，用于顶部归档区
 */
export function useRegionalArchivedGrouped() {
  const regions = useRegionalRules();
  return computed(() => {
    return regions.value
      .map((r) => ({
        regionName: r.name,
        archived: (r.rules || []).filter((rule) => rule.status !== 'active'),
      }))
      .filter((x) => x.archived.length > 0);
  });
}

/**
 * 获取元信息
 */
export function useMetaInfo() {
  const store = useDataStore();
  return computed(() => store.data.元信息);
}

/**
 * 更新元信息中的最近更新时间
 */
export function bumpUpdateTime() {
  const store = useDataStore();
  store.data.元信息.最近更新时间 = Date.now();
}
