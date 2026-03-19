<template>
  <div class="settings-panel" :class="{ dark: isDarkMode, light: !isDarkMode }">
    <div class="settings-section">
      <h3 class="section-title">
        <i class="fa-solid fa-robot"></i>
        输出模式设置
      </h3>

      <div class="mode-intro">
        <p class="intro-text">选择AI生成方式，根据你的需求优化性能和输出质量。</p>
      </div>

      <!-- 模式选择卡片 -->
      <div class="mode-cards">
        <div
          class="mode-card"
          :class="{ active: outputMode === 'single', dark: isDarkMode, light: !isDarkMode }"
          @click="selectMode('single')"
        >
          <div class="mode-header">
            <div class="mode-icon">
              <i class="fa-solid fa-microchip"></i>
            </div>
            <div class="mode-info">
              <h4 class="mode-title">单API模式</h4>
              <span class="mode-badge">默认</span>
            </div>
            <div class="mode-radio">
              <div class="radio-circle" :class="{ checked: outputMode === 'single' }">
                <i v-if="outputMode === 'single'" class="fa-solid fa-check"></i>
              </div>
            </div>
          </div>
          <div class="mode-body">
            <p class="mode-desc">一次输出完整剧情 + 变量更新</p>
            <ul class="mode-features">
              <li><i class="fa-solid fa-check"></i> 简单直接，适合大多数场景</li>
              <li><i class="fa-solid fa-check"></i> 无需额外配置</li>
              <li><i class="fa-solid fa-check"></i> 使用世界书变量规则</li>
            </ul>
          </div>
        </div>

        <div
          class="mode-card"
          :class="{ active: outputMode === 'dual', dark: isDarkMode, light: !isDarkMode }"
          @click="selectMode('dual')"
        >
          <div class="mode-header">
            <div class="mode-icon dual">
              <i class="fa-solid fa-network-wired"></i>
            </div>
            <div class="mode-info">
              <h4 class="mode-title">双API模式</h4>
              <span class="mode-badge advanced">高级</span>
            </div>
            <div class="mode-radio">
              <div class="radio-circle" :class="{ checked: outputMode === 'dual' }">
                <i v-if="outputMode === 'dual'" class="fa-solid fa-check"></i>
              </div>
            </div>
          </div>
          <div class="mode-body">
            <p class="mode-desc">主API输出剧情，第二API单独处理变量</p>
            <ul class="mode-features">
              <li><i class="fa-solid fa-bolt"></i> 变量更新更精准</li>
              <li><i class="fa-solid fa-tachograph"></i> 可使用轻量级模型</li>
              <li><i class="fa-solid fa-clock"></i> 更快响应速度</li>
            </ul>
          </div>
        </div>
      </div>

      <!-- 模式详细说明 -->
      <div class="mode-details" v-if="outputMode === 'single'">
        <div class="detail-card" :class="{ dark: isDarkMode, light: !isDarkMode }">
          <h5><i class="fa-solid fa-circle-info"></i> 单API模式工作原理</h5>
          <p>主API负责生成完整的游戏剧情，同时按照世界书中定义的变量规则和格式输出变量更新。</p>
          <p>此模式下需要启用以下世界书条目：</p>
          <ul>
            <li>变量更新规则</li>
            <li>变量列表</li>
            <li>变量输出格式</li>
            <li>单API正文格式</li>
          </ul>
        </div>
      </div>

      <div class="mode-details" v-if="outputMode === 'dual'">
        <div class="detail-card" :class="{ dark: isDarkMode, light: !isDarkMode }">
          <h5><i class="fa-solid fa-circle-info"></i> 双API模式工作原理</h5>
          <p>主API仅负责生成游戏剧情（&lt;maintext&gt;部分），不处理变量更新。</p>
          <p>当主API生成完成后，将&lt;maintext&gt;内容发送给第二API，由其按照变量规则生成&lt;UpdateVariable&gt;部分。</p>
          <p>第二API上下文更短、任务更单一，因此可以使用更轻量级的模型，获得更快更精准的变量更新。</p>
        </div>

        <!-- 世界书状态提示 -->
        <div class="worldbook-status" :class="{ dark: isDarkMode, light: !isDarkMode, updating: isUpdatingWorldbook }">
          <div class="status-header">
            <i :class="isUpdatingWorldbook ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-book'"></i>
            <span>世界书状态</span>
          </div>
          <div class="status-list">
            <div class="status-item disabled">
              <i class="fa-solid fa-eye-slash"></i>
              <span>变量更新规则（已关闭）</span>
            </div>
            <div class="status-item disabled">
              <i class="fa-solid fa-eye-slash"></i>
              <span>变量列表（已关闭）</span>
            </div>
            <div class="status-item disabled">
              <i class="fa-solid fa-eye-slash"></i>
              <span>变量输出格式（已关闭）</span>
            </div>
            <div class="status-item disabled">
              <i class="fa-solid fa-eye-slash"></i>
              <span>单API正文格式（已关闭）</span>
            </div>
            <div class="status-item enabled">
              <i class="fa-solid fa-eye"></i>
              <span>多API正文格式（已启用）</span>
            </div>
          </div>
          <p class="status-hint">选择双API模式后，相关世界书条目会自动切换</p>
        </div>
      </div>
    </div>

    <!-- 第二API配置面板（仅在双API模式显示） -->
    <div v-if="outputMode === 'dual'" class="settings-section secondary-api-section">
      <h3 class="section-title">
        <i class="fa-solid fa-server"></i>
        第二API配置
      </h3>

      <div class="api-config-form" :class="{ dark: isDarkMode, light: !isDarkMode }">
        <!-- API URL -->
        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-link"></i>
            API URL
          </label>
          <input
            v-model="secondaryApi.url"
            type="text"
            class="form-input"
            placeholder="https://api.example.com/v1/chat/completions"
            @blur="saveApiConfig"
          />
          <p class="form-hint">兼容 OpenAI 格式的 API 地址</p>
        </div>

        <!-- API Key -->
        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-key"></i>
            API Key
          </label>
          <div class="password-input-wrapper">
            <input
              v-model="secondaryApi.key"
              :type="showApiKey ? 'text' : 'password'"
              class="form-input"
              placeholder="输入你的 API Key"
              @blur="saveApiConfig"
            />
            <button
              class="toggle-password"
              @click="showApiKey = !showApiKey"
              :title="showApiKey ? '隐藏' : '显示'"
            >
              <i :class="showApiKey ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'"></i>
            </button>
          </div>
          <p class="form-hint">你的 API 密钥将被安全存储在本地</p>
        </div>

        <!-- 模型选择 -->
        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-brain"></i>
            模型选择
          </label>
          <div class="model-select-wrapper">
            <input
              v-model="secondaryApi.model"
              type="text"
              class="form-input"
              placeholder="输入模型名称（如 gpt-3.5-turbo）"
              @blur="saveApiConfig"
            />
            <button
              class="fetch-models-btn"
              @click="fetchAvailableModels"
              :disabled="isFetchingModels || !secondaryApi.url"
              :title="!secondaryApi.url ? '请先配置 API URL' : '获取可用模型列表'"
            >
              <i :class="isFetchingModels ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-list'"></i>
              <span>{{ isFetchingModels ? '获取中...' : '获取模型' }}</span>
            </button>
          </div>

          <!-- 模型列表下拉 -->
          <div v-if="availableModels.length > 0" class="model-list-dropdown">
            <div class="dropdown-header">可用模型（点击选择）：</div>
            <div class="model-options">
              <button
                v-for="model in availableModels"
                :key="model"
                class="model-option"
                :class="{ active: secondaryApi.model === model, dark: isDarkMode, light: !isDarkMode }"
                @click="selectModel(model)"
              >
                {{ model }}
              </button>
            </div>
          </div>

          <p class="form-hint">推荐使用轻量级模型（如 gpt-3.5-turbo、claude-haiku）</p>
        </div>

        <!-- 最大重试次数 -->
        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-rotate"></i>
            最大重试次数
          </label>
          <div class="range-input-wrapper">
            <input
              v-model.number="secondaryApi.maxRetries"
              type="range"
              min="0"
              max="10"
              step="1"
              class="range-input"
              @change="saveApiConfig"
            />
            <span class="range-value">{{ secondaryApi.maxRetries }} 次</span>
          </div>
          <p class="form-hint">当第二API请求失败时的自动重试次数（0-10）</p>
        </div>

        <!-- 连接测试 -->
        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-plug"></i>
            连接测试
          </label>
          <div class="test-connection-wrapper">
            <button
              class="test-btn"
              @click="testConnection"
              :disabled="isTestingConnection || !secondaryApi.url"
              :title="!secondaryApi.url ? '请先配置 API URL' : '测试 API 连接'"
            >
              <i :class="isTestingConnection ? 'fa-solid fa-spinner fa-spin' : 'fa-solid fa-plug'"></i>
              <span>{{ isTestingConnection ? '测试中...' : '测试连接' }}</span>
            </button>

            <div
              v-if="connectionStatus"
              class="connection-status"
              :class="{ success: connectionStatus === 'success', error: connectionStatus === 'error' }"
            >
              <i :class="connectionStatus === 'success' ? 'fa-solid fa-check-circle' : 'fa-solid fa-times-circle'"></i>
              <span>{{ connectionMessage }}</span>
            </div>
          </div>
        </div>

        <!-- 第二API任务说明 -->
        <div class="api-tasks">
          <h5><i class="fa-solid fa-list-check"></i> 第二API任务配置</h5>
          <div class="task-list">
            <div class="task-item">
              <label class="task-checkbox">
                <input
                  v-model="secondaryApi.tasks.includeVariableUpdate"
                  type="checkbox"
                  @change="saveApiConfig"
                />
                <span class="checkmark"></span>
                <span class="task-label">变量更新（UpdateVariable）</span>
              </label>
              <p class="task-desc">根据正文内容更新游戏变量</p>
            </div>
            <div class="task-item">
              <label class="task-checkbox">
                <input
                  v-model="secondaryApi.tasks.includeWorldTrend"
                  type="checkbox"
                  @change="saveApiConfig"
                />
                <span class="checkmark"></span>
                <span class="task-label">世界大势更新</span>
              </label>
              <p class="task-desc">更新世界观相关的宏观数据</p>
            </div>
            <div class="task-item">
              <label class="task-checkbox">
                <input
                  v-model="secondaryApi.tasks.includeResidentLife"
                  type="checkbox"
                  @change="saveApiConfig"
                />
                <span class="checkmark"></span>
                <span class="task-label">居民生活更新</span>
              </label>
              <p class="task-desc">更新NPC状态和事件</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 界面尺寸/缩放（响应式 + 桌面适配） -->
    <div class="settings-section layout-section">
      <h3 class="section-title">
        <i class="fa-solid fa-up-right-and-down-left-from-center"></i>
        界面尺寸与缩放
      </h3>

      <div class="api-config-form" :class="{ dark: isDarkMode, light: !isDarkMode }">
        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-magnifying-glass"></i>
            UI 缩放（字号/间距）
          </label>
          <div class="range-input-wrapper">
            <input
              v-model.number="uiLayout.scale"
              type="range"
              min="0.8"
              max="1.3"
              step="0.05"
              class="range-input"
              @input="saveSettings"
            />
            <span class="range-value">{{ uiLayout.scale.toFixed(2) }}</span>
          </div>
          <p class="form-hint">调小更紧凑，调大更易读。</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-arrows-left-right"></i>
            最大宽度（桌面）
          </label>
          <div class="range-input-wrapper">
            <input
              v-model.number="uiLayout.maxWidth"
              type="range"
              min="900"
              max="1800"
              step="50"
              class="range-input"
              @input="saveSettings"
            />
            <span class="range-value">{{ uiLayout.maxWidth }}px</span>
          </div>
          <p class="form-hint">限制整体宽度，避免宽屏过于稀疏。</p>
        </div>

        <div class="form-group">
          <label class="form-label">
            <i class="fa-solid fa-arrows-up-down"></i>
            高度模式
          </label>
          <p class="form-hint">当前版本已固定界面高度（600px），无需切换模式。</p>
        </div>
      </div>
    </div>

    <!-- 保存成功提示 -->
    <div v-if="showSaveSuccess" class="save-success-toast">
      <i class="fa-solid fa-check-circle"></i>
      <span>设置已保存</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { OutputMode, SecondaryApiConfig } from '../types';
