/**
 * 游戏初始化工具
 * 负责初始化游戏变量、创建开局楼层、管理世界书条目
 */

import type { OpeningFormData, GameData, MvuData } from '../types';

// 防止重复创建的标志
let isCreatingOpening = false;

/**
 * 1. 初始化游戏变量（写入0层）
 * 注意：使用 updateVariablesWith 确保原子性更新，避免覆盖其他数据
 */
export async function initializeGameVariables(formData: OpeningFormData): Promise<boolean> {
  try {
    // 获取0层变量表（如果不存在则创建）
    let variables: any;
    try {
      variables = getVariables({ type: 'message', message_id: 0 });
    } catch (err) {
      console.warn('⚠️ 0层消息不存在，将在更新时创建', err);
      variables = { stat_data: {} };
    }

    // 使用 updateVariablesWith 更新0层变量
    await updateVariablesWith(
      vars => {
        // 确保基础结构存在
        if (!vars) vars = {};
        if (!vars.stat_data) vars.stat_data = {};

        // 初始化游戏状态
        if (!vars.stat_data.gameStatus) {
          vars.stat_data.gameStatus = {
            phase: 'opening',
            turn: 0,
            lastUpdated: new Date().toISOString(),
          };
        }

        // 初始化玩家信息
        vars.stat_data.player = {
          name: formData.playerName || '玩家',
          settings: {
            difficulty: formData.gameDifficulty,
            enableWorldRules: formData.enableWorldRules,
            enableRegionalRules: formData.enableRegionalRules,
            enablePersonalRules: formData.enablePersonalRules,
          },
        };

        // 初始化规则系统
        vars.stat_data.worldRules = [];
        vars.stat_data.regionalRules = [];
        vars.stat_data.personalRules = [];
        vars.stat_data.characters = [];

        // 初始化元数据
        vars.stat_data.meta = {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: '1.0.0',
        };

        // 保存开局配置
        vars.stat_data.openingConfig = formData;

        console.log('✅ [gameInitializer] 0层变量初始化完成');
        return vars;
      },
      { type: 'message', message_id: 0 },
    );

    console.log('✅ [gameInitializer] 成功初始化0层游戏变量');
    return true;
  } catch (error) {
    console.error('❌ [gameInitializer] 初始化0层游戏变量失败:', error);
    return false;
  }
}

/**
 * 根据表单数据构建开局提示词（供 createOpeningStoryMessage 与「跳过创建」分支共用）
 */
function buildOpeningPromptContent(formData: OpeningFormData): string {
  const sceneDesc = formData.sceneDescription || '神秘的未知场所';
  const openingDetail = String(formData.openingSceneDetail ?? '').trim();

  let rulesText = '';
  if (formData.selectedRules && formData.selectedRules.length > 0) {
    const presetRules = formData.selectedRules.filter((r: { isCustom?: boolean }) => !r.isCustom);
    const customRules = formData.selectedRules.filter((r: { isCustom?: boolean }) => r.isCustom);

    if (presetRules.length > 0) {
      rulesText += '预设世界规则：';
      rulesText += presetRules.map((r: { name: string; desc: string }) => `${r.name}\n${r.desc}`).join('，');
    }
    if (customRules.length > 0) {
      if (presetRules.length > 0) rulesText += '，';
      rulesText += '添加自定义世界规则：';
      rulesText += customRules.map((r: { name: string; desc: string }) => `${r.name}\n${r.desc}`).join('，');
    }
  }

  let charsText = '';
  if (formData.characters && formData.characters.length > 0) {
    if (rulesText) charsText += ' 。 ';
    charsText += '添加人物：';
    charsText += formData.characters.map((c: { name: string; gender: string; desc: string }) => {
      const gender = c.gender === 'female' ? '女' : c.gender === 'male' ? '男' : '其他';
      return `${c.name}（${gender}）\n${c.desc}`;
    }).join(' 。 添加人物：');
  }

  const openingDetailText = openingDetail ? `开场白场景补充：${openingDetail}。` : '';

  return `故事开始在${sceneDesc}。${openingDetailText}${rulesText}${charsText}。请根据以上信息生成一个开场白，并且保证正文包括所有被描述的内容，来确保变量的正常更新生成。

请严格按照以下格式回复：

<maintext>
[这里是开场剧情，必须包含所有规则和角色的描述]
</maintext>

<option>
A. [选项A描述]
B. [选项B描述]
C. [选项C描述]
</option>

<sum>[一句话总结开局内容]</sum>

<UpdateVariable>
<Analysis>
- 初始化世界规则和角色档案
</Analysis>
<JSONPatch>
[
${formData.selectedRules ? formData.selectedRules.map((r: { name: string; desc: string }) => `  { "op": "replace", "path": "/世界规则/${r.name}", "value": { "效果描述": "${r.desc}", "状态": "生效中", "标记": "世界级" } }`).join(',\n') : ''}
${formData.characters ? formData.characters.map((c: { name: string; desc: string }, i: number) => `,\n  { "op": "replace", "path": "/角色档案/CHR-${String(i + 1).padStart(3, '0')}", "value": { "姓名": "${c.name}", "状态": "存活", "描写": "${c.desc}", "身体信息": { "年龄": 18, "身高": 165, "体重": 50, "三围": "B86 W58 H88", "体质特征": "普通" }, "数值": { "好感度": 30, "发情值": 20, "性癖开发度": 10 } } }`).join('') : ''}
]
</JSONPatch>
</UpdateVariable>`;
}

/**
 * 2. 创建开局介绍楼层（1层）
 * 关键要点：
 * - 防止重复创建（检查1层消息是否已存在）
 * - 获取0层的data并携带到1层
 * - 根据配置生成不同风格的开局文本
 * - 创建完成后更新编年史
 * - 即使跳过创建，也返回 promptContent，供 App 调用 generate 时使用
 */
