/**
 * 将内容填入对话框并同步修改变量
 * 用于：新增/编辑角色、规则等操作
 */

import type { RuleData, CharacterData, RegionData } from '../types';

const VAR_OPTION = { type: 'message' as const, message_id: 'latest' as const };

function getCurrentMvuData(): Record<string, any> {
  try {
    const data = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
    return data?.stat_data ? { stat_data: data.stat_data, display_data: data.display_data, delta_data: data.delta_data } : { stat_data: {}, display_data: {}, delta_data: {} };
  } catch {
    return { stat_data: {}, display_data: {}, delta_data: {} };
  }
}

/**
 * 将文本写入前端对话框输入区（不创建新楼层）
 */
export async function sendToDialog(message: string): Promise<void> {
  try {
    window.dispatchEvent(new CustomEvent('th:copy-to-input', { detail: { message } }));
    console.log('✅ [dialogAndVariable] 已写入前端对话框输入区:', message.substring(0, 80) + (message.length > 80 ? '...' : ''));
  } catch (e) {
    console.warn('⚠️ [dialogAndVariable] 写入前端对话框输入区失败:', e);
  }
}

/**
 * 更新最新楼层变量中的 stat_data（合并，不覆盖其他字段）
 */
export function updateStatData(updater: (stat: Record<string, any>) => Record<string, any>): void {
  updateVariablesWith(
    (vars) => {
      const v = vars || {};
      if (!v.stat_data) v.stat_data = {};
      v.stat_data = updater(v.stat_data);
      return v;
    },
    VAR_OPTION,
  );
}

/** 写入「元信息.最近更新时间」，与变量更新规则一致 */
export function bumpMetaInStat(stat: Record<string, any>): void {
  const cur = stat['元信息'];
  const base =
    cur && typeof cur === 'object'
      ? { ...cur }
      : { 玩家名称: '玩家', 玩家设置: {}, 当前阶段: '游戏中', 进度: 1 };
  base['最近更新时间'] = Date.now();
  stat['元信息'] = base;
}

function enRuleStatusToZh(status: string | undefined, prev: string): string {
  if (status === 'active') return '生效中';
  if (status === 'inactive') return '已归档';
  return prev || '生效中';
}

function resolveWorldRuleKey(stat: Record<string, any>, idOrTitle: string): string | null {
  const wr = stat['世界规则'];
  if (!wr || typeof wr !== 'object') return null;
  if (wr[idOrTitle]) return idOrTitle;
  if (idOrTitle.startsWith('world-')) {
    const t = idOrTitle.slice('world-'.length);
    if (wr[t]) return t;
  }
  return null;
}

function resolveRegionKey(stat: Record<string, any>, idOrName: string): string | null {
  const rr = stat['区域规则'];
  if (!rr || typeof rr !== 'object') return null;
  if (rr[idOrName]) return idOrName;
  if (idOrName.startsWith('region-')) {
    const n = idOrName.slice('region-'.length);
    if (rr[n]) return n;
  }
  return null;
}

function resolvePersonalRuleKey(stat: Record<string, any>, idOrTitle: string): string | null {
  const pr = stat['个人规则'];
  if (!pr || typeof pr !== 'object') return null;
  if (pr[idOrTitle]) return idOrTitle;
  if (idOrTitle.startsWith('personal-')) {
    const k = idOrTitle.slice('personal-'.length);
    if (pr[k]) return k;
  }
  return null;
}

function resolveRegionalSubRuleKey(
  细分规则: Record<string, any>,
  regionKey: string,
  ruleIdOrTitle: string,
): string | null {
  if (!细分规则 || typeof 细分规则 !== 'object') return null;
  if (细分规则[ruleIdOrTitle]) return ruleIdOrTitle;
  const prefix = `regional-${regionKey}-`;
  if (ruleIdOrTitle.startsWith(prefix)) {
    const sub = ruleIdOrTitle.slice(prefix.length);
    if (细分规则[sub]) return sub;
  }
  for (const sk of Object.keys(细分规则)) {
    if (`regional-${regionKey}-${sk}` === ruleIdOrTitle) return sk;
  }
  return null;
}

