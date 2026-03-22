/**
 * 消息解析工具
 * 从最新楼层消息中解析 maintext 和 option 标签
 */

/** ok：计数完全一致；warning：多一个开标签但存在可解析的最后一对；error：严重不匹配 */
export type TagCheckSeverity = 'ok' | 'warning' | 'error';

/**
 * 标签验证结果
 */
export interface TagCheckResult {
  tag: string;
  /** 是否可按最后一对标签正常解析（ok / warning 为 true，error 为 false） */
  isValid: boolean;
  severity: TagCheckSeverity;
  isOpen: boolean;
  isClosed: boolean;
  message: string;
}

/** 多一个开标签、少一个闭标签：常见于正文前重复书写了格式示例（与预设/提示词有关） */
export function isSuspiciousDuplicateOpenMismatch(open: number, close: number): boolean {
  return open === close + 1 && close >= 1;
}

const emptyTagResult = (tag: string): TagCheckResult => ({
  tag,
  isValid: false,
  severity: 'error',
  isOpen: false,
  isClosed: false,
  message: '消息内容为空',
});

/**
 * 验证消息中的标签闭合情况
 * 顺序：thinking → maintext → option → sum → UpdateVariable
 */
export function validateTags(messageContent: string): TagCheckResult[] {
  if (!messageContent) {
    return [
      emptyTagResult('thinking'),
      emptyTagResult('maintext'),
      emptyTagResult('option'),
      emptyTagResult('sum'),
      emptyTagResult('UpdateVariable'),
    ];
  }

  const dupHint =
    '多出一个开标签（常与预设或前文格式说明有关）；已按最后一对标签解析，一般不影响使用。';

  // 检查 <thinking>
  const thinkingOpen = (messageContent.match(/<thinking>/gi) || []).length;
  const thinkingClose = (messageContent.match(/<\/thinking>/gi) || []).length;
  let thinking: TagCheckResult;
  if (thinkingOpen === 0 && thinkingClose === 0) {
    thinking = {
      tag: 'thinking',
      isValid: true,
      severity: 'ok',
      isOpen: false,
      isClosed: false,
      message: '无 <thinking> 标签',
    };
  } else if (thinkingOpen === thinkingClose) {
    thinking = {
      tag: 'thinking',
      isValid: true,
      severity: 'ok',
      isOpen: true,
      isClosed: true,
      message: `<thinking> 标签完整 (${thinkingOpen} 对)`,
    };
  } else if (isSuspiciousDuplicateOpenMismatch(thinkingOpen, thinkingClose)) {
    thinking = {
      tag: 'thinking',
      isValid: true,
      severity: 'warning',
      isOpen: true,
      isClosed: true,
      message: `<thinking> 存疑（${thinkingOpen} 开 / ${thinkingClose} 闭）。${dupHint}`,
    };
  } else {
    thinking = {
      tag: 'thinking',
      isValid: false,
      severity: 'error',
      isOpen: thinkingOpen > 0,
      isClosed: thinkingClose > 0 && thinkingOpen === thinkingClose,
      message: `<thinking> 标签未正确闭合 (${thinkingOpen} 个开标签, ${thinkingClose} 个闭标签)`,
    };
  }

  // 检查 <maintext>
  const maintextOpen = (messageContent.match(/<maintext>/gi) || []).length;
  const maintextClose = (messageContent.match(/<\/maintext>/gi) || []).length;
  let maintext: TagCheckResult;
  if (maintextOpen === 0) {
    maintext = {
      tag: 'maintext',
      isValid: false,
      severity: 'error',
      isOpen: false,
      isClosed: false,
      message: '缺少 <maintext> 标签',
    };
  } else if (maintextOpen === maintextClose) {
    maintext = {
      tag: 'maintext',
      isValid: true,
      severity: 'ok',
      isOpen: true,
      isClosed: true,
      message: `<maintext> 标签完整 (${maintextOpen} 对)`,
    };
  } else if (isSuspiciousDuplicateOpenMismatch(maintextOpen, maintextClose)) {
    maintext = {
      tag: 'maintext',
      isValid: true,
      severity: 'warning',
      isOpen: true,
      isClosed: true,
      message: `<maintext> 存疑（${maintextOpen} 开 / ${maintextClose} 闭）。${dupHint}`,
    };
  } else if (maintextOpen < maintextClose) {
    maintext = {
      tag: 'maintext',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: true,
      message: `多余的 </maintext> 标签 (${maintextOpen} 个开标签, ${maintextClose} 个闭标签)`,
    };
  } else {
    maintext = {
      tag: 'maintext',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: false,
      message: `<maintext> 未闭合 (${maintextOpen} 个开标签, ${maintextClose} 个闭标签)`,
    };
  }

  // 检查 <option>
  const optionOpen = (messageContent.match(/<option/gi) || []).length;
  const optionClose = (messageContent.match(/<\/option>/gi) || []).length;
  let option: TagCheckResult;
  if (optionOpen === 0) {
    option = {
      tag: 'option',
      isValid: false,
      severity: 'error',
      isOpen: false,
      isClosed: false,
      message: '缺少 <option> 标签',
    };
  } else if (optionOpen === optionClose) {
    option = {
      tag: 'option',
      isValid: true,
      severity: 'ok',
      isOpen: true,
      isClosed: true,
      message: `<option> 标签完整 (${optionOpen} 对)`,
    };
  } else if (isSuspiciousDuplicateOpenMismatch(optionOpen, optionClose)) {
    option = {
      tag: 'option',
      isValid: true,
      severity: 'warning',
      isOpen: true,
      isClosed: true,
      message: `<option> 存疑（${optionOpen} 开 / ${optionClose} 闭）。${dupHint}`,
    };
  } else if (optionOpen < optionClose) {
    option = {
      tag: 'option',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: true,
      message: `多余的 </option> 标签 (${optionOpen} 个开标签, ${optionClose} 个闭标签)`,
    };
  } else {
    option = {
      tag: 'option',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: false,
      message: `<option> 未闭合 (${optionOpen} 个开标签, ${optionClose} 个闭标签)`,
    };
  }

  // 检查 <sum>（可选；有则须闭合）
  const sumOpen = (messageContent.match(/<sum>/gi) || []).length;
  const sumClose = (messageContent.match(/<\/sum>/gi) || []).length;
  let sum: TagCheckResult;
  if (sumOpen === 0 && sumClose === 0) {
    sum = {
      tag: 'sum',
      isValid: true,
      severity: 'ok',
      isOpen: false,
      isClosed: false,
      message: '无 <sum> 标签（可选）',
    };
  } else if (sumOpen === sumClose) {
    sum = {
      tag: 'sum',
      isValid: true,
      severity: 'ok',
      isOpen: true,
      isClosed: true,
      message: `<sum> 标签完整 (${sumOpen} 对)`,
    };
  } else if (isSuspiciousDuplicateOpenMismatch(sumOpen, sumClose)) {
    sum = {
      tag: 'sum',
      isValid: true,
      severity: 'warning',
      isOpen: true,
      isClosed: true,
      message: `<sum> 存疑（${sumOpen} 开 / ${sumClose} 闭）。${dupHint}`,
    };
  } else if (sumOpen < sumClose) {
    sum = {
      tag: 'sum',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: true,
      message: `多余的 </sum> 标签 (${sumOpen} 个开标签, ${sumClose} 个闭标签)`,
    };
  } else {
    sum = {
      tag: 'sum',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: false,
      message: `<sum> 未闭合 (${sumOpen} 个开标签, ${sumClose} 个闭标签)`,
    };
  }

  // 检查 <UpdateVariable>（可选；双 API 时常由第二段合并；有则须闭合）
  const uvOpen = (messageContent.match(/<UpdateVariable>/gi) || []).length;
  const uvClose = (messageContent.match(/<\/UpdateVariable>/gi) || []).length;
  let updateVariable: TagCheckResult;
  if (uvOpen === 0 && uvClose === 0) {
    updateVariable = {
      tag: 'UpdateVariable',
      isValid: true,
      severity: 'ok',
      isOpen: false,
      isClosed: false,
      message: '无 <UpdateVariable> 标签（可选）',
    };
  } else if (uvOpen === uvClose) {
    updateVariable = {
      tag: 'UpdateVariable',
      isValid: true,
      severity: 'ok',
      isOpen: true,
      isClosed: true,
      message: `<UpdateVariable> 标签完整 (${uvOpen} 对)`,
    };
  } else if (isSuspiciousDuplicateOpenMismatch(uvOpen, uvClose)) {
    updateVariable = {
      tag: 'UpdateVariable',
      isValid: true,
      severity: 'warning',
      isOpen: true,
      isClosed: true,
      message: `<UpdateVariable> 存疑（${uvOpen} 开 / ${uvClose} 闭）。${dupHint}`,
    };
  } else if (uvOpen < uvClose) {
    updateVariable = {
      tag: 'UpdateVariable',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: true,
      message: `多余的 </UpdateVariable> 标签 (${uvOpen} 个开标签, ${uvClose} 个闭标签)`,
    };
  } else {
    updateVariable = {
      tag: 'UpdateVariable',
      isValid: false,
      severity: 'error',
      isOpen: true,
      isClosed: false,
      message: `<UpdateVariable> 未闭合 (${uvOpen} 个开标签, ${uvClose} 个闭标签)`,
    };
  }

  return [thinking, maintext, option, sum, updateVariable];
}