import { normalizeOpenAiUrl } from '../utils/openaiUrl';

const props = defineProps<{
  isDarkMode: boolean;
}>();

const emit = defineEmits<{
  (e: 'modeChange', mode: OutputMode): void;
  (e: 'updateWorldbook', mode: OutputMode): void;
  (e: 'layoutChange', layout: UiLayoutSettings): void;
}>();

// 输出模式
const outputMode = ref<OutputMode>('single');
const isUpdatingWorldbook = ref(false);

// 第二API配置
const secondaryApi = ref<SecondaryApiConfig>({
  url: '',
  key: '',
  model: '',
  maxRetries: 3,
  tasks: {
    includeVariableUpdate: true,
    includeWorldTrend: false,
    includeResidentLife: false,
  },
});

const showApiKey = ref(false);
const isFetchingModels = ref(false);
const isTestingConnection = ref(false);
const availableModels = ref<string[]>([]);
const connectionStatus = ref<'success' | 'error' | null>(null);
const connectionMessage = ref('');
const showSaveSuccess = ref(false);

type UiLayoutSettings = {
  scale: number; // 0.8 ~ 1.3
  maxWidth: number; // px
  heightMode: 'fit' | 'custom';
  maxHeight: number; // px (custom)
};

const uiLayout = ref<UiLayoutSettings>({
  scale: 1,
  maxWidth: 1400,
  heightMode: 'fit',
  maxHeight: 850,
});