function parseBodyNumber(raw: string | undefined, fallback: number): number {
  if (raw == null || raw === '') return fallback;
  const n = parseInt(String(raw).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

// ---------- 角色 ----------

export function formatAddCharacterMessage(description: string): string {
  return `[新增角色]\n${description.trim()}`;
}

export function addCharacterToVariables(description: string): void {
  const id = `CHR-${Date.now()}`;
  const text = description.trim();
  const firstLine = text.split('\n')[0]?.trim() || '未命名';
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    if (!next['角色档案'] || typeof next['角色档案'] !== 'object') next['角色档案'] = {};
    next['角色档案'] = {
      ...next['角色档案'],
      [id]: {
        姓名: firstLine,
        状态: '出场中',
        描写: text,
        当前内心想法: '',
        性格: [],
        性癖: [],
        敏感部位: [],
        隐藏性癖: '',
        身体信息: { 年龄: 17, 身高: 160, 体重: 48, 三围: '未知', 体质特征: '普通' },
        数值: { 好感度: 0, 发情值: 0, 性癖开发值: 0 },
        当前综合生理描述: '',
      },
    };
    bumpMetaInStat(next);
    return next;
  });
}

export async function submitAddCharacter(description: string): Promise<string> {
  const text = description.trim();
  if (!text) {
    toastr.warning('请输入角色描写');
    return '';
  }
  const message = formatAddCharacterMessage(text);
  addCharacterToVariables(text);
  return message;
}

// ---------- 编辑角色基础信息 ----------

export function formatEditCharacterBasicMessage(payload: {
  characterId: string;
  name?: string;
  age?: string;
  height?: string;
  weight?: string;
  physique?: string;
  affection?: number;
  lust?: number;
  fetish?: number;
  [key: string]: any;
}): string {
  const lines = ['[编辑角色基础信息]', `角色ID：${payload.characterId}`];
  if (payload.name != null) lines.push(`姓名：${payload.name}`);
  if (payload.age != null) lines.push(`年龄：${payload.age}`);
  if (payload.height != null) lines.push(`身高：${payload.height}`);
  if (payload.weight != null) lines.push(`体重：${payload.weight}`);
  if (payload.threeSize != null) lines.push(`三围：${payload.threeSize}`);
  if (payload.physique != null) lines.push(`体质：${payload.physique}`);
  if (payload.affection != null) lines.push(`好感度：${payload.affection}`);
  if (payload.lust != null) lines.push(`发情值：${payload.lust}`);
  if (payload.fetish != null) lines.push(`性癖开发值：${payload.fetish}`);
  return lines.join('\n');
}

export function updateCharacterInVariables(characterId: string, updates: Partial<CharacterData>): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    if (!next['角色档案'] || typeof next['角色档案'] !== 'object') next['角色档案'] = {};
    const profiles = { ...next['角色档案'] };
    const cur = { ...(profiles[characterId] || {}) };
    const 身体 = { ...(cur['身体信息'] && typeof cur['身体信息'] === 'object' ? cur['身体信息'] : {}) };
    const 数值 = { ...(cur['数值'] && typeof cur['数值'] === 'object' ? cur['数值'] : {}) };

    if (updates.name != null) cur['姓名'] = updates.name;
    if (updates.description != null) cur['描写'] = updates.description;

    if (updates.basic) {
      const b = updates.basic;
      if (b.age != null) 身体['年龄'] = parseBodyNumber(b.age, Number(身体['年龄']) || 17);
      if (b.height != null) 身体['身高'] = parseBodyNumber(b.height, Number(身体['身高']) || 160);
      if (b.weight != null) 身体['体重'] = parseBodyNumber(b.weight, Number(身体['体重']) || 48);
      if (b.threeSize != null) 身体['三围'] = String(b.threeSize);
      if (b.physique != null) 身体['体质特征'] = String(b.physique);
    }

    if (updates.stats) {
      if (typeof updates.stats.affection === 'number') 数值['好感度'] = updates.stats.affection;
      if (typeof updates.stats.lust === 'number') 数值['发情值'] = updates.stats.lust;
      if (typeof updates.stats.fetish === 'number') 数值['性癖开发值'] = updates.stats.fetish;
    }

    cur['身体信息'] = 身体;
    cur['数值'] = 数值;
    profiles[characterId] = cur;
    next['角色档案'] = profiles;
    bumpMetaInStat(next);
    return next;
  });
}