/**
 * 检查消息是否有未闭合的 thinking 或 redacted_reasoning 标签
 * 返回 true 表示所有过滤标签都已闭合，可以开始解析
 */
export function isFilteringComplete(messageContent: string): boolean {
  if (!messageContent) return true;

  // 检查 <thinking>
  const thinkingOpen = (messageContent.match(/<thinking>/gi) || []).length;
  const thinkingClose = (messageContent.match(/<\/thinking>/gi) || []).length;
  if (thinkingOpen > thinkingClose) return false;

  // 检查 <redacted_reasoning>
  const redactedOpen = (messageContent.match(/<redacted_reasoning>/gi) || []).length;
  const redactedClose = (messageContent.match(/<\/redacted_reasoning>/gi) || []).length;
  if (redactedOpen > redactedClose) return false;

  return true;
}

/**
 * 从流式文本中提取已过滤的内容（去除 thinking 和 redacted_reasoning 后）
 */
export function extractFilteredContent(streamText: string): string {
  if (!streamText) return '';

  // 移除所有已闭合的 <thinking> 标签及其内容
  let cleaned = streamText.replace(/<thinking>.*?<\/thinking>/gis, '');

  // 移除所有已闭合的 <redacted_reasoning> 标签及其内容
  cleaned = cleaned.replace(/<redacted_reasoning>.*?<\/redacted_reasoning>/gis, '');

  // 如果有未闭合的 <thinking> 标签，截断到该位置
  const thinkingStart = cleaned.search(/<thinking>/i);
  if (thinkingStart !== -1) {
    cleaned = cleaned.substring(0, thinkingStart);
  }

  // 如果有未闭合的 <redacted_reasoning> 标签，截断到该位置
  const redactedStart = cleaned.search(/<redacted_reasoning>/i);
  if (redactedStart !== -1) {
    cleaned = cleaned.substring(0, redactedStart);
  }

  return cleaned.trim();
}

