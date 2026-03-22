/**
 * 其他设置管理工具
 * 管理输入行为模式等杂项设置
 */

import type { OtherSettings, InputActionMode } from '../types';
import { DEFAULT_OTHER_SETTINGS } from '../types';

/**
 * 获取其他设置
 * @returns 其他设置
 */
export async function getOtherSettings(): Promise<OtherSettings> {
  try {
    const { readGameData } = await import('./variableReader');
    const gameData = await readGameData();
    const settings = gameData.player?.settings?.other;

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
export async function saveOtherSettings(settings: OtherSettings): Promise<boolean> {
  try {
    const { updateStatData } = await import('./dialogAndVariable');

    updateStatData((stat) => {
      if (!stat.player) {
        stat.player = { name: '玩家', settings: {} };
      }
      if (!stat.player.settings) {
        stat.player.settings = {};
      }
      stat.player.settings.other = settings;
      return stat;
    });

    console.log('✅ [otherSettings] 其他设置已保存:', settings);
    return true;
  } catch (error) {
    console.error('❌ [otherSettings] 保存其他设置失败:', error);
    return false;
  }
}

/**
 * 获取输入行为模式
 * @returns 当前输入行为模式
 */
export async function getInputActionMode(): Promise<InputActionMode> {
  const settings = await getOtherSettings();
  return settings.inputActionMode;
}

/**
 * 设置输入行为模式
 * @param mode 模式
 * @returns 是否成功
 */
export async function setInputActionMode(mode: InputActionMode): Promise<boolean> {
  const settings = await getOtherSettings();
  settings.inputActionMode = mode;
  return saveOtherSettings(settings);
}
