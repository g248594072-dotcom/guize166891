/**
 * 其他设置管理工具
 * 管理输入行为模式等杂项设置
 */

import type { OtherSettings, InputActionMode } from '../types';
import { DEFAULT_OTHER_SETTINGS } from '../types';
import { useDataStore } from '../store';

/**
 * 获取其他设置
 * @returns 其他设置
 */
export function getOtherSettings(): OtherSettings {
  try {
    const store = useDataStore();
    const player = (store.data as any).player;
    const settings = player?.settings?.other;

    if (!settings) {
      return { ...DEFAULT_OTHER_SETTINGS };
    }

    return {
      inputActionMode: settings.inputActionMode ?? DEFAULT_OTHER_SETTINGS.inputActionMode,
    };
  } catch (error) {
    console.warn('⚠️ [otherSettings] 获取其他设置失败，使用默认值:', error);
    return { ...DEFAULT_OTHER_SETTINGS };
  }
}

/**
 * 保存其他设置
 * @param settings 设置对象
 * @returns 是否成功
 */
export function saveOtherSettings(settings: OtherSettings): boolean {
  try {
    const store = useDataStore();

    if (!(store.data as any).player) {
      (store.data as any).player = { name: '玩家', settings: {} };
    }
    if (!(store.data as any).player.settings) {
      (store.data as any).player.settings = {};
    }
    (store.data as any).player.settings.other = settings;

    console.log('✅ [otherSettings] 设置已保存:', settings);
    return true;
  } catch (error) {
    console.error('❌ [otherSettings] 保存设置失败:', error);
    return false;
  }
}

/**
 * 设置输入行为模式
 * @param mode 模式：'send' 直接发送，'append' 追加到输入框
 * @returns 是否成功
 */
export function setInputActionMode(mode: InputActionMode): boolean {
  return saveOtherSettings({ inputActionMode: mode });
}

/**
 * 获取当前输入行为模式
 * @returns 当前模式
 */
export function getInputActionMode(): InputActionMode {
  const settings = getOtherSettings();
  return settings.inputActionMode;
}

/**
 * 切换输入行为模式
 * @returns 切换后的模式
 */
export function toggleInputActionMode(): InputActionMode {
  const current = getInputActionMode();
  const next = current === 'send' ? 'append' : 'send';
  setInputActionMode(next);
  return next;
}