/**
 * 从后往前配对：最后一个 </maintext> 与其前方最后一个 <maintext> 之间的内容。
 * 避免前文「1. <maintext>」等未闭合示例与唯一闭标签被非贪婪正则误配成一对。
 */
export function extractMaintextByLastClosePair(text: string): string {
  if (!text) return '';

  const lc = text.toLowerCase();
  const closeIdx = lc.lastIndexOf('</maintext>');
  if (closeIdx === -1) return '';

  const openIdx = lc.lastIndexOf('<maintext>', closeIdx);
  if (openIdx === -1) return '';

  const openSlice = text.slice(openIdx);
  const openMatch = openSlice.match(/^<maintext>/i);
  if (!openMatch) return '';

  const innerStart = openIdx + openMatch[0].length;
  if (innerStart > closeIdx) return '';

  if (!/^<\/maintext>/i.test(text.slice(closeIdx))) return '';

  return text.slice(innerStart, closeIdx).trim();
}

/**
 * 将「最后一对」<maintext> 的内部替换为 newInner，保留原有开闭标签写法（含大小写）。
 * 用于编辑保存，避免只替换到第一对标签。
 */
export function replaceLastMaintextInnerContent(fullMessage: string, newInner: string): string {
  if (!fullMessage) return fullMessage;

  const lc = fullMessage.toLowerCase();
  const closeIdx = lc.lastIndexOf('</maintext>');
  if (closeIdx === -1) return fullMessage;

  const openIdx = lc.lastIndexOf('<maintext>', closeIdx);
  if (openIdx === -1) return fullMessage;

  const openMatch = fullMessage.slice(openIdx).match(/^<maintext>/i);
  if (!openMatch) return fullMessage;

  const innerStart = openIdx + openMatch[0].length;
  if (innerStart > closeIdx) return fullMessage;

  if (!/^<\/maintext>/i.test(fullMessage.slice(closeIdx))) return fullMessage;

  return fullMessage.slice(0, innerStart) + newInner + fullMessage.slice(closeIdx);
}

