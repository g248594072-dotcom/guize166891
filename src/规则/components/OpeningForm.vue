<template>
  <div class="opening-form" :class="{ 'dark': isDarkMode, 'light': !isDarkMode }">
    <!-- 书本容器 -->
    <div class="book-container" :class="{ 'flipping': isFlipping }">
      <!-- 封面 -->
      <div v-if="currentPage === 'cover'" class="book-page cover-page">
        <div class="book-cover">
          <div class="cover-decoration">
            <div class="cover-border">
              <div class="cover-inner">
                <div class="book-icon">
                  <i class="fa-solid fa-book-open"></i>
                </div>
                <h1 class="book-title">规则之书</h1>
                <p class="book-subtitle">Rule.Modifier</p>
                <div class="cover-divider"></div>
                <p class="book-desc">在这个世界，规则即是力量</p>
              </div>
            </div>
          </div>
          <button class="start-btn" @click="goToPage('scene')">
            <span>开始阅读</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>

      <!-- 场景选择页 -->
      <div v-else-if="currentPage === 'scene'" class="book-page content-page">
        <div class="page-header">
          <button class="nav-btn back-btn" @click="goToPage('cover')">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="page-number">第一章</span>
          <button class="nav-btn next-btn" @click="goToPage('rules')">
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div class="page-content">
          <h2 class="chapter-title">选择你的舞台</h2>
          <p class="chapter-desc">每个故事都需要一个开始的地点...</p>

          <div class="scene-grid">
            <div
              v-for="scene in sceneOptions"
              :key="scene.id"
              class="scene-card"
              :class="{ active: selectedScene?.id === scene.id }"
              @click="selectScene(scene)"
            >
              <div class="scene-icon">
                <i :class="scene.icon"></i>
              </div>
              <h3 class="scene-name">{{ scene.name }}</h3>
              <p class="scene-desc">{{ scene.desc }}</p>
            </div>
          </div>

          <div class="custom-scene">
            <label class="custom-label">或创建自定义场景</label>
            <textarea
              v-model="customSceneDesc"
              class="custom-textarea"
              placeholder="描述你想要的场景（如：一座漂浮在云端的魔法学院，学生们正在上课...）"
              rows="3"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 规则选择页 -->
      <div v-else-if="currentPage === 'rules'" class="book-page content-page">
        <div class="page-header">
          <button class="nav-btn back-btn" @click="goToPage('scene')">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="page-number">第二章</span>
          <button class="nav-btn next-btn" @click="goToPage('characters')">
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div class="page-content">
          <h2 class="chapter-title">设定世界规则</h2>
          <p class="chapter-desc">选择将在世界中生效的基础法则...</p>

          <div class="rules-section">
            <h3 class="section-title">预设规则</h3>
            <div class="rules-list">
              <label
                v-for="rule in presetRules"
                :key="rule.id"
                class="rule-item"
                :class="{ checked: selectedRules.includes(rule.id) }"
              >
                <div class="rule-checkbox">
                  <input
                    type="checkbox"
                    :value="rule.id"
                    v-model="selectedRules"
                  />
                  <span class="check-mark">
                    <i class="fa-solid fa-check"></i>
                  </span>
                </div>
                <div class="rule-info">
                  <span class="rule-name">{{ rule.name }}</span>
                  <span class="rule-desc">{{ rule.desc }}</span>
                </div>
              </label>
            </div>
          </div>

          <div class="custom-rules-section">
            <h3 class="section-title">自定义规则</h3>
            <div class="custom-rule-input">
              <input
                v-model="newRuleName"
                type="text"
                placeholder="规则名称"
                class="rule-name-input"
              />
              <textarea
                v-model="newRuleDesc"
                placeholder="规则效果描述"
                rows="2"
                class="rule-desc-input"
              ></textarea>
              <button class="add-rule-btn" @click="addCustomRule">
                <i class="fa-solid fa-plus"></i>
                添加规则
              </button>
            </div>
            <div v-if="customRules.length > 0" class="custom-rules-list">
              <div
                v-for="(rule, index) in customRules"
                :key="index"
                class="custom-rule-item"
              >
                <div class="custom-rule-info">
                  <span class="custom-rule-name">{{ rule.name }}</span>
                  <span class="custom-rule-desc">{{ rule.desc }}</span>
                </div>
                <button class="remove-btn" @click="removeCustomRule(index)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 人物添加页 -->
      <div v-else-if="currentPage === 'characters'" class="book-page content-page">
        <div class="page-header">
          <button class="nav-btn back-btn" @click="goToPage('rules')">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="page-number">第三章</span>
          <button class="nav-btn next-btn" @click="goToPage('opening_detail')">
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div class="page-content">
          <h2 class="chapter-title">添加登场角色</h2>
          <p class="chapter-desc">为你的故事添加一些重要人物...</p>

          <div class="character-form">
            <div class="form-row">
              <input
                v-model="newCharName"
                type="text"
                placeholder="角色姓名"
                class="char-name-input"
              />
              <select v-model="newCharGender" class="char-gender-select">
                <option value="female">女性</option>
                <option value="male">男性</option>
                <option value="other">其他</option>
              </select>
            </div>
            <div class="form-row">
              <textarea
                v-model="newCharDesc"
                placeholder="角色描述：外貌、性格、身份等..."
                rows="3"
                class="char-desc-input"
              ></textarea>
            </div>
            <div class="form-actions-row">
              <button class="add-char-btn" @click="addCharacter">
                <i class="fa-solid fa-user-plus"></i>
                <span>添加角色</span>
              </button>
            </div>
          </div>

          <div v-if="characters.length > 0" class="characters-list">
            <h3 class="section-title">已添加角色</h3>
            <div class="char-cards">
              <div
                v-for="(char, index) in characters"
                :key="index"
                class="char-card"
              >
                <div class="char-avatar">
                  <i :class="char.gender === 'male' ? 'fa-solid fa-user' : 'fa-solid fa-user-secret'"></i>
                </div>
                <div class="char-info">
                  <span class="char-name">{{ char.name }}</span>
                  <span class="char-desc">{{ char.desc }}</span>
                </div>
                <button class="remove-btn" @click="removeCharacter(index)">
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="empty-hint">
            <i class="fa-solid fa-users"></i>
            <p>还没有添加角色</p>
            <span>可以直接开始游戏，或添加角色丰富剧情</span>
          </div>
        </div>
      </div>

      <!-- 开场白细化页 -->
      <div v-else-if="currentPage === 'opening_detail'" class="book-page content-page">
        <div class="page-header">
          <button class="nav-btn back-btn" @click="goToPage('characters')">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="page-number">第四章</span>
          <button class="nav-btn next-btn" @click="goToPage('confirm')">
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
        <div class="page-content">
          <h2 class="chapter-title">细化开场白场景</h2>
          <p class="chapter-desc">你可以在这里写更详细的开场画面、氛围、镜头与细节（会追加到开局第一句后）。</p>

          <div class="custom-scene">
            <label class="custom-label">开场白场景描述（可选）</label>
            <textarea
              v-model="openingSceneDetail"
              class="custom-textarea"
              placeholder="例如：时间（清晨/雨夜）、光线、气味、背景人群、你希望第一幕出现的关键物件/事件..."
              rows="6"
            ></textarea>
          </div>
        </div>
      </div>

      <!-- 确认页 -->
      <div v-else-if="currentPage === 'confirm'" class="book-page content-page">
        <div class="page-header">
          <button class="nav-btn back-btn" @click="goToPage('opening_detail')">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <span class="page-number">终章</span>
          <div class="nav-btn placeholder"></div>
        </div>
        <div class="page-content">
          <h2 class="chapter-title">准备开始</h2>
          <p class="chapter-desc">确认你的设定，开启这段旅程...</p>

          <div class="summary-section">
            <div class="summary-item">
              <span class="summary-label">场景</span>
              <span class="summary-value">{{ selectedScene?.name || '自定义场景' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">开场白细节</span>
              <span class="summary-value">{{ openingSceneDetail.trim() ? '已填写' : '未填写' }}</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">规则数量</span>
              <span class="summary-value">{{ totalRulesCount }} 条</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">角色数量</span>
              <span class="summary-value">{{ characters.length }} 人</span>
            </div>
          </div>

          <div class="confirm-actions">
            <button
              class="confirm-btn"
              :disabled="!canSubmit || isSubmitting"
              @click="handleSubmit"
            >
              <i v-if="isSubmitting" class="fa-solid fa-circle-notch fa-spin"></i>
              <span v-else>开始游戏</span>
            </button>
            <p v-if="!canSubmit" class="hint-text">请选择一个场景或填写自定义场景描述</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 主题切换按钮 -->
    <button class="theme-toggle" @click="isDarkMode = !isDarkMode">
      <i :class="isDarkMode ? 'fa-solid fa-sun' : 'fa-solid fa-moon'"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import type { OpeningFormData } from '../types';

const emit = defineEmits<{
  (e: 'submit', data: OpeningFormData): void;
}>();

// 主题
const isDarkMode = ref(true);

// 页面状态
const currentPage = ref<'cover' | 'scene' | 'rules' | 'characters' | 'opening_detail' | 'confirm'>('cover');
const isFlipping = ref(false);

// 场景选项
const sceneOptions = [
  { id: 'school', name: '圣华女子学院', desc: '一所 prestigious 的贵族女子学校，学生们都在这里接受精英教育', icon: 'fa-solid fa-school' },
  { id: 'office', name: '未来科技公司', desc: '一家高科技公司，员工们在这里开发着改变世界的技术', icon: 'fa-solid fa-building' },
  { id: 'hospital', name: '圣玛利亚医院', desc: '一家大型综合医院，各种离奇的故事在这里发生', icon: 'fa-solid fa-hospital' },
  { id: 'apartment', name: '樱庄公寓', desc: '一栋普通的公寓楼，住着形形色色的租客', icon: 'fa-solid fa-house-chimney' },
  { id: 'castle', name: '夜之城堡', desc: '一座神秘的古老城堡，传说中住着吸血鬼', icon: 'fa-solid fa-chess-rook' },
];

// 预设规则
const presetRules = [
  { id: 'rule_001', name: '感官放大法则', desc: '所有处于发情状态的个体，其痛觉将转化为快感，触觉敏感度提升三倍' },
  { id: 'rule_002', name: '绝对服从契约', desc: '下级必须无条件服从上级的直接命令，即使违背常理' },
  { id: 'rule_003', name: '强制发情期', desc: '每个月的第一天，所有成年人都会进入无法抑制的发情状态' },
  { id: 'rule_004', name: '禁止隐私', desc: '所有人的思想可以被他人读取，谎言将无所遁形' },
  { id: 'rule_005', name: '猫娘语癖', desc: '所有女性说话最后一个字必须用喵结尾' },
];

// 数据
const selectedScene = ref<typeof sceneOptions[0] | null>(null);
const customSceneDesc = ref('');
const openingSceneDetail = ref('');
const selectedRules = ref<string[]>(['rule_001', 'rule_002']); // 默认选中
const customRules = ref<{ name: string; desc: string }[]>([]);
const characters = ref<{ name: string; gender: string; desc: string }[]>([]);

// 新增数据
const newRuleName = ref('');
const newRuleDesc = ref('');
const newCharName = ref('');
const newCharGender = ref('female');
const newCharDesc = ref('');

// 提交状态
const isSubmitting = ref(false);

// 计算属性
const totalRulesCount = computed(() => {
  return selectedRules.value.length + customRules.value.length;
});

const canSubmit = computed(() => {
  // 只需要选择场景或填写自定义场景描述即可开始游戏
  return (selectedScene.value || customSceneDesc.value.trim()) && !isSubmitting.value;
});

// 翻页动画
function goToPage(page: typeof currentPage.value) {
  if (currentPage.value === page) return;

  isFlipping.value = true;
  setTimeout(() => {
    currentPage.value = page;
    setTimeout(() => {
      isFlipping.value = false;
    }, 300);
  }, 300);
}

// 选择场景
function selectScene(scene: typeof sceneOptions[0]) {
  selectedScene.value = scene;
  customSceneDesc.value = ''; // 清空自定义场景
}

// 添加自定义规则
function addCustomRule() {
  if (!newRuleName.value.trim() || !newRuleDesc.value.trim()) {
    toastr.warning('请填写完整的规则名称和描述');
    return;
  }
  customRules.value.push({
    name: newRuleName.value.trim(),
    desc: newRuleDesc.value.trim(),
  });
  newRuleName.value = '';
  newRuleDesc.value = '';
  toastr.success('规则已添加');
}

// 移除自定义规则
function removeCustomRule(index: number) {
  customRules.value.splice(index, 1);
}

// 添加角色
function addCharacter() {
  if (!newCharName.value.trim() || !newCharDesc.value.trim()) {
    toastr.warning('请填写完整的角色信息');
    return;
  }
  characters.value.push({
    name: newCharName.value.trim(),
    gender: newCharGender.value,
    desc: newCharDesc.value.trim(),
  });
  newCharName.value = '';
  newCharDesc.value = '';
  toastr.success('角色已添加');
}

// 移除角色
function removeCharacter(index: number) {
  characters.value.splice(index, 1);
}

// 提交
async function handleSubmit() {
  if (isSubmitting.value || !canSubmit.value) return;

  isSubmitting.value = true;

  // 第一次开始时尝试进入全屏（如果浏览器允许）
  try {
    if (!document.fullscreenElement && typeof document.documentElement?.requestFullscreen === 'function') {
      await document.documentElement.requestFullscreen();
    }
  } catch (e) {
    // 忽略失败（可能被浏览器策略/权限阻止）
  }

  // 构建场景描述
  let sceneDescription = '';
  if (selectedScene.value) {
    sceneDescription = `${selectedScene.value.name}：${selectedScene.value.desc}`;
  } else {
    sceneDescription = customSceneDesc.value.trim();
  }

  // 构建规则列表
  const rules = [
    ...selectedRules.value.map(id => {
      const rule = presetRules.find(r => r.id === id);
      return rule ? { name: rule.name, desc: rule.desc } : null;
    }).filter(Boolean),
    ...customRules.value,
  ];

  const formData: OpeningFormData = {
    playerName: '玩家',
    gameDifficulty: 'normal',
    enableWorldRules: true,
    enableRegionalRules: true,
    enablePersonalRules: true,
    sceneDescription,
    openingSceneDetail: openingSceneDetail.value.trim(),
    selectedRules: rules,
    characters: characters.value,
  };

  console.log('🎮 [OpeningForm] 提交:', formData);
  emit('submit', formData);
}
</script>

<style lang="scss" scoped>
.opening-form {
  --bg-0: #0b0c0f;
  --bg-1: #151820;
  --glass: rgba(255, 255, 255, 0.06);
  --glass-strong: rgba(255, 255, 255, 0.1);
  --line: rgba(255, 255, 255, 0.14);
  --text: rgba(255, 255, 255, 0.92);
  --text-soft: rgba(255, 255, 255, 0.68);
  --text-faint: rgba(255, 255, 255, 0.48);
  --accent: #c7ccd4;
  --danger: #ff6b6b;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Noto Sans SC', sans-serif;
  color: var(--text);
  background:
    radial-gradient(1200px 700px at 8% -10%, rgba(255, 255, 255, 0.12), transparent 60%),
    radial-gradient(900px 500px at 108% 110%, rgba(255, 255, 255, 0.08), transparent 60%),
    linear-gradient(160deg, var(--bg-0) 0%, var(--bg-1) 100%);

  &.light {
    --bg-0: #eef1f6;
    --bg-1: #dee3ea;
    --glass: rgba(255, 255, 255, 0.62);
    --glass-strong: rgba(255, 255, 255, 0.82);
    --line: rgba(17, 24, 39, 0.12);
    --text: rgba(17, 24, 39, 0.92);
    --text-soft: rgba(17, 24, 39, 0.68);
    --text-faint: rgba(17, 24, 39, 0.48);
    --accent: #3a4352;
    --danger: #dc3c3c;
  }
}

.book-container {
  width: 100%;
  max-width: 880px;
  min-height: 690px;
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: var(--glass);
  border: 1px solid var(--line);
  box-shadow:
    0 30px 80px rgba(0, 0, 0, 0.32),
    inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(20px) saturate(140%);

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.12) 0%,
      rgba(255, 255, 255, 0.02) 24%,
      rgba(255, 255, 255, 0.05) 100%
    );
  }

  &.flipping .book-page {
    animation: pageSwitch 0.24s cubic-bezier(0.22, 1, 0.36, 1);
  }
}