// 从变量存储加载设置
onMounted(async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    const { readGameData } = await import('../utils/variableReader');
    const gameData = await readGameData();

    // 加载输出模式
    if (gameData.player?.settings?.outputMode) {
      outputMode.value = gameData.player.settings.outputMode;
    }

    // 加载第二API配置
    if (gameData.player?.settings?.secondaryApi) {
      secondaryApi.value = {
        ...secondaryApi.value,
        ...gameData.player.settings.secondaryApi,
      };
    }

    // 加载界面布局设置
    if (gameData.player?.settings?.uiLayout) {
      uiLayout.value = {
        ...uiLayout.value,
        ...gameData.player.settings.uiLayout,
      };
    }
  } catch (error) {
    console.warn('加载设置失败:', error);
  }
}

// 保存设置到变量存储
async function saveSettings() {
  try {
    const { updateStatData } = await import('../utils/dialogAndVariable');
    updateStatData((stat) => {
      if (!stat.player) {
        stat.player = { name: '玩家', settings: {} };
      }
      if (!stat.player.settings) {
        stat.player.settings = {};
      }
      stat.player.settings.outputMode = outputMode.value;
      stat.player.settings.secondaryApi = secondaryApi.value;
      stat.player.settings.uiLayout = uiLayout.value;
      return stat;
    });

    // 即时通知父组件应用布局
    emit('layoutChange', uiLayout.value);

    // 显示保存成功提示
    showSaveSuccess.value = true;
    setTimeout(() => {
      showSaveSuccess.value = false;
    }, 2000);
  } catch (error) {
    console.error('保存设置失败:', error);
    toastr.error('设置保存失败');
  }
}

