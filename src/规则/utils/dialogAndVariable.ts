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

// ---------- 角色 ----------

export function formatAddCharacterMessage(description: string): string {
  return `[新增角色]\n${description.trim()}`;
}

export function addCharacterToVariables(description: string): void {
  const id = `CHR-${Date.now()}`;
  const newChar: CharacterData = {
    id,
    name: description.split('\n')[0]?.trim() || '未命名',
    stats: {},
    status: 'active',
    description: description.trim(),
  };
  updateStatData((stat) => {
    const list = Array.isArray(stat.characters) ? [...stat.characters] : [];
    list.push(newChar);
    return { ...stat, characters: list };
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
  if (payload.physique != null) lines.push(`体质：${payload.physique}`);
  if (payload.affection != null) lines.push(`好感度：${payload.affection}`);
  if (payload.lust != null) lines.push(`发情值：${payload.lust}`);
  if (payload.fetish != null) lines.push(`性癖开发值：${payload.fetish}`);
  return lines.join('\n');
}

export function updateCharacterInVariables(characterId: string, updates: Partial<CharacterData>): void {
  updateStatData((stat) => {
    const list = Array.isArray(stat.characters) ? [...stat.characters] : [];
    const idx = list.findIndex((c: any) => c?.id === characterId);
    if (idx >= 0) {
      const current = list[idx] || {};
      const next: any = { ...current, ...updates };
      if (updates.stats) {
        next.stats = { ...(current.stats || {}), ...updates.stats };
      }
      if (updates.basic) {
        next.basic = { ...(current.basic || {}), ...updates.basic };
      }
      list[idx] = next;
    }
    return { ...stat, characters: list };
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

  const basic = {
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
      stats: Object.keys(stats).length ? (stats as any) : undefined,
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
    // 尽量同步元信息更新时间
    if (next['元信息'] && typeof next['元信息'] === 'object') {
      next['元信息'] = { ...next['元信息'], 最近更新时间: Date.now() };
    }
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
  const newRule: RuleData = {
    id: `wr-${Date.now()}`,
    title,
    desc,
    status: 'active',
    category: 'world',
  };
  updateStatData((stat) => {
    const list = Array.isArray(stat.worldRules) ? [...stat.worldRules] : [];
    list.push(newRule);
    return { ...stat, worldRules: list };
  });
}

export function updateWorldRuleInVariables(idOrTitle: string, updates: Partial<RuleData>): void {
  updateStatData((stat) => {
    const list = Array.isArray(stat.worldRules) ? [...stat.worldRules] : [];
    const idx = list.findIndex((r: any) => r?.id === idOrTitle || r?.title === idOrTitle);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
    }
    return { ...stat, worldRules: list };
  });
}

export function archiveWorldRuleInVariables(idOrTitle: string): void {
  updateWorldRuleInVariables(idOrTitle, { status: 'inactive' });
}

export function restoreWorldRuleInVariables(idOrTitle: string): void {
  updateWorldRuleInVariables(idOrTitle, { status: 'active' });
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
  const newRegion: RegionData = {
    id: `reg-${Date.now()}`,
    name,
    description: detail,
    rules: [],
    status: 'active',
  };
  updateStatData((stat) => {
    const list = Array.isArray(stat.regionalRules) ? [...stat.regionalRules] : [];
    list.push(newRegion);
    return { ...stat, regionalRules: list };
  });
}

export function updateRegionInVariables(idOrName: string, updates: Partial<RegionData>): void {
  updateStatData((stat) => {
    const list = Array.isArray(stat.regionalRules) ? [...stat.regionalRules] : [];
    const idx = list.findIndex((r: any) => r?.id === idOrName || r?.name === idOrName);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
    }
    return { ...stat, regionalRules: list };
  });
}

export function archiveRegionInVariables(idOrName: string): void {
  updateRegionInVariables(idOrName, { status: 'inactive' });
}

export function restoreRegionInVariables(idOrName: string): void {
  updateRegionInVariables(idOrName, { status: 'active' });
}

/** 更新区域内单条规则的状态（归档/复原等） */
export function updateRegionalRuleInVariables(regionIdOrName: string, ruleIdOrTitle: string, updates: Partial<RuleData>): void {
  updateStatData((stat) => {
    const list = Array.isArray(stat.regionalRules) ? [...stat.regionalRules] : [];
    const rIdx = list.findIndex((r: any) => r?.id === regionIdOrName || r?.name === regionIdOrName);
    if (rIdx < 0) return stat;
    const region = list[rIdx];
    const rules = Array.isArray(region.rules) ? [...region.rules] : [];
    const ruleIdx = rules.findIndex((r: any) => r?.id === ruleIdOrTitle || r?.title === ruleIdOrTitle);
    if (ruleIdx < 0) return stat;
    rules[ruleIdx] = { ...rules[ruleIdx], ...updates };
    list[rIdx] = { ...region, rules };
    return { ...stat, regionalRules: list };
  });
}

export function archiveRegionalRuleInVariables(regionIdOrName: string, ruleIdOrTitle: string): void {
  updateRegionalRuleInVariables(regionIdOrName, ruleIdOrTitle, { status: 'inactive' });
}

export function restoreRegionalRuleInVariables(regionIdOrName: string, ruleIdOrTitle: string): void {
  updateRegionalRuleInVariables(regionIdOrName, ruleIdOrTitle, { status: 'active' });
}

/** 新增区域内单条规则 */
export function addRegionalRuleToVariables(regionIdOrName: string, title: string, desc: string): void {
  updateStatData((stat) => {
    const list = Array.isArray(stat.regionalRules) ? [...stat.regionalRules] : [];
    const rIdx = list.findIndex((r: any) => r?.id === regionIdOrName || r?.name === regionIdOrName);
    if (rIdx < 0) return stat;
    const region = list[rIdx];
    const rules = Array.isArray(region.rules) ? [...region.rules] : [];
    rules.push({
      id: `rr-${Date.now()}`,
      title,
      desc,
      status: 'active',
      category: 'regional',
    } as RuleData);
    list[rIdx] = { ...region, rules };
    return { ...stat, regionalRules: list };
  });
}

/** 编辑区域内单条规则 */
export function editRegionalRuleInVariables(
  regionIdOrName: string,
  ruleIdOrTitle: string,
  updates: { title?: string; desc?: string },
): void {
  updateRegionalRuleInVariables(regionIdOrName, ruleIdOrTitle, updates as Partial<RuleData>);
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
  const newRule: RuleData = {
    id: `pr-${Date.now()}`,
    title: characterName,
    desc: detail,
    status: 'active',
    category: 'personal',
  };
  updateStatData((stat) => {
    const list = Array.isArray(stat.personalRules) ? [...stat.personalRules] : [];
    list.push(newRule);
    return { ...stat, personalRules: list };
  });
}

export function updatePersonalRuleInVariables(idOrTitle: string, updates: Partial<RuleData>): void {
  updateStatData((stat) => {
    const list = Array.isArray(stat.personalRules) ? [...stat.personalRules] : [];
    const idx = list.findIndex((r: any) => r?.id === idOrTitle || r?.title === idOrTitle);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updates };
    }
    return { ...stat, personalRules: list };
  });
}

export function archivePersonalRuleInVariables(idOrTitle: string): void {
  updatePersonalRuleInVariables(idOrTitle, { status: 'inactive' });
}

export function restorePersonalRuleInVariables(idOrTitle: string): void {
  updatePersonalRuleInVariables(idOrTitle, { status: 'active' });
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