export async function submitEditCharacterBasic(
  characterId: string,
  payload: Record<string, string | number | undefined>,
): Promise<string> {
  const message = formatEditCharacterBasicMessage({ characterId, ...payload });

  const stats: Record<string, number> = {};
  if (typeof payload.affection === 'number') stats.affection = payload.affection;
  if (typeof payload.lust === 'number') stats.lust = payload.lust;
  if (typeof payload.fetish === 'number') stats.fetish = payload.fetish;

  const basic: CharacterData['basic'] = {
    age: payload.age as string | undefined,
    height: payload.height as string | undefined,
    weight: payload.weight as string | undefined,
    threeSize: payload.threeSize as string | undefined,
    physique: payload.physique as string | undefined,
  };

  updateCharacterInVariables(
    characterId,
    {
      name: (payload.name as string | undefined) ?? undefined,
      basic,
      stats: Object.keys(stats).length ? (stats as Record<string, number>) : undefined,
    } as Partial<CharacterData>,
  );
  return message;
}

// ---------- 编辑角色心理/性癖/敏感部位 ----------

function parseTagLines(text: string): string[] {
  const raw = String(text ?? '');
  return raw
    .split(/\r?\n|，|,/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function formatEditCharacterPsychMessage(payload: {
  characterId: string;
  当前内心想法?: string;
  性格?: string[];
  性癖?: string[];
  敏感部位?: string[];
  隐藏性癖?: string;
}): string {
  const lines = ['[编辑角色心理与性癖]', `角色ID：${payload.characterId}`];
  if (payload.当前内心想法 != null) lines.push(`当前内心想法：${String(payload.当前内心想法)}`);
  if (payload.性格 != null) lines.push(`性格：${payload.性格.join('、')}`);
  if (payload.性癖 != null) lines.push(`性癖：${payload.性癖.join('、')}`);
  if (payload.敏感部位 != null) lines.push(`敏感部位：${payload.敏感部位.join('、')}`);
  if (payload.隐藏性癖 != null) lines.push(`隐藏性癖：${String(payload.隐藏性癖)}`);
  return lines.join('\n');
}

export function updateCharacterPsychInChineseVariables(
  characterId: string,
  updates: {
    当前内心想法?: string;
    性格?: string[];
    性癖?: string[];
    敏感部位?: string[];
    隐藏性癖?: string;
  },
): void {
  updateStatData((stat) => {
    const next = { ...(stat || {}) } as any;
    if (!next['角色档案'] || typeof next['角色档案'] !== 'object') next['角色档案'] = {};
    const profiles = { ...(next['角色档案'] || {}) };
    const cur = { ...(profiles[characterId] || {}) };
    if (updates.当前内心想法 != null) cur['当前内心想法'] = updates.当前内心想法;
    if (updates.性格 != null) cur['性格'] = updates.性格;
    if (updates.性癖 != null) cur['性癖'] = updates.性癖;
    if (updates.敏感部位 != null) cur['敏感部位'] = updates.敏感部位;
    if (updates.隐藏性癖 != null) cur['隐藏性癖'] = updates.隐藏性癖;
    profiles[characterId] = cur;
    next['角色档案'] = profiles;
    bumpMetaInStat(next);
    return next;
  });
}

export async function submitEditCharacterPsych(
  characterId: string,
  payload: {
    thought?: string;
    traitsText?: string;
    fetishesText?: string;
    sensitivePartsText?: string;
    hiddenFetish?: string;
  },
): Promise<string> {
  const updates: {
    当前内心想法?: string;
    性格?: string[];
    性癖?: string[];
    敏感部位?: string[];
    隐藏性癖?: string;
  } = {};

  if (payload.thought !== undefined) updates.当前内心想法 = String(payload.thought ?? '');
  if (payload.traitsText !== undefined) updates.性格 = parseTagLines(payload.traitsText ?? '');
  if (payload.fetishesText !== undefined) updates.性癖 = parseTagLines(payload.fetishesText ?? '');
  if (payload.sensitivePartsText !== undefined) updates.敏感部位 = parseTagLines(payload.sensitivePartsText ?? '');
  if (payload.hiddenFetish !== undefined) updates.隐藏性癖 = String(payload.hiddenFetish ?? '');

  const message = formatEditCharacterPsychMessage({ characterId, ...updates });
  updateCharacterPsychInChineseVariables(characterId, updates);
  return message;
}

// ---------- 世界规则 ----------

export function formatWorldRuleMessage(type: 'add' | 'edit' | 'archive' | 'restore', name: string, detail?: string): string {
  if (type === 'archive') return `[归档世界规则]\n名称：${name}`;
  if (type === 'restore') return `[复原世界规则]\n名称：${name}`;
  const prefix = type === 'add' ? '[新增世界规则]' : '[编辑世界规则]';
  return `${prefix}\n名称：${name}\n细节：${detail ?? ''}`;
}

export function addWorldRuleToVariables(title: string, desc: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    if (!next['世界规则'] || typeof next['世界规则'] !== 'object') next['世界规则'] = {};
    next['世界规则'] = {
      ...next['世界规则'],
      [title]: { 效果描述: desc, 状态: '生效中', 标记: '世界级' },
    };
    bumpMetaInStat(next);
    return next;
  });
}