export async function createOpeningStoryMessage(formData: OpeningFormData): Promise<{success: boolean; promptContent?: string}> {
  // 防止重复创建
  if (isCreatingOpening) {
    console.log('⚠️ [gameInitializer] 正在创建开局楼层，跳过重复调用');
    return { success: false };
  }

  try {
    // 无论是否创建消息，都先构建提示词，保证调用 generate 时一定有内容
    const promptContent = buildOpeningPromptContent(formData);

    // 检查是否已经存在1层消息，避免重复创建
    try {
      const existingMessages = getChatMessages(1);
      if (existingMessages && existingMessages.length > 0) {
        console.log('⚠️ [gameInitializer] 1层消息已存在，跳过创建（仍返回 promptContent 供 generate 使用）');
        setTimeout(async () => {
          try {
            const { checkAndUpdateChronicle } = await import('./chronicleUpdater');
            await new Promise(resolve => setTimeout(resolve, 500));
            await checkAndUpdateChronicle();
          } catch (error) {
            console.error('❌ [gameInitializer] 更新编年史失败:', error);
          }
        }, 500);
        return { success: true, promptContent };
      }
    } catch (err) {
      // 1层不存在，继续创建
    }

    // 设置创建标志
    isCreatingOpening = true;

    // 获取0层的data（携带变量）
    let layer0Data: MvuData = { stat_data: {}, display_data: {}, delta_data: {} };
    try {
      const mvuData = Mvu.getMvuData({ type: 'message', message_id: 0 });
      if (mvuData && mvuData.stat_data) {
        layer0Data = mvuData;
      } else {
        console.warn('⚠️ [gameInitializer] 0层MVU数据的 stat_data 不存在，使用空对象');
      }
    } catch (err) {
      console.warn('⚠️ [gameInitializer] 获取0层MVU数据失败，尝试从getVariables读取', err);
      try {
        const vars = getVariables({ type: 'message', message_id: 0 });
        if (vars && vars.stat_data) {
          layer0Data = {
            stat_data: vars.stat_data || {},
            display_data: vars.display_data || {},
            delta_data: vars.delta_data || {},
          };
        } else {
          console.warn('⚠️ [gameInitializer] 0层变量的 stat_data 不存在，使用空对象');
        }
      } catch (err2) {
        console.warn('⚠️ [gameInitializer] 获取0层变量失败，使用空对象', err2);
      }
    }

    // 创建user消息请求AI生成初始内容
    await createChatMessages(
      [
        {
          role: 'user',
          message: promptContent,
          data: layer0Data,
        },
      ],
      {
        refresh: 'none',
      },
    );

    console.log('✅ [gameInitializer] 已创建开局请求消息，等待AI生成初始数据...');
    console.log('📝 [gameInitializer] 提示词内容预览:', promptContent.substring(0, 200) + '...');

    // 重置创建标志
    isCreatingOpening = false;
    return { success: true, promptContent };
  } catch (error) {
    console.error('❌ [gameInitializer] 创建开局介绍楼层失败:', error);
    isCreatingOpening = false;
    return { success: false };
  }
}

/**
 * 管理世界书条目
 * 根据玩家选择的配置启用/禁用对应的世界书条目
 */
async function manageWorldbookEntries(formData: OpeningFormData): Promise<void> {
  try {
    const worldbookName = '规则系统'; // 根据实际情况修改
    let entries: any[];

    try {
      entries = await getWorldbook(worldbookName);
    } catch (err) {
      console.warn('⚠️ [gameInitializer] 世界书不存在或为空:', err);
      return;
    }

    if (!entries || entries.length === 0) {
      console.warn('⚠️ [gameInitializer] 世界书条目为空');
      return;
    }

    // 根据配置更新条目启用状态
    const updatedEntries = entries.map(entry => {
      // 根据启用选项决定是否启用条目
      if (entry.title?.includes('世界规则') && !formData.enableWorldRules) {
        return { ...entry, enable: false };
      }
      if (entry.title?.includes('区域规则') && !formData.enableRegionalRules) {
        return { ...entry, enable: false };
      }
      if (entry.title?.includes('个人规则') && !formData.enablePersonalRules) {
        return { ...entry, enable: false };
      }
      return entry;
    });

    await replaceWorldbook(worldbookName, updatedEntries, { render: 'debounced' });
    console.log('✅ [gameInitializer] 世界书条目更新完成');
  } catch (error) {
    console.error('❌ [gameInitializer] 管理世界书条目失败:', error);
    throw error;
  }
}

/**
 * 重置游戏（用于重新开始）
 * 清除0层变量并重新开始
 */
export async function resetGame(): Promise<boolean> {
  try {
    // 重置0层变量
    await replaceVariables(
      {
        stat_data: {},
        display_data: {},
        delta_data: {},
      },
      { type: 'message', message_id: 0 },
    );

    console.log('✅ [gameInitializer] 游戏已重置');
    return true;
  } catch (error) {
    console.error('❌ [gameInitializer] 重置游戏失败:', error);
    return false;
  }
}

/**
 * 检查是否是新游戏（0层且无1层消息）
 */
export function isNewGame(): boolean {
  try {
    const lastMessageId = getLastMessageId();
    if (lastMessageId > 0) {
      return false;
    }

    // 检查0层是否有数据
    try {
      const vars = getVariables({ type: 'message', message_id: 0 });
      if (vars && vars.stat_data && Object.keys(vars.stat_data).length > 0) {
        return false;
      }
    } catch (err) {
      // 0层变量不存在，认为是新游戏
    }

    return true;
  } catch (error) {
    console.error('❌ [gameInitializer] 检查游戏状态失败:', error);
    return true;
  }
}
