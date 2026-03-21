/**
 * 编年史更新工具
 * 自动从消息中提取 <sum> 标签内容并更新世界书中的编年史条目
 * 支持回档检测：当玩家回档到较早时期并重roll时，自动替换对应编号的 sum 并清空更高层
 */

import type { ChronicleEntry, WorldbookEntry } from '../types';
import { extractLastSumContent } from './messageParser';

// 编年史条目标题和关键字（用于查找条目）
const CHRONICLE_ENTRY_TITLE = '编年史';
const CHRONICLE_ENTRY_KEY = 'chronicle';

/**
 * 获取当前角色卡绑定的主要世界书名称
 * 优先使用主要世界书，如果没有则使用第一个附加世界书
 */
function getCurrentCharWorldbookName(): string | null {
  try {
    const charWorldbooks = getCharWorldbookNames('current');
    // 优先使用主要世界书，如果没有则使用第一个附加世界书
    return charWorldbooks.primary || charWorldbooks.additional[0] || null;
  } catch (err) {
    console.error('❌ [chronicleUpdater] 获取角色卡世界书失败:', err);
    return null;
  }
}

/**
 * 从最新消息中提取 <sum> 标签内容
 */
function extractSumFromMessage(messageContent: string): string | null {
  if (!messageContent) return null;

  const sumText = extractLastSumContent(messageContent);
  return sumText || null;
}

/**
 * 格式化时间戳
 */