export function updateWorldRuleInVariables(idOrTitle: string, updates: Partial<RuleData>): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const key = resolveWorldRuleKey(next, idOrTitle);
    if (!key) return stat;
    if (!next['世界规则'] || typeof next['世界规则'] !== 'object') return stat;
    const wr = { ...next['世界规则'] };
    const cur = { ...(wr[key] || {}) };
    const newTitle = updates.title?.trim();
    const nextKey = newTitle && newTitle.length > 0 && newTitle !== key ? newTitle : key;

    const merged = {
      ...cur,
      效果描述: updates.desc != null ? updates.desc : cur['效果描述'] ?? '',
      状态: enRuleStatusToZh(updates.status, cur['状态'] ?? '生效中'),
      标记: cur['标记'] ?? '世界级',
    };

    if (nextKey !== key) {
      delete wr[key];
    }
    wr[nextKey] = merged;
    next['世界规则'] = wr;
    bumpMetaInStat(next);
    return next;
  });
}

export function archiveWorldRuleInVariables(idOrTitle: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const key = resolveWorldRuleKey(next, idOrTitle);
    if (!key || !next['世界规则']?.[key]) return stat;
    const wr = { ...next['世界规则'] };
    wr[key] = { ...wr[key], 状态: '已归档' };
    next['世界规则'] = wr;
    bumpMetaInStat(next);
    return next;
  });
}

export function restoreWorldRuleInVariables(idOrTitle: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const key = resolveWorldRuleKey(next, idOrTitle);
    if (!key || !next['世界规则']?.[key]) return stat;
    const wr = { ...next['世界规则'] };
    wr[key] = { ...wr[key], 状态: '生效中' };
    next['世界规则'] = wr;
    bumpMetaInStat(next);
    return next;
  });
}

export async function submitAddWorldRule(name: string, detail: string): Promise<string> {
  const n = name.trim();
  if (!n) {
    toastr.warning('请输入规则名称');
    return '';
  }
  const message = formatWorldRuleMessage('add', n, detail.trim());
  addWorldRuleToVariables(n, detail.trim());
  return message;
}

export async function submitEditWorldRule(idOrTitle: string, name: string, detail: string): Promise<string> {
  const n = name.trim();
  if (!n) {
    toastr.warning('请输入规则名称');
    return '';
  }
  const message = formatWorldRuleMessage('edit', n, detail.trim());
  updateWorldRuleInVariables(idOrTitle, { title: n, desc: detail.trim() });
  return message;
}

export async function submitArchiveWorldRule(name: string): Promise<void> {
  const message = formatWorldRuleMessage('archive', name);
  await sendToDialog(message);
  archiveWorldRuleInVariables(name);
  toastr.success(`已归档世界规则「${name}」并写入对话框`);
}

export async function submitRestoreWorldRule(name: string): Promise<void> {
  const message = formatWorldRuleMessage('restore', name);
  await sendToDialog(message);
  restoreWorldRuleInVariables(name);
  toastr.success(`已复原世界规则「${name}」并写入对话框`);
}

// ---------- 区域规则（区域 + 规则） ----------

export function formatRegionRuleMessage(type: 'add' | 'edit' | 'archive' | 'restore', regionName: string, detail?: string): string {
  if (type === 'archive') return `[归档区域规则]\n区域：${regionName}${detail ? `\n规则：${detail}` : ''}`;
  if (type === 'restore') return `[复原区域规则]\n区域：${regionName}${detail ? `\n规则：${detail}` : ''}`;
  const prefix = type === 'add' ? '[新增区域]' : '[编辑区域]';
  return `${prefix}\n区域名称：${regionName}\n规则细节：${detail ?? ''}`;
}

