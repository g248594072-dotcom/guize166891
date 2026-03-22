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
    return Object.entries(chars).map(([id, char]) => ({
      id,
      name: char.姓名,
      description: char.描写,
      status: char.状态 === '出场中' ? 'active' : 'inactive',
      basic: {
        age: String(char.身体信息.年龄),
        height: String(char.身体信息.身高),
        weight: String(char.身体信息.体重),
        threeSize: char.身体信息.三围,
        physique: char.身体信息.体质特征,
      },
      stats: {
        affection: char.数值.好感度,
        fetish: char.数值.性癖开发值,
        lust: char.数值.发情值,
      },
      currentThought: char.当前内心想法,
      traits: char.性格,
      fetishes: char.性癖,
      sensitiveParts: char.敏感部位,
      hiddenFetish: char.隐藏性癖,
      currentPhysiologicalDesc: char.当前综合生理描述,
    }));
  });
}

/**
 * 获取世界规则列表（响应式）
 */
export function useWorldRules() {
  const store = useDataStore();
  return computed((): RuleData[] => {
    const rules = store.data.世界规则 || {};
    return Object.entries(rules).map(([title, rule]) => ({
      id: `world-${title}`,
      title: rule.名称 || title,
      desc: rule.效果描述,
      status: rule.状态 === '生效中' ? 'active' : 'inactive',
      category: 'world',
      tag: rule.标记,
    }));
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