@keyframes pageSwitch {
  0% {
    opacity: 0.65;
    transform: translateY(8px) scale(0.99);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.book-page {
  position: relative;
  width: 100%;
  min-height: 690px;
  overflow: hidden;
}

.cover-page {
  display: grid;
  place-items: center;
  padding: 64px 48px;
  text-align: center;
}

.book-cover {
  width: 100%;
  max-width: 460px;
}

.cover-decoration {
  border-radius: 24px;
  padding: 22px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  backdrop-filter: blur(8px);
}

.cover-border {
  border-radius: 18px;
  border: 1px solid var(--line);
  padding: 18px;
}

.cover-inner {
  border-radius: 14px;
  padding: 40px 22px;
  background: rgba(255, 255, 255, 0.03);
}

.book-icon {
  font-size: 58px;
  color: var(--accent);
  margin-bottom: 20px;
}

.book-title {
  margin: 0 0 8px;
  font-size: 40px;
  line-height: 1.1;
  letter-spacing: 0.02em;
  font-weight: 700;
}

.book-subtitle {
  margin: 0 0 20px;
  font-size: 12px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.cover-divider {
  width: 72%;
  height: 1px;
  margin: 0 auto 18px;
  background: linear-gradient(90deg, transparent, var(--line), transparent);
}

.book-desc {
  margin: 0 0 30px;
  font-size: 15px;
  color: var(--text-soft);
}

.start-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 34px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.22) 0%,
    rgba(255, 255, 255, 0.08) 100%
  );
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.28);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  }

  &:active {
    transform: scale(0.98);
  }
}