// 选择输出模式
async function selectMode(mode: OutputMode) {
  if (outputMode.value === mode) return;

  const oldMode = outputMode.value;
  outputMode.value = mode;

  // 保存设置
  await saveSettings();

  // 通知父组件模式变更
  emit('modeChange', mode);

  // 如果是切换到双API模式，更新世界书
  if (mode === 'dual') {
    isUpdatingWorldbook.value = true;
    try {
      emit('updateWorldbook', mode);
      toastr.success('已切换到双API模式，世界书条目已更新');
    } catch (error) {
      console.error('更新世界书失败:', error);
      toastr.error('世界书更新失败');
    } finally {
      isUpdatingWorldbook.value = false;
    }
  } else if (oldMode === 'dual' && mode === 'single') {
    // 切换回单API模式，恢复世界书
    isUpdatingWorldbook.value = true;
    try {
      emit('updateWorldbook', mode);
      toastr.success('已切换到单API模式，世界书条目已恢复');
    } catch (error) {
      console.error('更新世界书失败:', error);
    } finally {
      isUpdatingWorldbook.value = false;
    }
  }
}

// 保存API配置
function saveApiConfig() {
  saveSettings();
}

// 获取可用模型列表
async function fetchAvailableModels() {
  if (!secondaryApi.value.url) {
    toastr.warning('请先配置 API URL');
    return;
  }

  isFetchingModels.value = true;
  availableModels.value = [];

  try {
    const normalized = normalizeOpenAiUrl(secondaryApi.value.url);
    const errors: string[] = [];

    let data: any = null;
    let usedUrl: string | null = null;

    for (const url of normalized.modelsUrlCandidates) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${secondaryApi.value.key}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          errors.push(`${url} -> HTTP ${response.status}: ${response.statusText}`);
          // 404 很常见：该服务不提供 models endpoint，继续尝试下一个候选
          if (response.status === 404) continue;
          // 其它状态也继续尝试下一个候选，最后汇总报错
          continue;
        }

        data = await response.json();
        usedUrl = url;
        break;
      } catch (e) {
        errors.push(`${url} -> ${String(e)}`);
      }
    }

    if (!data || !usedUrl) {
      const hint = errors.some((e) => /Failed to fetch/i.test(e))
        ? '（可能是 CORS/HTTPS 混合内容/证书问题导致浏览器拦截）'
        : '（可能该服务不支持 /v1/models 接口）';
      throw new Error(`所有候选模型列表接口都失败了 ${hint}\n${errors.join('\n')}`);
    }

    const list = Array.isArray(data?.data) ? data.data
      : Array.isArray(data?.models) ? data.models
      : null;

    if (!list) {
      throw new Error(`响应格式不正确（已使用 ${usedUrl}）`);
    }

    availableModels.value = list
      .map((m: any) => m?.id || m?.model || m?.name)
      .filter((s: any) => typeof s === 'string' && s.trim().length > 0)
      .sort();

    if (availableModels.value.length === 0) {
      throw new Error(`模型列表为空（已使用 ${usedUrl}）`);
    }

    toastr.success(`获取到 ${availableModels.value.length} 个可用模型`);
  } catch (error) {
    console.error('获取模型列表失败:', error);
    toastr.error('获取模型列表失败: ' + String(error));
  } finally {
    isFetchingModels.value = false;
  }
}

