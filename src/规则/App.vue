<template>
  <div
    id="app-root"
    class="rule-modifier"
    :class="{ 'dark': isDarkMode, 'light': !isDarkMode }"
  >
    <!-- Sidebar -->
    <nav class="sidebar">
      <div class="sidebar-top">
        <div class="logo">
          <i class="fa-solid fa-sparkles"></i>
          <span class="logo-text">RULE.MODIFIER</span>
        </div>
        <div class="nav-items">
          <button
            v-for="item in navItems"
            :key="item.id"
            :id="`nav-${item.id}`"
            class="nav-btn"
            :class="{ active: activeTab === item.id }"
            @click.stop="toggleTab(item.id)"
          >
            <span v-if="activeTab === item.id" class="active-indicator"></span>
            <i :class="item.icon"></i>
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </div>
      </div>
      <div class="sidebar-bottom">
        <button class="nav-btn" @click="isDarkMode = !isDarkMode">
          <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
          <span class="nav-label">{{ isDarkMode ? '浅色模式' : '深色模式' }}</span>
        </button>
        <button id="nav-settings" class="nav-btn">
          <i class="fa-solid fa-gear"></i>
          <span class="nav-label">系统设置</span>
        </button>
      </div>
    </nav>

    <!-- Middle Content (Collapsible) -->
    <aside v-if="activeTab" class="middle-panel" :class="{ dark: isDarkMode, light: !isDarkMode }">
      <div class="panel-inner">
        <header class="panel-header">
          <h1>{{ panelTitle }}</h1>
          <button class="close-btn" @click.stop="activeTab = null">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </header>
        <div class="panel-content">
          <Transition name="fade" mode="out-in">
            <div :key="activeTab">
              <CharacterPanel v-if="activeTab === 'character'" @open-modal="openModal" />
              <WorldRulesPanel v-else-if="activeTab === 'world_rules'" @open-modal="openModal" />
              <RegionalRulesPanel v-else-if="activeTab === 'regional_rules'" @open-modal="openModal" />
              <PersonalRulesPanel v-else-if="activeTab === 'personal_rules'" @open-modal="openModal" />
            </div>
          </Transition>
        </div>
      </div>
    </aside>

    <!-- Right Panel: LLM Interaction (Main Area) -->
    <main class="main-panel" :class="{ dark: isDarkMode, light: !isDarkMode }">
      <div class="main-header">
        <div class="header-title">
          <i class="fa-solid fa-message"></i>
          <h2>系统日志 / 交互</h2>
        </div>
        <button id="btn-maximize-log" class="header-btn">
          <i class="fa-solid fa-maximize"></i>
        </button>
      </div>

      <div class="log-container">
        <LogEntry
          v-for="(entry, idx) in logEntries"
          :key="idx"
          :type="entry.type"
          :time="entry.time"
          :is-dark-mode="isDarkMode"
        >
          <span v-html="entry.content"></span>
        </LogEntry>
      </div>

      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            id="llm-input"
            placeholder="输入指令或描述..."
            rows="4"
          />
          <button id="btn-send-llm" class="send-btn">
            <i class="fa-solid fa-sparkles"></i>
          </button>
        </div>
      </div>
    </main>

    <!-- Modals -->
    <Transition name="modal">
      <div v-if="isModalOpen" id="modal-overlay" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content" :class="{ dark: isDarkMode, light: !isDarkMode }">
          <div class="modal-header">
            <h2>{{ modalType.includes('add') ? '新增条目' : '编辑条目' }}</h2>
            <button id="btn-close-modal" class="close-btn" @click="closeModal">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="modal-placeholder">
              <div class="spin-icon">
                <i class="fa-solid fa-gear fa-spin"></i>
              </div>
              <h3>模态框已就绪</h3>
              <p>此处为 <code>{{ modalType }}</code> 的交互界面。具体表单内容与逻辑将在此处渲染。</p>
            </div>
          </div>
          <div class="modal-footer">
            <button id="btn-cancel-modal" class="btn-secondary" @click="closeModal">取消</button>
            <button id="btn-save-modal" class="btn-primary" @click="closeModal">保存更改</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import CharacterPanel from './components/CharacterPanel.vue';
import WorldRulesPanel from './components/WorldRulesPanel.vue';
import RegionalRulesPanel from './components/RegionalRulesPanel.vue';
import PersonalRulesPanel from './components/PersonalRulesPanel.vue';
import LogEntry from './components/LogEntry.vue';

const activeTab = ref<string | null>(null);
const isModalOpen = ref(false);
const modalType = ref('');
const isDarkMode = ref(true);

// 调试：监听 activeTab 的变化
watch(activeTab, (newVal, oldVal) => {
  console.log(`[调试] activeTab 变化: ${oldVal} -> ${newVal}`);
}, { immediate: true });

const navItems = [
  { id: 'character', icon: 'fa-solid fa-user', label: '人物属性' },
  { id: 'world_rules', icon: 'fa-solid fa-globe', label: '世界规则' },
  { id: 'regional_rules', icon: 'fa-solid fa-map', label: '区域规则' },
  { id: 'personal_rules', icon: 'fa-solid fa-user-circle', label: '个人规则' },
];