.content-page {
  display: grid;
  grid-template-rows: auto 1fr;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
}

.nav-btn {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.02);
  color: var(--text-soft);
  cursor: pointer;
  transition: all 0.18s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.28);
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.96);
  }

  &.placeholder {
    visibility: hidden;
  }
}

.page-number {
  color: var(--text-faint);
  font-size: 12px;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  font-weight: 600;
}

.page-content {
  padding: 28px 30px 30px;
  overflow-y: auto;
  max-height: 610px;
}

.chapter-title {
  margin: 0 0 8px;
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.chapter-desc {
  margin: 0 0 24px;
  color: var(--text-soft);
  font-size: 14px;
}

.scene-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 24px;
}

.scene-card,
.rule-item,
.custom-rule-item,
.char-card,
.custom-rules-section,
.character-form,
.summary-section {
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.04);
  transition: transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), border-color 0.2s ease, box-shadow 0.2s ease;
}

.scene-card {
  padding: 16px;
  cursor: pointer;
  text-align: left;

  &:hover,
  &.active {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.28);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
  }

  &.active {
    background: var(--glass-strong);
  }
}

.scene-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  margin-bottom: 10px;
  font-size: 20px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--accent);
}

.scene-name {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
}

.scene-desc {
  margin: 0;
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-soft);
}