// 选择模型
function selectModel(model: string) {
  secondaryApi.value.model = model;
  saveApiConfig();
}

// 测试API连接
async function testConnection() {
  if (!secondaryApi.value.url) {
    toastr.warning('请先配置 API URL');
    return;
  }

  isTestingConnection.value = true;
  connectionStatus.value = null;

  try {
    const normalized = normalizeOpenAiUrl(secondaryApi.value.url);
    const response = await fetch(normalized.chatCompletionsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secondaryApi.value.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: secondaryApi.value.model || 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 1,
      }),
    });

    if (response.ok) {
      connectionStatus.value = 'success';
      connectionMessage.value = '连接成功！API 配置正确';
      toastr.success('API 连接测试成功');
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('连接测试失败:', error);
    connectionStatus.value = 'error';
    connectionMessage.value = '连接失败: ' + String(error);
    toastr.error('API 连接测试失败');
  } finally {
    isTestingConnection.value = false;
  }
}
</script>

<style lang="scss" scoped>
.settings-panel {
  padding: 24px;
  min-height: 100%;
}

.settings-section {
  margin-bottom: 32px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;

  i {
    font-size: 20px;
    color: #3b82f6;
  }
}

.dark .section-title {
  color: #f4f4f5;
}

.light .section-title {
  color: #18181b;
}