const panelTitles: Record<string, string> = {
  character: '人物属性编辑',
  world_rules: '世界规则管理',
  regional_rules: '区域规则管理',
  personal_rules: '个人规则管理',
};

const panelTitle = computed(() => panelTitles[activeTab.value || ''] || '');

const logEntries = [
  { type: 'system', time: '10:42:01', content: '世界规则 <span class="highlight">「猫娘语癖」</span> 已生效。所有女性角色的对话输出将自动附加后缀。' },
  { type: 'event', time: '10:45:22', content: '神宫寺 琉璃 进入了 <span class="highlight">「圣华女子高级中学」</span> 区域。区域规则已覆盖。' },
  { type: 'user', time: '10:46:00', content: '让琉璃去上厕所。' },
  { type: 'llm', time: '10:46:15', content: '琉璃红着脸，双腿微微夹紧。她想起了这里的规则，咬了咬下唇，屈辱地举起手："老、老师...我...我是不能憋住尿的废物小穴...请允许我去洗手间...喵..."<br><br><span class="subtext">（心理状态更新：羞耻度上升，顺从度微弱上升）</span>' },
];

// 防抖：防止短时间内重复点击
let lastClickTime = 0;
function toggleTab(tabId: string) {
  const now = Date.now();
  if (now - lastClickTime < 150) {
    // 150ms 内的重复点击忽略
    return;
  }
  lastClickTime = now;

  if (activeTab.value === tabId) {
    // 再次点击同一个 tab，关闭面板
    activeTab.value = null;
  } else {
    // 点击不同的 tab，切换到新面板
    activeTab.value = tabId;
  }
}

function openModal(type: string) {
  modalType.value = type;
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}
</script>

<style lang="scss" scoped>
.rule-modifier {
  display: flex;
  width: 100%;
  max-width: 1200px;
  max-height: 700px; // 限制最大高度
  margin: 0 auto;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;

  &.dark {
    background: #030303;
    color: #f4f4f5;
  }

  &.light {
    background: #f4f4f5;
    color: #18181b;
  }
}

// Sidebar
.sidebar {
  width: 80px;
  max-height: 700px; // 限制最大高度
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;

  @media (min-width: 1024px) {
    width: 240px;
  }
}

.dark .sidebar {
  border-color: rgba(255, 255, 255, 0.05);
}

.light .sidebar {
  border-color: rgba(0, 0, 0, 0.05);
  background: rgba(255, 255, 255, 0.6);
}