.custom-scene {
  margin-top: 20px;
}

.custom-label {
  display: block;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-soft);
}

.custom-textarea,
.rule-name-input,
.rule-desc-input,
.char-name-input,
.char-gender-select,
.char-desc-input {
  width: 100%;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text);
  font-size: 14px;
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;

  &::placeholder {
    color: var(--text-faint);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.34);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.05);
  }
}

.custom-textarea,
.rule-desc-input,
.char-desc-input {
  resize: vertical;
  min-height: 86px;
}

.rules-section {
  margin-bottom: 22px;
}

.section-title {
  margin: 0 0 14px;
  font-size: 15px;
  font-weight: 700;
}

.rules-list {
  display: grid;
  gap: 10px;
}

.rule-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px;
  cursor: pointer;

  &:hover,
  &.checked {
    border-color: rgba(255, 255, 255, 0.28);
    background: var(--glass-strong);
    transform: translateY(-1px);
  }
}

.rule-checkbox {
  position: relative;
  flex-shrink: 0;

  input {
    display: none;
  }
}

.check-mark {
  width: 22px;
  height: 22px;
  border-radius: 8px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.03);
  display: grid;
  place-items: center;
  color: var(--accent);
  transition: all 0.18s ease;

  i {
    font-size: 12px;
    opacity: 0;
    transform: scale(0.85);
    transition: all 0.18s ease;
  }

  input:checked + & {
    background: rgba(255, 255, 255, 0.16);
    border-color: rgba(255, 255, 255, 0.34);

    i {
      opacity: 1;
      transform: scale(1);
    }
  }
}