.mode-intro {
  margin-bottom: 20px;

  .intro-text {
    font-size: 14px;
    line-height: 1.6;
  }
}

.dark .mode-intro .intro-text {
  color: #a1a1aa;
}

.light .mode-intro .intro-text {
  color: #71717a;
}

// 模式选择卡片
.mode-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.mode-card {
  border-radius: 12px;
  border: 2px solid transparent;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
  }

  &.active {
    border-color: #3b82f6;
  }
}

.dark .mode-card {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
  }

  &.active {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3b82f6;
  }
}

.light .mode-card {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  &:hover {
    border-color: rgba(0, 0, 0, 0.15);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  &.active {
    background: rgba(59, 130, 246, 0.05);
    border-color: #3b82f6;
  }
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.mode-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  background: rgba(59, 130, 246, 0.15);
  color: #3b82f6;

  &.dual {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }
}

.mode-info {
  flex: 1;
}

.mode-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}

.dark .mode-title {
  color: #f4f4f5;
}

.light .mode-title {
  color: #18181b;
}

.mode-badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: #a1a1aa;

  &.advanced {
    background: rgba(168, 85, 247, 0.15);
    color: #a855f7;
  }
}

.light .mode-badge {
  background: rgba(0, 0, 0, 0.05);
  color: #71717a;
}

.mode-radio {
  .radio-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;

    i {
      font-size: 12px;
    }
  }
}

.dark .mode-radio .radio-circle {
  border-color: rgba(255, 255, 255, 0.2);
  color: #3b82f6;

  &.checked {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
}

.light .mode-radio .radio-circle {
  border-color: rgba(0, 0, 0, 0.2);
  color: #3b82f6;

  &.checked {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
}

.mode-body {
  .mode-desc {
    font-size: 14px;
    margin-bottom: 12px;
    line-height: 1.5;
  }
}

.dark .mode-body .mode-desc {
  color: #a1a1aa;
}

.light .mode-body .mode-desc {
  color: #71717a;
}

.mode-features {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;

    i {
      font-size: 12px;
      width: 16px;
      text-align: center;
    }
  }
}

.dark .mode-features li {
  color: #a1a1aa;

  i {
    color: #22c55e;
  }
}

.light .mode-features li {
  color: #71717a;

  i {
    color: #16a34a;
  }
}

// 模式详细说明
.mode-details {
  margin-top: 24px;
}

.detail-card {
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 16px;

  h5 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;

    i {
      color: #3b82f6;
    }
  }

  p {
    font-size: 13px;
    line-height: 1.6;
    margin-bottom: 12px;
  }

  ul {
    margin: 0;
    padding-left: 20px;

    li {
      font-size: 13px;
      margin-bottom: 6px;
    }
  }
}

.dark .detail-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);

  h5 {
    color: #f4f4f5;
  }

  p, li {
    color: #a1a1aa;
  }
}

.light .detail-card {
  background: #f9fafb;
  border: 1px solid rgba(0, 0, 0, 0.1);

  h5 {
    color: #18181b;
  }

  p, li {
    color: #71717a;
  }
}

