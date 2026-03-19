/**
 * 消息解析工具
 * 从最新楼层消息中解析 maintext 和 option 标签
 */

/**
 * 标签验证结果
 */
export interface TagCheckResult {
  tag: string;
  isValid: boolean;
  isOpen: boolean;
  isClosed: boolean;
  message: string;
}

/**
 * 验证消息中的标签闭合情况
 * 检查 <maintext>, <option>, <sum> 等关键标签
 */
export function validateTags(messageContent: string): TagCheckResult[] {
  if (!messageContent) {
    return [
      { tag: 'maintext', isValid: false, isOpen: false, isClosed: false, message: '消息内容为空' },
      { tag: 'option', isValid: false, isOpen: false, isClosed: false, message: '消息内容为空' },
      { tag: 'sum', isValid: false, isOpen: false, isClosed: false, message: '消息内容为空' }
    ];
  }

  const results: TagCheckResult[] = [];

  // 检查 <maintext> 标签
  const maintextOpen = (messageContent.match(/<maintext>/gi) || []).length;
  const maintextClose = (messageContent.match(/<\/maintext>/gi) || []).length;
  results.push({
    tag: 'maintext',
    isValid: maintextOpen > 0 && maintextOpen === maintextClose,
    isOpen: maintextOpen > 0,
    isClosed: maintextClose > 0 && maintextOpen === maintextClose,
    message: maintextOpen === 0 ? '缺少 <maintext> 标签' :
             maintextOpen > maintextClose ? `<maintext> 未闭合 (${maintextOpen} 个开标签, ${maintextClose} 个闭标签)` :
             maintextOpen < maintextClose ? `多余的 </maintext> 标签 (${maintextOpen} 个开标签, ${maintextClose} 个闭标签)` :
             `<maintext> 标签完整 (${maintextOpen} 对)`
  });

  // 检查 <option> 标签
  const optionOpen = (messageContent.match(/<option/gi) || []).length;
  const optionClose = (messageContent.match(/<\/option>/gi) || []).length;
  results.push({
    tag: 'option',
    isValid: optionOpen > 0 && optionOpen === optionClose,
    isOpen: optionOpen > 0,
    isClosed: optionClose > 0 && optionOpen === optionClose,
    message: optionOpen === 0 ? '缺少 <option> 标签' :
             optionOpen > optionClose ? `<option> 未闭合 (${optionOpen} 个开标签, ${optionClose} 个闭标签)` :
             optionOpen < optionClose ? `多余的 </option> 标签 (${optionOpen} 个开标签, ${optionClose} 个闭标签)` :
             `<option> 标签完整 (${optionOpen} 对)`
  });

  // 检查 <sum> 标签（可选但推荐）
  const sumOpen = (messageContent.match(/<sum>/gi) || []).length;
  const sumClose = (messageContent.match(/<\/sum>/gi) || []).length;
  results.push({
    tag: 'sum',
    isValid: sumOpen === sumClose, // sum 是可选的，但如果有必须闭合
    isOpen: sumOpen > 0,
    isClosed: sumClose > 0 && sumOpen === sumClose,
    message: sumOpen === 0 ? '无 <sum> 标签（可选）' :
             sumOpen > sumClose ? `<sum> 未闭合 (${sumOpen} 个开标签, ${sumClose} 个闭标签)` :
             sumOpen < sumClose ? `多余的 </sum> 标签 (${sumOpen} 个开标签, ${sumClose} 个闭标签)` :
             `<sum> 标签完整 (${sumOpen} 对)`
  });

  // 检查 <thinking> 标签是否已闭合（应该已闭合）
  const thinkingOpen = (messageContent.match(/<thinking>/gi) || []).length;
  const thinkingClose = (messageContent.match(/<\/thinking>/gi) || []).length;
  results.push({
    tag: 'thinking',
    isValid: thinkingOpen === thinkingClose,
    isOpen: thinkingOpen > 0,
    isClosed: thinkingClose > 0 && thinkingOpen === thinkingClose,
    message: thinkingOpen === 0 ? '无 <thinking> 标签' :
             thinkingOpen !== thinkingClose ? `<thinking> 标签未正确闭合 (${thinkingOpen} 个开标签, ${thinkingClose} 个闭标签)` :
             `<thinking> 标签完整 (${thinkingOpen} 对)`
  });

  return results;
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
 * 解析消息中的正文
 * 注意：只提取不在<thinking>或标签内部的<maintext>标签
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

  // 提取最后一个 <maintext> 标签
  const matches = cleaned.match(/<maintext>([\s\S]*?)<\/maintext>/gi);
  if (!matches || matches.length === 0) return '';
  const lastMatch = matches[matches.length - 1];
  const content = lastMatch.match(/<maintext>([\s\S]*?)<\/maintext>/i);
  return content ? content[1].trim() : '';
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

  // 先尝试匹配带 id 的格式
  const optionWithIdRegex = /<option id="([^"]+)">([^<]+)<\/option>/g;
  const optionsWithId: Option[] = [];
  let match;

  while ((match = optionWithIdRegex.exec(cleaned)) !== null) {
    optionsWithId.push({
      id: match[1],
      text: match[2].trim()
    });
  }

  if (optionsWithId.length > 0) {
    return optionsWithId;
  }

  // 尝试解析不带 id 的格式
  const optionMatch = cleaned.match(/<option>([\s\S]*?)<\/option>/i);
  if (!optionMatch) {
    return [];
  }

  const optionText = optionMatch[1].trim();
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
