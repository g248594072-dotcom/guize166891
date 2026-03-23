/**
 * 字体管理工具
 * 管理字体应用（只保留思源宋体、小可奶酪体、金字社统圆体）
 */

// 导入本地字体文件（使用 ?url 让 webpack 正确处理为内嵌资源）
// @ts-ignore - 让 webpack 处理这些导入
import xiaokeNaigaoUrl from '../../../字体/小可奶酪体_郑庆科/小可奶酪体.ttf?url';
// @ts-ignore
import jinzisheTongyuanUrl from '../../../字体/金字社统圆体_金字社®/JinzisheTongyuan-Regular.ttf?url';

/** 本地字体路径映射 */
const LOCAL_FONT_URLS: Record<string, string> = {
  'xiaoke-naigao': xiaokeNaigaoUrl as unknown as string,
  'jinzishe-tongyuan': jinzisheTongyuanUrl as unknown as string,
};

/** 字体信息接口 */
export interface FontInfo {
  id: string;
  name: string;
  family: string;
  url: string;
  isPreset: boolean;
  previewText?: string;
}

/** 字体设置 */
export interface FontSettings {
  currentFontId: string;
}

/** localStorage 键名 */
const STORAGE_KEY = 'rule_modifier_font_settings';

/** 预设字体列表（只保留思源宋体和小可奶酪体） */
export const PRESET_FONTS: FontInfo[] = [
  {
    id: 'noto-serif-sc',
    name: '思源宋体',
    family: '"Noto Serif SC", "Source Han Serif", serif',
    url: 'https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700&display=swap',
    isPreset: true,
    previewText: '规则模拟器 经典优雅的衬线字体',
  },
  {
    id: 'xiaoke-naigao',
    name: '小可奶酪体',
    family: '"Xiaoke Naigao", "小可奶酪体", cursive',
    url: LOCAL_FONT_URLS['xiaoke-naigao'] || '',
    isPreset: true,
    previewText: '规则模拟器 可爱奶酪风格',
  },
];

/** Logo 专用字体配置（金字社统圆体） */
export const LOGO_FONT: FontInfo = {
  id: 'jinzishe-tongyuan',
  name: '金字社统圆体',
  family: '"Jinzishe Tongyuan", "金字社统圆体", sans-serif',
  url: LOCAL_FONT_URLS['jinzishe-tongyuan'] || '',
  isPreset: true,
  previewText: '规则模拟器',
};

/** 默认字体设置（默认使用思源宋体） */
export const DEFAULT_FONT_SETTINGS: FontSettings = {
  currentFontId: 'noto-serif-sc',
};

/**
 * 保存字体设置到 localStorage
 */
export function saveFontSettings(settings: FontSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.warn('⚠️ [fontManager] 保存字体设置失败:', error);
  }
}

/**
 * 从 localStorage 加载字体设置
 */
export function loadFontSettings(): FontSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 确保加载的字体ID是有效的预设字体
      const validFont = PRESET_FONTS.find((f) => f.id === parsed.currentFontId);
      return {
        currentFontId: validFont ? parsed.currentFontId : DEFAULT_FONT_SETTINGS.currentFontId,
      };
    }
  } catch (error) {
    console.warn('⚠️ [fontManager] 加载字体设置失败:', error);
  }
  return { ...DEFAULT_FONT_SETTINGS };
}

/**
 * 获取字体格式
 */
function getFontFormat(url: string): string {
  if (url.includes('data:font/woff2')) return 'woff2';
  if (url.includes('data:font/woff')) return 'woff';
  if (url.includes('data:font/ttf') || url.includes('data:font/truetype')) return 'truetype';
  if (url.includes('data:font/otf') || url.includes('data:font/opentype')) return 'opentype';
  if (url.includes('.woff2')) return 'woff2';
  if (url.includes('.woff')) return 'woff';
  if (url.includes('.ttf')) return 'truetype';
  if (url.includes('.otf')) return 'opentype';
  return 'truetype';
}

/**
 * 生成本地字体的 @font-face CSS
 */
function generateLocalFontFaceCSS(font: FontInfo): string {
  if (!font.url || font.url.startsWith('http')) return '';

  const format = getFontFormat(font.url);
  // 提取字体族名称（第一个带引号的部分）
  const familyMatch = font.family.match(/"([^"]+)"/);
  const familyName = familyMatch ? familyMatch[1] : font.family;

  return `
    @font-face {
      font-family: "${familyName}";
      src: url("${font.url}") format("${format}");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }
  `;
}

/**
 * 应用字体到文档
 */
export function applyFont(fontId: string): void {
  const font = PRESET_FONTS.find((f) => f.id === fontId) || PRESET_FONTS[0];

  // 移除之前的字体样式标签
  const existingStyle = document.getElementById('rule-modifier-font-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // 创建新的样式标签
  const style = document.createElement('style');
  style.id = 'rule-modifier-font-style';

  let css = '';

  // 加载本地字体的 @font-face（小可奶酪体）
  const localFont = PRESET_FONTS.find((f) => f.url && !f.url.startsWith('http'));
  if (localFont) {
    css += generateLocalFontFaceCSS(localFont);
  }

  // 如果是 Google Fonts 预设字体（思源宋体）
  if (font.url && font.url.startsWith('http')) {
    css += `@import url('${font.url}');\n`;
  }

  // 应用字体到根元素（但排除 Font Awesome 图标）
  css += `
    #app-root, #app-root * {
      font-family: ${font.family} !important;
    }
    
    /* 恢复 Font Awesome 图标字体 */
    #app-root .fa-solid,
    #app-root .fa-regular,
    #app-root .fa-light,
    #app-root .fa-thin,
    #app-root .fa-brands,
    #app-root [class*="fa-"] {
      font-family: "Font Awesome 6 Free", "Font Awesome 6 Brands", "FontAwesome", "fontawesome" !important;
    }
    
    #app-root .fa-solid,
    #app-root .fa-regular {
      font-weight: 900 !important;
    }
  `;

  style.textContent = css;
  document.head.appendChild(style);

  console.log(`✅ [fontManager] 字体已应用: ${font.name} (${font.family})`);
}

/**
 * 应用 Logo 专用字体（金字社统圆体）
 */
export function applyLogoFont(): void {
  // 移除之前的 Logo 字体样式
  const existingStyle = document.getElementById('rule-modifier-logo-font-style');
  if (existingStyle) {
    existingStyle.remove();
  }

  // 创建新的样式标签
  const style = document.createElement('style');
  style.id = 'rule-modifier-logo-font-style';

  // 提取字体族名称
  const familyMatch = LOGO_FONT.family.match(/"([^"]+)"/);
  const fontFamily = familyMatch ? familyMatch[1] : LOGO_FONT.family;

  const css = `
    @font-face {
      font-family: "${fontFamily}";
      src: url("${LOGO_FONT.url}") format("${getFontFormat(LOGO_FONT.url)}");
      font-weight: 400;
      font-style: normal;
      font-display: swap;
    }

    .logo-text {
      font-family: "${fontFamily}" !important;
      font-weight: 400;
    }
  `;

  style.textContent = css;
  document.head.appendChild(style);

  console.log(`✅ [fontManager] Logo 字体已应用: ${LOGO_FONT.name}`);
}

/**
 * 初始化字体（加载保存的设置并应用）
 */
export function initFont(): void {
  const settings = loadFontSettings();
  applyFont(settings.currentFontId);
}

/**
 * 获取所有可用字体（预设字体）
 */
export function getAllFonts(): FontInfo[] {
  return [...PRESET_FONTS];
}