// 世界书状态
.worldbook-status {
  border-radius: 10px;
  padding: 16px;

  &.updating {
    opacity: 0.7;
  }
}

.dark .worldbook-status {
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.2);
}

.light .worldbook-status {
  background: rgba(168, 85, 247, 0.05);
  border: 1px solid rgba(168, 85, 247, 0.15);
}

.status-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;

  i {
    color: #a855f7;
  }
}

.dark .status-header {
  color: #f4f4f5;
}

.light .status-header {
  color: #18181b;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;

  i {
    font-size: 12px;
    width: 16px;
    text-align: center;
  }

  &.disabled {
    i {
      color: #ef4444;
    }
  }

  &.enabled {
    i {
      color: #22c55e;
    }
  }
}

.dark .status-item {
  color: #a1a1aa;
}

.light .status-item {
  color: #71717a;
}

.status-hint {
  margin-top: 12px;
  font-size: 12px;
  font-style: italic;
}

.dark .status-hint {
  color: #71717a;
}

.light .status-hint {
  color: #a1a1aa;
}

// 第二API配置表单
.secondary-api-section {
  border-top: 1px solid;
  padding-top: 24px;
}

.dark .secondary-api-section {
  border-color: rgba(255, 255, 255, 0.1);
}

.light .secondary-api-section {
  border-color: rgba(0, 0, 0, 0.1);
}

.api-config-form {
  border-radius: 12px;
  padding: 20px;
}

.dark .api-config-form {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.light .api-config-form {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;

  i {
    font-size: 14px;
    color: #3b82f6;
  }
}

.dark .form-label {
  color: #e4e4e7;
}

.light .form-label {
  color: #374151;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: all 0.2s;

  &:focus {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
  }
}

.dark .form-input {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;

  &::placeholder {
    color: #71717a;
  }

  &:focus {
    border-color: #3b82f6;
  }
}

.light .form-input {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #18181b;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #3b82f6;
  }
}

.form-hint {
  font-size: 12px;
  margin-top: 6px;
  margin-bottom: 0;
}

.dark .form-hint {
  color: #71717a;
}

.light .form-hint {
  color: #9ca3af;
}

// 密码输入
.password-input-wrapper {
  position: relative;

  .form-input {
    padding-right: 44px;
  }

  .toggle-password {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 4px;
    cursor: pointer;
    font-size: 14px;
    color: #71717a;
    transition: color 0.2s;

    &:hover {
      color: #3b82f6;
    }
  }
}

// 模型选择
.model-select-wrapper {
  display: flex;
  gap: 8px;

  .form-input {
    flex: 1;
  }

  .fetch-models-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    border-radius: 8px;
    border: none;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    i {
      font-size: 12px;
    }
  }
}

.dark .model-select-wrapper .fetch-models-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #e4e4e7;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.15);
  }
}

.light .model-select-wrapper .fetch-models-btn {
  background: #f3f4f6;
  color: #374151;

  &:hover:not(:disabled) {
    background: #e5e7eb;
  }
}

.model-list-dropdown {
  margin-top: 10px;
  border-radius: 8px;
  border: 1px solid;
  overflow: hidden;
}

.dark .model-list-dropdown {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.1);
}

.light .model-list-dropdown {
  background: #f9fafb;
  border-color: rgba(0, 0, 0, 0.1);
}

.dropdown-header {
  padding: 10px 14px;
  font-size: 12px;
  font-weight: 500;
  border-bottom: 1px solid;
}

.dark .dropdown-header {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: #a1a1aa;
}

.light .dropdown-header {
  background: #f3f4f6;
  border-color: rgba(0, 0, 0, 0.1);
  color: #6b7280;
}

.model-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}

.model-option {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}

.dark .model-option {
  border-color: rgba(255, 255, 255, 0.15);
  color: #a1a1aa;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  &.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
}