.sidebar-top {
  .logo {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    gap: 12px;
    padding: 0 24px;

    i {
      font-size: 24px;
    }

    .logo-text {
      display: none;
      font-weight: 600;
      letter-spacing: 0.15em;
      font-size: 16px;

      @media (min-width: 1024px) {
        display: block;
      }
    }
  }

  .nav-items {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.dark .sidebar-top .logo {
  border-color: rgba(255, 255, 255, 0.05);
  color: #f4f4f5;
}

.light .sidebar-top .logo {
  border-color: rgba(0, 0, 0, 0.05);
  color: #18181b;
}

.sidebar-bottom {
  padding: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dark .sidebar-bottom {
  border-color: rgba(255, 255, 255, 0.05);
}

.light .sidebar-bottom {
  border-color: rgba(0, 0, 0, 0.05);
}

.nav-btn {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 12px;
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  gap: 12px;
  width: 100%;

  i {
    font-size: 18px;
    width: 24px;
    text-align: center;
  }

  .nav-label {
    display: none;
    font-size: 14px;
    font-weight: 500;

    @media (min-width: 1024px) {
      display: block;
    }
  }

  &:hover {
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    background: rgba(255, 255, 255, 0.1);

    .active-indicator {
      position: absolute;
      left: 0;
      width: 4px;
      height: 32px;
      background: currentColor;
      border-radius: 0 4px 4px 0;
    }
  }
}

.dark .nav-btn {
  color: #a1a1aa;

  &:hover {
    color: #e4e4e7;
    background: rgba(255, 255, 255, 0.05);
  }

  &.active {
    color: #fff;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.05);
  }
}

.light .nav-btn {
  color: #71717a;

  &:hover {
    color: #18181b;
    background: rgba(0, 0, 0, 0.05);
  }

  &.active {
    color: #000;
    background: rgba(0, 0, 0, 0.05);
    box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
  }
}

// Middle Panel
.middle-panel {
  width: 700px;
  max-height: 700px; // 限制最大高度
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.3);
  z-index: 20;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.dark .middle-panel {
  background: #080808;
  border-color: rgba(255, 255, 255, 0.05);
}

.light .middle-panel {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.05);
}

.panel-inner {
  width: 700px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.02);

  h1 {
    font-size: 24px;
    font-weight: 300;
    letter-spacing: 0.05em;
  }

  .close-btn {
    padding: 8px;
    border-radius: 50%;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.dark .panel-header {
  border-color: rgba(255, 255, 255, 0.05);
  color: #fff;

  .close-btn {
    color: #a1a1aa;

    &:hover {
      color: #fff;
    }
  }
}

.light .panel-header {
  border-color: rgba(0, 0, 0, 0.05);
  color: #18181b;
  background: rgba(255, 255, 255, 0.6);

  .close-btn {
    color: #71717a;

    &:hover {
      color: #18181b;
    }
  }
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 40px;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(15px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

// Main Panel
.main-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 10;
  overflow: hidden;
  max-height: 700px; // 限制最大高度
}

.dark .main-panel {
  background: #030303;
}

.light .main-panel {
  background: #fafafa;
}

.main-header {
  height: 80px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;

  .header-title {
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      font-size: 24px;
    }

    h2 {
      font-size: 18px;
      font-weight: 500;
      letter-spacing: 0.05em;
    }
  }
}

.dark .main-header {
  border-color: rgba(255, 255, 255, 0.05);

  .header-title {
    i { color: #d4d4d8; }
    h2 { color: #fff; }
  }
}

.light .main-header {
  border-color: rgba(0, 0, 0, 0.05);

  .header-title {
    i { color: #52525b; }
    h2 { color: #18181b; }
  }
}

.header-btn {
  background: transparent;
  border: none;
  font-size: 20px;
  cursor: pointer;
  transition: color 0.2s;
}

.dark .header-btn {
  color: #71717a;

  &:hover { color: #fff; }
}

.light .header-btn {
  color: #a1a1aa;

  &:hover { color: #18181b; }
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.input-area {
  padding: 24px 32px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.dark .input-area {
  background: rgba(0, 0, 0, 0.2);
  border-color: rgba(255, 255, 255, 0.05);
}

.light .input-area {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(0, 0, 0, 0.05);
}

.input-wrapper {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;

  textarea {
    width: 100%;
    border-radius: 16px;
    padding: 16px 64px 16px 24px;
    font-size: 16px;
    resize: none;
    outline: none;
    transition: all 0.2s;

    &:focus {
      box-shadow: 0 0 0 1px currentColor;
    }
  }
}

.dark .input-wrapper textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;

  &::placeholder { color: #52525b; }

  &:focus {
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.light .input-wrapper textarea {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #18181b;

  &::placeholder { color: #a1a1aa; }

  &:focus {
    border-color: rgba(0, 0, 0, 0.2);
  }
}

.send-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 12px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 20px;
}

.dark .send-btn {
  background: rgba(255, 255, 255, 0.1);
  color: #d4d4d8;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.15);
  }
}

.light .send-btn {
  background: #18181b;
  color: #fff;

  &:hover {
    background: #27272a;
  }
}

// Modal
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(4px);
}

.modal-content {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);

  &.modal-enter-active,
  &.modal-leave-active {
    transition: all 0.3s ease;
  }

  &.modal-enter-from,
  &.modal-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
}

.dark .modal-content {
  background: #080808;
}

.light .modal-content {
  background: #fff;
  border-color: rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);

  h2 {
    font-size: 18px;
    font-weight: 500;
  }

  .close-btn {
    background: transparent;
    border: none;
    font-size: 20px;
    cursor: pointer;
    transition: color 0.2s;
  }
}

.dark .modal-header {
  border-color: rgba(255, 255, 255, 0.05);
  color: #fff;

  .close-btn {
    color: #71717a;

    &:hover { color: #fff; }
  }
}

.light .modal-header {
  border-color: rgba(0, 0, 0, 0.05);
  color: #18181b;

  .close-btn {
    color: #a1a1aa;

    &:hover { color: #18181b; }
  }
}

.modal-body {
  padding: 24px;
  min-height: 300px;
}

.modal-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  height: 100%;

  .spin-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.05);
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.1);

    i {
      font-size: 32px;
      color: #52525b;
    }
  }

  h3 {
    font-size: 16px;
    font-weight: 500;
    color: #e4e4e7;
  }

  p {
    font-size: 14px;
    color: #71717a;
    max-width: 300px;

    code {
      color: #d4d4d8;
      font-family: monospace;
    }
  }
}

.light .modal-placeholder {
  .spin-icon i { color: #a1a1aa; }
  h3 { color: #27272a; }
  p {
    color: #71717a;
    code { color: #52525b; }
  }
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.dark .modal-footer {
  border-color: rgba(255, 255, 255, 0.05);
}

.light .modal-footer {
  border-color: rgba(0, 0, 0, 0.05);
  background: rgba(0, 0, 0, 0.02);
}

.btn-secondary,
.btn-primary {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  color: #a1a1aa;
  background: transparent;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }
}

.light .btn-secondary {
  color: #71717a;

  &:hover {
    color: #18181b;
    background: rgba(0, 0, 0, 0.05);
  }
}

.btn-primary {
  color: #fff;
  background: rgba(255, 255, 255, 0.15);

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.light .btn-primary {
  color: #fff;
  background: #18181b;

  &:hover {
    background: #27272a;
  }
}
</style>
