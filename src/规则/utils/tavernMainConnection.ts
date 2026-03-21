/**
 * 从 SillyTavern 当前「聊天补全」连接读取 OpenAI 兼容的 URL / 密钥 / 模型，
 * 供第二 API 与主对话使用相同供应商时使用。
 *
 * 说明：
 * - URL：优先 `chatCompletionSettings.reverse_proxy`，否则 `custom_url`（CUSTOM 源）。
 * - 密钥：优先 `proxy_password`（反代常用），否则尝试在父页面读取各供应商的 #api_key_* 输入框（与酒馆界面同源时可用）。
 * - 模型：`getChatCompletionModel()`。
 * - Azure OpenAI 等路径差异较大，暂不支持，返回 null。
 */

/** 与 SillyTavern openai.js 中各源对应的密钥输入框（按需扩展） */
const CHAT_API_KEY_INPUT_SELECTORS = [
  '#api_key_openai',
  '#api_key_custom',
  '#api_key_openrouter',
  '#api_key_deepseek',
  '#api_key_moonshot',
  '#api_key_xai',
  '#api_key_groq',
  '#api_key_claude',
  '#api_key_mistralai',
  '#api_key_makersuite',
  '#api_key_azure_openai',
  '#api_key_siliconflow',
  '#api_key_cohere',
  '#api_key_perplexity',
  '#api_key_ai21',
  '#api_key_fireworks',
  '#api_key_cometapi',
  '#api_key_zai',
  '#api_key_chutes',
  '#api_key_electronhub',
  '#api_key_nanogpt',
  '#api_key_aimlapi',
  '#api_key_pollinations',
  '#api_key_vertexai',
];

function getStGlobals(): { st: any; doc: Document } | null {
  try {
    const w = window as unknown as { parent?: Window; SillyTavern?: any };
    let st: any =
      typeof SillyTavern !== 'undefined'
        ? (SillyTavern as any)
        : w.SillyTavern;

    let doc: Document | null = document;

    if (w.parent && w.parent !== window) {
      try {
        const pw = w.parent as unknown as { SillyTavern?: any; document?: Document };
        if (!st?.chatCompletionSettings && pw.SillyTavern?.chatCompletionSettings) {
          st = pw.SillyTavern;
        }
        if (pw.document) doc = pw.document;
      } catch {
        /* 跨域父页面不可访问 */
      }
    }

    if (!st?.chatCompletionSettings) return null;
    return { st, doc: doc || document };
  } catch {
    return null;
  }
}

function readApiKeyFromChatSettingsDom(doc: Document): string {
  for (const sel of CHAT_API_KEY_INPUT_SELECTORS) {
    try {
      const el = doc.querySelector(sel) as HTMLInputElement | null;
      const v = el?.value?.trim();
      if (v) return v;
    } catch {
      /* ignore */
    }
  }
  return '';
}

export type TavernMainOpenAiCredentials = {
  url: string;
  key: string;
  model: string;
};

/**
 * 读取酒馆当前聊天补全（插头）对应的 OpenAI 兼容 endpoint 与密钥、模型。
 * @returns 失败时 null（例如未连接、Azure、或无法读取密钥）
 */
export function getTavernMainOpenAiCredentials(): TavernMainOpenAiCredentials | null {
  const g = getStGlobals();
  if (!g) {
    console.warn('⚠️ [tavernMainConnection] 无法访问 SillyTavern.chatCompletionSettings');
    return null;
  }

  const { st, doc } = g;
  const oai = st.chatCompletionSettings;
  const src = String(oai?.chat_completion_source ?? '');

  if (/azure/i.test(src)) {
    console.warn('⚠️ [tavernMainConnection] 当前为 Azure OpenAI，请关闭「使用酒馆相同 API」并手动填写第二 API');
    return null;
  }

  let endpoint = String(oai?.reverse_proxy ?? '').trim();
  if (!endpoint) endpoint = String(oai?.custom_url ?? '').trim();
  if (!endpoint) {
    console.warn('⚠️ [tavernMainConnection] 未配置反代地址或自定义 URL');
    return null;
  }

  let key = String(oai?.proxy_password ?? '').trim();
  if (!key) key = readApiKeyFromChatSettingsDom(doc);

  let model = '';
  try {
    if (typeof st.getChatCompletionModel === 'function') {
      model = String(st.getChatCompletionModel() ?? '').trim();
    }
  } catch {
    /* ignore */
  }

  if (!key) {
    console.warn(
      '⚠️ [tavernMainConnection] 未读取到 API 密钥（可尝试在酒馆「代理密码」填写密钥，或改用自定义第二 API）',
    );
    return null;
  }

  return { url: endpoint, key, model };
}

/**
 * 仅读取反代/自定义 URL 与当前模型名，不读取密钥。
 * 用于「获取模型列表」等可选能力；第二 API 走 `generateRaw` 时不需要密钥。
 */
export function getTavernMainOpenAiEndpoint(): { url: string; model: string } | null {
  const g = getStGlobals();
  if (!g) return null;

  const { st } = g;
  const oai = st.chatCompletionSettings;
  const src = String(oai?.chat_completion_source ?? '');

  if (/azure/i.test(src)) return null;

  let endpoint = String(oai?.reverse_proxy ?? '').trim();
  if (!endpoint) endpoint = String(oai?.custom_url ?? '').trim();
  if (!endpoint) return null;

  let model = '';
  try {
    if (typeof st.getChatCompletionModel === 'function') {
      model = String(st.getChatCompletionModel() ?? '').trim();
    }
  } catch {
    /* ignore */
  }

  return { url: endpoint, model };
}