.rule-info,
.custom-rule-info,
.char-info {
  display: grid;
  gap: 4px;
  flex: 1;
}

.rule-name,
.custom-rule-name,
.char-name {
  font-size: 14px;
  font-weight: 600;
}

.rule-desc,
.custom-rule-desc,
.char-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--text-soft);
}

.custom-rules-section,
.character-form,
.summary-section {
  padding: 18px;
}

.custom-rule-input {
  display: grid;
  gap: 10px;
}

.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
}

.char-name-input {
  flex: 1;
}

.char-gender-select {
  width: 110px;
  flex-shrink: 0;
}

.form-actions-row {
  display: flex;
  justify-content: flex-end;
}

.add-rule-btn,
.add-char-btn,
.confirm-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.08));
  color: var(--text);
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    border-color: rgba(255, 255, 255, 0.32);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.14);
  }

  &:active:not(:disabled) {
    transform: scale(0.98);
  }
}

.add-rule-btn,
.add-char-btn {
  min-width: 112px;
  padding: 10px 18px;
  font-size: 13px;
  font-weight: 600;
}

.custom-rules-list,
.char-cards {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.custom-rule-item,
.char-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px;
}

.char-avatar {
  width: 36px;
  height: 36px;
  border-radius: 11px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.12);
  color: var(--accent);
}