export function addRegionToVariables(name: string, detail: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    if (!next['区域规则'] || typeof next['区域规则'] !== 'object') next['区域规则'] = {};
    next['区域规则'] = {
      ...next['区域规则'],
      [name]: { 效果描述: detail, 状态: '生效中', 细分规则: {} },
    };
    bumpMetaInStat(next);
    return next;
  });
}

export function updateRegionInVariables(idOrName: string, updates: Partial<RegionData>): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, idOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    const cur = { ...(rr[rk] || {}) };
    const newName = updates.name?.trim();
    const nextKey = newName && newName.length > 0 && newName !== rk ? newName : rk;

    const merged = {
      ...cur,
      效果描述: updates.description != null ? updates.description : cur['效果描述'] ?? '',
      状态: enRuleStatusToZh(updates.status, cur['状态'] ?? '生效中'),
      细分规则:
        cur['细分规则'] && typeof cur['细分规则'] === 'object' ? { ...cur['细分规则'] } : {},
    };

    if (nextKey !== rk) {
      delete rr[rk];
    }
    rr[nextKey] = merged;
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

export function archiveRegionInVariables(idOrName: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, idOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    rr[rk] = { ...rr[rk], 状态: '已归档' };
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

export function restoreRegionInVariables(idOrName: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, idOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    rr[rk] = { ...rr[rk], 状态: '生效中' };
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

/** 更新区域内单条规则的状态（归档/复原等） */
export function updateRegionalRuleInVariables(regionIdOrName: string, ruleIdOrTitle: string, updates: Partial<RuleData>): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, regionIdOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    const regionEntry = { ...(rr[rk] || {}) };
    const 细分 = {
      ...(regionEntry['细分规则'] && typeof regionEntry['细分规则'] === 'object' ? regionEntry['细分规则'] : {}),
    };
    const subKey = resolveRegionalSubRuleKey(细分, rk, ruleIdOrTitle);
    if (!subKey || !细分[subKey]) return stat;
    const sub = { ...(细分[subKey] || {}) };
    if (updates.title != null && updates.title !== subKey) {
      delete 细分[subKey];
      细分[updates.title] = {
        ...sub,
        描述: updates.desc != null ? updates.desc : sub['描述'] ?? '',
        状态: enRuleStatusToZh(updates.status, sub['状态'] ?? '生效中'),
      };
    } else {
      细分[subKey] = {
        ...sub,
        ...(updates.desc != null ? { 描述: updates.desc } : {}),
        状态: enRuleStatusToZh(updates.status, sub['状态'] ?? '生效中'),
      };
    }
    regionEntry['细分规则'] = 细分;
    rr[rk] = regionEntry;
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

export function archiveRegionalRuleInVariables(regionIdOrName: string, ruleIdOrTitle: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, regionIdOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    const regionEntry = { ...(rr[rk] || {}) };
    const 细分 = {
      ...(regionEntry['细分规则'] && typeof regionEntry['细分规则'] === 'object' ? regionEntry['细分规则'] : {}),
    };
    const subKey = resolveRegionalSubRuleKey(细分, rk, ruleIdOrTitle);
    if (!subKey || !细分[subKey]) return stat;
    细分[subKey] = { ...细分[subKey], 状态: '已归档' };
    regionEntry['细分规则'] = 细分;
    rr[rk] = regionEntry;
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

export function restoreRegionalRuleInVariables(regionIdOrName: string, ruleIdOrTitle: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, regionIdOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    const regionEntry = { ...(rr[rk] || {}) };
    const 细分 = {
      ...(regionEntry['细分规则'] && typeof regionEntry['细分规则'] === 'object' ? regionEntry['细分规则'] : {}),
    };
    const subKey = resolveRegionalSubRuleKey(细分, rk, ruleIdOrTitle);
    if (!subKey || !细分[subKey]) return stat;
    细分[subKey] = { ...细分[subKey], 状态: '生效中' };
    regionEntry['细分规则'] = 细分;
    rr[rk] = regionEntry;
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

/** 新增区域内单条规则 */
export function addRegionalRuleToVariables(regionIdOrName: string, title: string, desc: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const rk = resolveRegionKey(next, regionIdOrName);
    if (!rk || !next['区域规则']?.[rk]) return stat;
    const rr = { ...next['区域规则'] };
    const regionEntry = { ...(rr[rk] || {}) };
    const 细分 = {
      ...(regionEntry['细分规则'] && typeof regionEntry['细分规则'] === 'object' ? regionEntry['细分规则'] : {}),
    };
    细分[title] = { 描述: desc, 状态: '生效中' };
    regionEntry['细分规则'] = 细分;
    rr[rk] = regionEntry;
    next['区域规则'] = rr;
    bumpMetaInStat(next);
    return next;
  });
}

/** 编辑区域内单条规则 */
export function editRegionalRuleInVariables(
  regionIdOrName: string,
  ruleIdOrTitle: string,
  updates: { title?: string; desc?: string },
): void {
  updateRegionalRuleInVariables(regionIdOrName, ruleIdOrTitle, {
    title: updates.title,
    desc: updates.desc,
  } as Partial<RuleData>);
}

export async function submitAddRegion(name: string, detail: string): Promise<string> {
  const n = name.trim();
  if (!n) {
    toastr.warning('请输入区域名称');
    return '';
  }
  const message = formatRegionRuleMessage('add', n, detail.trim());
  addRegionToVariables(n, detail.trim());
  return message;
}

export async function submitAddRegionalRule(regionIdOrName: string, regionName: string, ruleName: string, ruleDetail: string): Promise<string> {
  const n = ruleName.trim();
  if (!n) {
    toastr.warning('请输入规则名称');
    return '';
  }
  const detail = ruleDetail.trim();
  const message = `[新增区域规则]\n区域：${regionName}\n规则：${n}\n细节：${detail}`;
  addRegionalRuleToVariables(regionIdOrName, n, detail);
  return message;
}

export async function submitEditRegionalRule(
  regionIdOrName: string,
  regionName: string,
  ruleIdOrTitle: string,
  ruleName: string,
  ruleDetail: string,
): Promise<string> {
  const n = ruleName.trim();
  if (!n) {
    toastr.warning('请输入规则名称');
    return '';
  }
  const detail = ruleDetail.trim();
  const message = `[编辑区域规则]\n区域：${regionName}\n规则：${n}\n细节：${detail}`;
  editRegionalRuleInVariables(regionIdOrName, ruleIdOrTitle, { title: n, desc: detail });
  return message;
}

export async function submitEditRegion(idOrName: string, name: string, detail: string): Promise<string> {
  const n = name.trim();
  if (!n) {
    toastr.warning('请输入区域名称');
    return '';
  }
  const message = formatRegionRuleMessage('edit', n, detail.trim());
  updateRegionInVariables(idOrName, { name: n, description: detail.trim() });
  return message;
}

export async function submitArchiveRegion(name: string): Promise<void> {
  const message = formatRegionRuleMessage('archive', name);
  await sendToDialog(message);
  archiveRegionInVariables(name);
  toastr.success(`已归档区域「${name}」并写入对话框`);
}

export async function submitRestoreRegion(name: string): Promise<void> {
  const message = formatRegionRuleMessage('restore', name);
  await sendToDialog(message);
  restoreRegionInVariables(name);
  toastr.success(`已复原区域「${name}」并写入对话框`);
}

/** 归档区域内单条规则（写入对话框 + toast） */
export async function submitArchiveRegionalRule(regionName: string, ruleIdOrTitle: string, ruleSummary?: string): Promise<void> {
  const message = formatRegionRuleMessage('archive', regionName, ruleSummary ?? ruleIdOrTitle);
  await sendToDialog(message);
  archiveRegionalRuleInVariables(regionName, ruleIdOrTitle);
  toastr.success(`已归档「${regionName}」下规则${ruleSummary ? `「${ruleSummary}」` : ''}并写入对话框`);
}

/** 复原区域内单条规则（写入对话框 + toast） */
export async function submitRestoreRegionalRule(regionName: string, ruleIdOrTitle: string, ruleSummary?: string): Promise<void> {
  const message = formatRegionRuleMessage('restore', regionName, ruleSummary ?? ruleIdOrTitle);
  await sendToDialog(message);
  restoreRegionalRuleInVariables(regionName, ruleIdOrTitle);
  toastr.success(`已复原「${regionName}」下规则${ruleSummary ? `「${ruleSummary}」` : ''}并写入对话框`);
}

// ---------- 个人规则 ----------

export function formatPersonalRuleMessage(type: 'add' | 'edit' | 'archive' | 'restore', characterName: string, detail?: string): string {
  if (type === 'archive') return `[归档个人规则]\n对象：${characterName}${detail ? `\n规则：${detail}` : ''}`;
  if (type === 'restore') return `[复原个人规则]\n对象：${characterName}${detail ? `\n规则：${detail}` : ''}`;
  const prefix = type === 'add' ? '[新增个人规则]' : '[编辑个人规则]';
  return `${prefix}\n对象：${characterName}\n规则细节：${detail ?? ''}`;
}

export function addPersonalRuleToVariables(characterName: string, detail: string): void {
  const key = `PR-${Date.now()}`;
  const c = characterName.trim();
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    if (!next['个人规则'] || typeof next['个人规则'] !== 'object') next['个人规则'] = {};
    next['个人规则'] = {
      ...next['个人规则'],
      [key]: {
        名称: c,
        适用对象: c,
        效果描述: detail.trim(),
        状态: '生效中',
        标记: '个人级',
      },
    };
    bumpMetaInStat(next);
    return next;
  });
}