.light .model-option {
  border-color: rgba(0, 0, 0, 0.15);
  color: #6b7280;

  &:hover {
    border-color: #3b82f6;
    color: #3b82f6;
  }

  &.active {
    background: #3b82f6;
    border-color: #3b82f6;
    color: #fff;
  }
}

// 范围输入
.range-input-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;

  .range-input {
    flex: 1;
    -webkit-appearance: none;
    height: 6px;
    border-radius: 3px;
    outline: none;

    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
    }
  }

  .range-value {
    font-size: 14px;
    font-weight: 500;
    min-width: 60px;
    text-align: right;
  }
}

.dark .range-input-wrapper {
  .range-input {
    background: rgba(255, 255, 255, 0.1);

    &::-webkit-slider-thumb {
      background: #3b82f6;

      &:hover {
        background: #60a5fa;
        transform: scale(1.1);
      }
    }
  }

  .range-value {
    color: #e4e4e7;
  }
}

.light .range-input-wrapper {
  .range-input {
    background: rgba(0, 0, 0, 0.1);

    &::-webkit-slider-thumb {
      background: #3b82f6;

      &:hover {
        background: #2563eb;
        transform: scale(1.1);
      }
    }
  }

  .range-value {
    color: #374151;
  }
}

// 连接测试
test-connection-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.test-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  i {
    font-size: 14px;
  }
}

.dark .test-btn {
  background: #3b82f6;
  color: #fff;

  &:hover:not(:disabled) {
    background: #60a5fa;
  }
}

.light .test-btn {
  background: #3b82f6;
  color: #fff;

  &:hover:not(:disabled) {
    background: #2563eb;
  }
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;

  i {
    font-size: 16px;
  }

  &.success {
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
  }

  &.error {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }
}

// 任务配置
.api-tasks {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid;

  h5 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 16px;

    i {
      color: #3b82f6;
    }
  }
}

.dark .api-tasks {
  border-color: rgba(255, 255, 255, 0.1);

  h5 {
    color: #f4f4f5;
  }
}

.light .api-tasks {
  border-color: rgba(0, 0, 0, 0.1);

  h5 {
    color: #18181b;
  }
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  .task-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    cursor: pointer;

    input {
      display: none;
    }

    .checkmark {
      width: 18px;
      height: 18px;
      border-radius: 4px;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      flex-shrink: 0;

      &:after {
        content: '';
        font-family: 'Font Awesome 6 Free';
        font-weight: 900;
        font-size: 10px;
      }
    }

    input:checked + .checkmark {
      background: #3b82f6;
      border-color: #3b82f6;

      &:after {
        content: '\f00c';
        color: #fff;
      }
    }

    .task-label {
      font-size: 14px;
      font-weight: 500;
    }
  }

  .task-desc {
    margin: 4px 0 0 28px;
    font-size: 12px;
  }
}

.dark .task-item {
  .task-checkbox {
    .checkmark {
      border-color: rgba(255, 255, 255, 0.3);
    }

    .task-label {
      color: #e4e4e7;
    }
  }

  .task-desc {
    color: #71717a;
  }
}

.light .task-item {
  .task-checkbox {
    .checkmark {
      border-color: rgba(0, 0, 0, 0.3);
    }

    .task-label {
      color: #374151;
    }
  }

  .task-desc {
    color: #9ca3af;
  }
}

// 保存成功提示
.save-success-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  animation: slideUp 0.3s ease;

  i {
    font-size: 16px;
  }
}

.toggle-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.mode-pill {
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-pill.active {
  border-color: rgba(96, 165, 250, 0.8);
  box-shadow: 0 0 0 2px rgba(96, 165, 250, 0.18);
}

.light .mode-pill {
  border-color: rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.04);
  color: #27272a;
}

.light .mode-pill.active {
  border-color: rgba(37, 99, 235, 0.75);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.14);
}

.dark .save-success-toast {
  background: rgba(34, 197, 94, 0.9);
  color: #fff;
}

.light .save-success-toast {
  background: #22c55e;
  color: #fff;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
</style>