.remove-btn {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text-faint);
  cursor: pointer;
  transition: all 0.18s ease;

  &:hover {
    color: var(--danger);
    border-color: rgba(255, 107, 107, 0.35);
    background: rgba(255, 107, 107, 0.08);
  }
}

.empty-hint {
  margin-top: 6px;
  text-align: center;
  padding: 30px 18px;
  border-radius: 18px;
  border: 1px dashed var(--line);
  color: var(--text-soft);

  i {
    display: block;
    margin-bottom: 10px;
    font-size: 36px;
    color: var(--text-faint);
  }

  p {
    margin: 0 0 6px;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-soft);
  }

  span {
    font-size: 12px;
    color: var(--text-faint);
  }
}

.summary-section {
  margin: 18px 0 24px;
}

.summary-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);

  &:last-child {
    border-bottom: none;
  }
}

.summary-label {
  font-size: 13px;
  color: var(--text-soft);
}

.summary-value {
  font-size: 13px;
  font-weight: 700;
}

.confirm-actions {
  display: grid;
  justify-items: center;
}

.confirm-btn {
  min-width: 220px;
  padding: 14px 22px;
  font-size: 16px;
  font-weight: 700;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
}

.hint-text {
  margin-top: 10px;
  color: var(--text-faint);
  font-size: 12px;
}

.theme-toggle {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  border: 1px solid var(--line);
  background: var(--glass);
  color: var(--text-soft);
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.18s ease;

  &:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.28);
    transform: translateY(-1px);
  }
}

.page-content {
  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.2);
  }
}

@media (max-width: 900px) {
  .opening-form {
    padding: 16px;
  }

  .book-container {
    min-height: 620px;
    border-radius: 22px;
  }

  .book-page {
    min-height: 620px;
  }

  .page-content {
    padding: 20px;
    max-height: 560px;
  }

  .chapter-title {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .scene-grid {
    grid-template-columns: 1fr;
  }

  .form-row {
    flex-direction: column;
  }

  .char-gender-select {
    width: 100%;
  }

  .theme-toggle {
    right: 12px;
    bottom: 12px;
  }
}
</style>