/**
 * 解析消息中的正文
 * 注意：先移除 <thinking> / redacted_reasoning，再按最后一对闭标签从后往前取 maintext
 */
export function parseMaintext(messageContent: string): string {
  if (!messageContent) return '';

  // 先移除所有<thinking>和标签及其内容
  let cleaned = messageContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<redacted_reasoning>[\s\S]*?<\/redacted_reasoning>/gi, '');

  // 检查是否有未闭合的标签
  const thinkingStart = cleaned.search(/<thinking>/i);
  if (thinkingStart !== -1) {
    cleaned = cleaned.substring(0, thinkingStart);
  }
  const redactedStart = cleaned.search(/<redacted_reasoning>/i);
  if (redactedStart !== -1) {
    cleaned = cleaned.substring(0, redactedStart);
  }

  return extractMaintextByLastClosePair(cleaned);
}

/**
 * 提取最后一对 <sum> 标签内容（避免前文「格式要求：<sum>…」等多算一对开标签时取错）
 */
export function extractLastSumContent(messageContent: string): string {
  if (!messageContent) return '';
  let cleaned = messageContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<redacted_reasoning>[\s\S]*?<\/redacted_reasoning>/gi, '');
  const matches = [...cleaned.matchAll(/<sum>([\s\S]*?)<\/sum>/gi)];
  if (matches.length === 0) return '';
  const last = matches[matches.length - 1];
  return (last[1] ?? '').trim();
}

/**
 * 解析消息中的选项
 * 支持两种格式：
 * 1. 带 id: <option id="A">选项文本</option>
 * 2. 不带 id: <option>\nA. 选项1\nB. 选项2\n</option>
 */
export interface Option {
  id: string;
  text: string;
}