export function updatePersonalRuleInVariables(idOrTitle: string, updates: Partial<RuleData>): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const pk = resolvePersonalRuleKey(next, idOrTitle);
    if (!pk || !next['个人规则']?.[pk]) return stat;
    const pr = { ...next['个人规则'] };
    const cur = { ...(pr[pk] || {}) };
    const merged: Record<string, any> = {
      ...cur,
      效果描述: updates.desc != null ? updates.desc : cur['效果描述'] ?? '',
      状态: enRuleStatusToZh(updates.status, cur['状态'] ?? '生效中'),
      标记: cur['标记'] ?? '个人级',
    };
    if (updates.title != null) {
      merged['名称'] = updates.title;
      merged['适用对象'] = updates.title;
    } else if (merged['名称'] == null && merged['适用对象'] != null) {
      merged['名称'] = merged['适用对象'];
    }
    pr[pk] = merged;
    next['个人规则'] = pr;
    bumpMetaInStat(next);
    return next;
  });
}

export function archivePersonalRuleInVariables(idOrTitle: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const pk = resolvePersonalRuleKey(next, idOrTitle);
    if (!pk || !next['个人规则']?.[pk]) return stat;
    const pr = { ...next['个人规则'] };
    pr[pk] = { ...pr[pk], 状态: '已归档' };
    next['个人规则'] = pr;
    bumpMetaInStat(next);
    return next;
  });
}