function formatTimestamp(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 计算回合编号
 * 规则：回合编号 = Math.floor(messageId / 2)
 * 因为每个回合包含 user 和 assistant 两条消息
 */
function calculateTurnNumber(messageId: number): number {
  return Math.floor(messageId / 2);
}

/**
 * 解析现有的编年史内容
 * 格式："# 回合 5 · 楼层 10/11 · 2024-01-01 12:00\n摘要内容\n\n"
 */
function parseChronicleContent(content: string): ChronicleEntry[] {
  const entries: ChronicleEntry[] = [];

  if (!content) return entries;

  const lines = content.split('\n');
  let currentEntry: Partial<ChronicleEntry> = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配标题行：# 回合 {turnNumber} · 楼层 {messageId}/{messageId+1} · {timestamp}
    const headerMatch = line.match(/^#\s*回合\s*(\d+)\s*·\s*楼层\s*(\d+)\/[\d]+\s*·\s*(.+)$/);
    if (headerMatch) {
      // 保存之前的条目
      if (currentEntry.turnNumber !== undefined && currentEntry.sum) {
        entries.push(currentEntry as ChronicleEntry);
      }

      currentEntry = {
        turnNumber: parseInt(headerMatch[1], 10),
        messageId: parseInt(headerMatch[2], 10),
        timestamp: headerMatch[3],
        sum: '',
      };
    } else if (currentEntry.turnNumber !== undefined && line && !line.startsWith('#')) {
      // 累加摘要内容
      if (currentEntry.sum) {
        currentEntry.sum += '\n' + line;
      } else {
        currentEntry.sum = line;
      }
    }
  }

  // 保存最后一个条目
  if (currentEntry.turnNumber !== undefined && currentEntry.sum) {
    entries.push(currentEntry as ChronicleEntry);
  }

  return entries;
}

/**
 * 格式化编年史条目为世界书内容
 * 按回合编号降序排列（编号大的在前）
 */
function formatChronicleContent(entries: ChronicleEntry[]): string {
  if (entries.length === 0) return '';

  // 按回合编号排序（降序，最新的回合在前面）
  const sorted = [...entries].sort((a, b) => b.turnNumber - a.turnNumber);

  return sorted
    .map(entry => `# 回合 ${entry.turnNumber} · 楼层 ${entry.messageId}/${entry.messageId + 1} · ${entry.timestamp}\n${entry.sum}`)
    .join('\n\n');
}

/**
 * 检查并更新编年史
 * 核心逻辑：
 * 1. 计算回合编号 = Math.floor(messageId / 2)
 * 2. 检查该编号是否已存在
 * 3. 如果存在且有更高编号 → 回档重roll：替换当前编号 + 清空所有更高编号
 * 4. 如果不存在 → 正常游玩：添加新条目，保持倒序排列
 */
export async function checkAndUpdateChronicle(): Promise<boolean> {
  try {
    // 获取最新的 assistant 消息
    const assistantMessages = getChatMessages(-1, { role: 'assistant' });
    if (!assistantMessages || assistantMessages.length === 0) {
      console.log('⚠️ [chronicleUpdater] 没有 assistant 消息可处理');
      return false;
    }

    const latestAssistantMessage = assistantMessages[assistantMessages.length - 1];
    const messageContent = latestAssistantMessage.message || '';
    const messageId = latestAssistantMessage.message_id;

    // 提取 <sum> 标签内容
    const sumContent = extractSumFromMessage(messageContent);
    if (!sumContent) {
      console.log('⚠️ [chronicleUpdater] 最新消息中没有 <sum> 标签');
      return false;
    }

    // 计算回合编号
    const turnNumber = calculateTurnNumber(messageId);

    console.log(`✅ [chronicleUpdater] 从楼层 ${messageId} 提取到 sum，回合编号: ${turnNumber}`);

    // 获取当前角色卡绑定的世界书
    const worldbookName = getCurrentCharWorldbookName();
    if (!worldbookName) {
      console.error('❌ [chronicleUpdater] 当前角色卡没有绑定世界书');
      return false;
    }

    console.log(`📚 [chronicleUpdater] 使用世界书: "${worldbookName}"`);

    // 获取世界书条目
    let worldbookEntries: WorldbookEntry[] = [];
    try {
      worldbookEntries = await getWorldbook(worldbookName);
    } catch (err) {
      console.warn(`⚠️ [chronicleUpdater] 世界书 "${worldbookName}" 不存在，将创建`, err);
      // 创建新的世界书
      await createWorldbook(worldbookName, []);
      worldbookEntries = [];
    }

    // 查找编年史条目（使用 name 字段，这是酒馆世界书的真实字段名）
    let chronicleEntry = worldbookEntries.find(
      entry => entry.name === CHRONICLE_ENTRY_TITLE || entry.key?.includes(CHRONICLE_ENTRY_KEY)
    );

    // 解析现有的编年史条目
    let entries: ChronicleEntry[] = [];
    if (chronicleEntry && chronicleEntry.content) {
      entries = parseChronicleContent(chronicleEntry.content);
    }

    // 检查该回合编号是否已存在
    const existingIndex = entries.findIndex(e => e.turnNumber === turnNumber);
    // 检查是否有更高回合编号
    const hasHigherTurnNumber = entries.some(e => e.turnNumber > turnNumber);

    if (existingIndex >= 0 && hasHigherTurnNumber) {
      // ========== 回档重roll情况 ==========
      // 1. 替换当前回合编号的 sum
      entries[existingIndex].sum = sumContent;
      entries[existingIndex].messageId = messageId;
      entries[existingIndex].timestamp = formatTimestamp();

      // 2. 清空所有更高回合编号的条目（时间线被重置）
      const removedCount = entries.filter(e => e.turnNumber > turnNumber).length;
      entries = entries.filter(e => e.turnNumber <= turnNumber);

      console.log(`🔄 [chronicleUpdater] 检测到回档！回合 ${turnNumber} 被重roll，清空了 ${removedCount} 个更高回合的条目`);
    } else if (existingIndex >= 0) {
      // ========== 同一回合更新（非回档）==========
      // 只是同一个回合的 assistant 消息被更新了（比如编辑消息）
      entries[existingIndex].sum = sumContent;
      entries[existingIndex].timestamp = formatTimestamp();
      console.log(`📝 [chronicleUpdater] 更新回合 ${turnNumber} 的 sum 内容`);
    } else {
      // ========== 正常新回合 ==========
      // 添加新条目
      const newEntry: ChronicleEntry = {
        turnNumber,
        messageId,
        sum: sumContent,
        timestamp: formatTimestamp(),
      };
      entries.push(newEntry);
      console.log(`✨ [chronicleUpdater] 新增回合 ${turnNumber} 的编年史条目`);
    }

    // 限制条目数量（保留最近100回合）
    if (entries.length > 100) {
      // 按回合编号排序后保留最新的100个
      entries = entries
        .sort((a, b) => b.turnNumber - a.turnNumber)
        .slice(0, 100);
    }

    // 格式化新的编年史内容
    const newContent = formatChronicleContent(entries);

    // 创建或更新编年史条目
    if (!chronicleEntry) {
      // 创建新条目（使用酒馆世界书的真实字段名）
      chronicleEntry = {
        uid: Date.now(),
        name: CHRONICLE_ENTRY_TITLE,  // 使用 name 而不是 title
        content: newContent,
        comment: '自动生成的游戏编年史，记录每个回合的摘要。支持回档检测：当玩家回档到较早时期并重roll时，会自动替换对应编号的 sum 并清空更高层。',
        enabled: true,  // 使用 enabled 而不是 enable
        order: 0,
        position: 'after_char',
        depth: 4,
        selective: false,
        selectiveLogic: 'and',
        constant: false,
        key: [CHRONICLE_ENTRY_KEY, '编年史', '历史', '存档'],
        keysecondary: [],
      };
      worldbookEntries.push(chronicleEntry);
    } else {
      // 更新现有条目
      chronicleEntry.content = newContent;
      chronicleEntry.comment = chronicleEntry.comment || '自动生成的游戏编年史';
    }

    // 保存世界书
    await replaceWorldbook(worldbookName, worldbookEntries, { render: 'debounced' });

    console.log('✅ [chronicleUpdater] 编年史更新成功');
    return true;
  } catch (error) {
    console.error('❌ [chronicleUpdater] 更新编年史失败:', error);
    return false;
  }
}

/**
 * 获取完整的编年史内容
 * 按回合编号倒序返回（最新的回合在前）
 */
export async function getChronicle(): Promise<ChronicleEntry[]> {
  try {
    const worldbookName = getCurrentCharWorldbookName();
    if (!worldbookName) {
      console.error('❌ [chronicleUpdater] 当前角色卡没有绑定世界书');
      return [];
    }

    const worldbookEntries = await getWorldbook(worldbookName);
    const chronicleEntry = worldbookEntries.find(
      entry => entry.name === CHRONICLE_ENTRY_TITLE || entry.key?.includes(CHRONICLE_ENTRY_KEY)
    );

    if (!chronicleEntry || !chronicleEntry.content) {
      return [];
    }

    const entries = parseChronicleContent(chronicleEntry.content);
    // 按回合编号降序排序
    return entries.sort((a, b) => b.turnNumber - a.turnNumber);
  } catch (error) {
    console.error('❌ [chronicleUpdater] 获取编年史失败:', error);
    return [];
  }
}

/**
 * 清空编年史
 */
export async function clearChronicle(): Promise<boolean> {
  try {
    const worldbookName = getCurrentCharWorldbookName();
    if (!worldbookName) {
      console.error('❌ [chronicleUpdater] 当前角色卡没有绑定世界书');
      return false;
    }

    const worldbookEntries = await getWorldbook(worldbookName);
    const chronicleEntryIndex = worldbookEntries.findIndex(
      entry => entry.name === CHRONICLE_ENTRY_TITLE || entry.key?.includes(CHRONICLE_ENTRY_KEY)
    );

    if (chronicleEntryIndex >= 0) {
      worldbookEntries[chronicleEntryIndex].content = '';
      await replaceWorldbook(worldbookName, worldbookEntries, { render: 'debounced' });
      console.log('✅ [chronicleUpdater] 编年史已清空');
    }

    return true;
  } catch (error) {
    console.error('❌ [chronicleUpdater] 清空编年史失败:', error);
    return false;
  }
}

/**
 * 获取指定回合编号的编年史条目
 */
export async function getChronicleByTurnNumber(turnNumber: number): Promise<ChronicleEntry | null> {
  const entries = await getChronicle();
  return entries.find(e => e.turnNumber === turnNumber) || null;
}

/**
 * 删除指定回合编号及之后的所有条目（用于手动回档）
 */
export async function deleteFromTurnNumber(turnNumber: number): Promise<boolean> {
  try {
    const worldbookName = getCurrentCharWorldbookName();
    if (!worldbookName) {
      console.error('❌ [chronicleUpdater] 当前角色卡没有绑定世界书');
      return false;
    }

    const worldbookEntries = await getWorldbook(worldbookName);
    const chronicleEntry = worldbookEntries.find(
      entry => entry.name === CHRONICLE_ENTRY_TITLE || entry.key?.includes(CHRONICLE_ENTRY_KEY)
    );

    if (!chronicleEntry || !chronicleEntry.content) {
      return false;
    }

    let entries = parseChronicleContent(chronicleEntry.content);
    // 保留回合编号小于指定编号的条目
    entries = entries.filter(e => e.turnNumber < turnNumber);

    chronicleEntry.content = formatChronicleContent(entries);
    await replaceWorldbook(worldbookName, worldbookEntries, { render: 'debounced' });

    console.log(`✅ [chronicleUpdater] 已删除回合 ${turnNumber} 及之后的所有条目`);
    return true;
  } catch (error) {
    console.error('❌ [chronicleUpdater] 删除编年史条目失败:', error);
    return false;
  }
}