export function parseOptions(messageContent: string): Option[] {
  if (!messageContent) return [];

  // 先移除 thinking 和 redacted_reasoning 标签
  let cleaned = messageContent.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '');
  cleaned = cleaned.replace(/<redacted_reasoning>[\s\S]*?<\/redacted_reasoning>/gi, '');

  const thinkingStart = cleaned.search(/<thinking>/i);
  if (thinkingStart !== -1) {
    cleaned = cleaned.substring(0, thinkingStart);
  }
  const redactedStart = cleaned.search(/<redacted_reasoning>/i);
  if (redactedStart !== -1) {
    cleaned = cleaned.substring(0, redactedStart);
  }

  // 匹配所有带 id 的 <option id="X">...</option> 标签（支持多行内容）
  const optionWithIdRegex = /<option id="([^"]+)">([\s\S]*?)<\/option>/gi;
  const optionsWithId: Option[] = [];
  let match;
  while ((match = optionWithIdRegex.exec(cleaned)) !== null) {
    optionsWithId.push({
      id: match[1].trim().toUpperCase(),
      text: match[2].trim(),
    });
  }

  // 如果找到带 id 的 option 标签，直接返回（通常是 A、B、C 三个选项）
  if (optionsWithId.length > 0) {
    return optionsWithId;
  }

  // 兼容旧格式：匹配所有不带 id 的 <option>...</option> 标签对
  const optionPairRe = /<option([^>]*)>([\s\S]*?)<\/option>/gi;
  const allPairs = [...cleaned.matchAll(optionPairRe)];

  // 取最后三个闭合的 <option>…</option> 标签对（通常对应 A/B/C 三个选项）
  const lastThreePairs = allPairs.slice(-3);
  const allOptionTexts: string[] = [];
  for (const pair of lastThreePairs) {
    const text = (pair[2] ?? '').trim();
    if (text) allOptionTexts.push(text);
  }
  if (allOptionTexts.length === 0) {
    return [];
  }

  const optionText = allOptionTexts.join('\n');
  const lines = optionText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

  // 检查是否是 A.、B.、C. 格式
  const optionPattern = /^[A-Z]\.\s*/;
  const hasLetterPrefix = lines.some(line => optionPattern.test(line));

  if (hasLetterPrefix) {
    // 按字母开头分割选项
    const options: Option[] = [];
    let currentOption: string[] = [];

    for (const line of lines) {
      if (optionPattern.test(line)) {
        if (currentOption.length > 0) {
          const text = currentOption.join('\n');
          const id = text.match(/^([A-Z])\./)?.[1] || String.fromCharCode(65 + options.length);
          options.push({
            id,
            text: text.replace(/^[A-Z]\.\s*/, '').trim()
          });
          currentOption = [];
        }
        currentOption.push(line);
      } else {
        if (currentOption.length > 0) {
          currentOption.push(line);
        }
      }
    }

    if (currentOption.length > 0) {
      const text = currentOption.join('\n');
      const id = text.match(/^([A-Z])\./)?.[1] || String.fromCharCode(65 + options.length);
      options.push({
        id,
        text: text.replace(/^[A-Z]\.\s*/, '').trim()
      });
    }

    return options;
  } else {
    // 单个选项或简单的多行选项
    return lines.map((line, index) => ({
      id: String.fromCharCode(65 + index),
      text: line
    }));
  }
}

/**
 * 从最新 assistant 消息中读取正文和选项
 */
export function loadFromLatestMessage(): {
  maintext: string;
  options: Option[];
  messageId?: number;
  userMessageId?: number;
  fullMessage?: string;
} {
  try {
    const lastMessageId = getLastMessageId();
    if (lastMessageId < 0) {
      return { maintext: '', options: [] };
    }

    // 获取最新 assistant 消息
    const messages = getChatMessages(lastMessageId, { role: 'assistant' });
    if (!messages || messages.length === 0) {
      // 尝试获取任意角色的最新消息
      const allMessages = getChatMessages(lastMessageId);
      if (!allMessages || allMessages.length === 0) {
        return { maintext: '', options: [] };
      }
      const latestMessage = allMessages[0];
      const maintext = parseMaintext(latestMessage.message || '');
      const options = parseOptions(latestMessage.message || '');

      // 查找对应的 user 消息（往前遍历，找到最近的一条 user 消息）
      let userMessageId: number | undefined;
      const msgId = latestMessage.message_id;
      for (let i = msgId - 1; i >= 0; i--) {
        const prevMessages = getChatMessages(i, { role: 'user' });
        if (prevMessages && prevMessages.length > 0) {
          userMessageId = prevMessages[0].message_id;
          break;
        }
      }

      return {
        maintext,
        options,
        messageId: latestMessage.message_id,
        userMessageId,
        fullMessage: latestMessage.message
      };
    }

    const latestAssistantMessage = messages[0];
    const messageContent = latestAssistantMessage.message || '';

    const maintext = parseMaintext(messageContent);
    const options = parseOptions(messageContent);

    // 查找对应的 user 消息（往前遍历，找到最近的一条 user 消息）
    let userMessageId: number | undefined;
    const assistantId = latestAssistantMessage.message_id;
    for (let i = assistantId - 1; i >= 0; i--) {
      const prevMessages = getChatMessages(i, { role: 'user' });
      if (prevMessages && prevMessages.length > 0) {
        userMessageId = prevMessages[0].message_id;
        break;
      }
    }

    return {
      maintext,
      options,
      messageId: latestAssistantMessage.message_id,
      userMessageId,
      fullMessage: messageContent
    };
  } catch (error) {
    console.error('❌ [messageParser] 加载最新消息失败:', error);
    return { maintext: '', options: [] };
  }
}