export function restorePersonalRuleInVariables(idOrTitle: string): void {
  updateStatData((stat) => {
    const next = { ...stat } as Record<string, any>;
    const pk = resolvePersonalRuleKey(next, idOrTitle);
    if (!pk || !next['个人规则']?.[pk]) return stat;
    const pr = { ...next['个人规则'] };
    pr[pk] = { ...pr[pk], 状态: '生效中' };
    next['个人规则'] = pr;
    bumpMetaInStat(next);
    return next;
  });
}

export async function submitAddPersonalRule(characterName: string, detail: string): Promise<string> {
  const c = characterName.trim();
  if (!c) {
    toastr.warning('请输入角色/对象名称');
    return '';
  }
  const message = formatPersonalRuleMessage('add', c, detail.trim());
  addPersonalRuleToVariables(c, detail.trim());
  return message;
}

export async function submitEditPersonalRule(idOrTitle: string, characterName: string, detail: string): Promise<string> {
  const c = characterName.trim();
  if (!c) {
    toastr.warning('请输入角色/对象名称');
    return '';
  }
  const message = formatPersonalRuleMessage('edit', c, detail.trim());
  updatePersonalRuleInVariables(idOrTitle, { title: c, desc: detail.trim() });
  return message;
}

export async function submitArchivePersonalRule(idOrTitle: string, characterName?: string, ruleSummary?: string): Promise<void> {
  const label = characterName ?? idOrTitle;
  const message = formatPersonalRuleMessage('archive', label, ruleSummary);
  await sendToDialog(message);
  archivePersonalRuleInVariables(idOrTitle);
  toastr.success(`已归档「${label}」${ruleSummary ? `（${ruleSummary}）` : ''}并写入对话框`);
}

export async function submitRestorePersonalRule(idOrTitle: string, characterName?: string, ruleSummary?: string): Promise<void> {
  const label = characterName ?? idOrTitle;
  const message = formatPersonalRuleMessage('restore', label, ruleSummary);
  await sendToDialog(message);
  restorePersonalRuleInVariables(idOrTitle);
  toastr.success(`已复原「${label}」${ruleSummary ? `（${ruleSummary}）` : ''}并写入对话框`);
}
