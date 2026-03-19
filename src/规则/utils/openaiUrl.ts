export interface NormalizedOpenAiUrl {
  /** 用户可配置的“服务基址”，不包含 `/v1` 及更深路径 */
  base: string;
  /** 标准 OpenAI 兼容 API 基址：`${base}/v1` */
  apiBase: string;
  /** 标准聊天补全 endpoint：`${apiBase}/chat/completions` */
  chatCompletionsUrl: string;
  /** 可能的 models endpoint 候选列表（按优先级） */
  modelsUrlCandidates: string[];
}

function stripTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

function stripSuffixIgnoreCase(input: string, suffix: string): string {
  return input.toLowerCase().endsWith(suffix.toLowerCase())
    ? input.slice(0, input.length - suffix.length)
    : input;
}

/**
 * 规范化用户输入的 OpenAI 兼容 API URL。
 *
 * 允许用户输入：
 * - https://host
 * - https://host/v1
 * - https://host/v1/chat/completions
 * - https://host/proxy/v1/chat/completions
 */
export function normalizeOpenAiUrl(input: string): NormalizedOpenAiUrl {
  const raw = (input || '').trim();
  if (!raw) {
    throw new Error('API URL 为空');
  }
  if (!/^https?:\/\//i.test(raw)) {
    throw new Error('API URL 必须以 http:// 或 https:// 开头');
  }

  // 用 URL 做基础校验与归一化（保留可能存在的 path 前缀，如 /proxy）
  const parsed = new URL(raw);
  const origin = parsed.origin;
  let path = stripTrailingSlashes(parsed.pathname || '');

  // 去掉常见后缀
  path = stripSuffixIgnoreCase(path, '/v1/chat/completions');
  path = stripSuffixIgnoreCase(path, '/chat/completions');
  path = stripSuffixIgnoreCase(path, '/v1');
  path = stripTrailingSlashes(path);

  const base = stripTrailingSlashes(`${origin}${path}`);
  const apiBase = `${base}/v1`;

  return {
    base,
    apiBase,
    chatCompletionsUrl: `${apiBase}/chat/completions`,
    modelsUrlCandidates: [
      `${apiBase}/models`, // 标准
      `${base}/models`, // 部分反代/网关
    ],
  };
}

