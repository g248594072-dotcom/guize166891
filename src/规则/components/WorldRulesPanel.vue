<template>
  <section id="panel-world-rules" class="world-rules-panel">
    <div class="section-header">
      <p class="desc">影响整个世界所有实体的基础法则。</p>
      <button id="btn-add-world-rule" class="action-btn" @click="$emit('openModal', 'add_world_rule')">
        <i class="fa-solid fa-plus"></i>
        <span>新增世界规则</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>正在加载世界规则...</span>
    </div>

    <template v-else>
      <!-- 顶部：折叠的归档区 -->
      <div v-if="archivedRules.length > 0" class="archive-section">
        <button
          class="archive-toggle"
          :class="{ open: archiveSectionOpen }"
          @click="archiveSectionOpen = !archiveSectionOpen"
        >
          <i class="fa-solid fa-archive"></i>
          <span>已归档（{{ archivedRules.length }} 条）</span>
          <i class="fa-solid fa-chevron-down toggle-icon"></i>
        </button>
        <div v-show="archiveSectionOpen" class="archive-content">
          <div
            v-for="rule in archivedRules"
            :key="rule.id"
            class="archive-rule-row"
          >
            <span class="archive-rule-desc">{{ rule.title || rule.desc?.slice(0, 40) || '（无标题）' }}</span>
            <button
              class="restore-btn"
              title="复原"
              @click="onRestore(rule)"
            >
              <i class="fa-solid fa-rotate-left"></i>
              <span>复原</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 启用中的规则列表 -->
      <div class="rules-list">
        <RuleListItem
          v-for="rule in activeRules"
          :key="rule.id"
          :title="rule.title"
          :desc="rule.desc"
          :status="rule.status"
          :rule="rule"
          @open-modal="(t, p) => $emit('openModal', t, p)"
        />
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import RuleListItem from './RuleListItem.vue';
import type { RuleData } from '../types';
import { readWorldRules } from '../utils/variableReader';
import { submitRestoreWorldRule } from '../utils/dialogAndVariable';

const rules = ref<RuleData[]>([]);
const isLoading = ref(true);
const archiveSectionOpen = ref(false);

const activeRules = computed(() => rules.value.filter((r) => r.status === 'active'));
const archivedRules = computed(() => rules.value.filter((r) => r.status !== 'active'));

async function loadRules() {
  isLoading.value = true;
  try {
    rules.value = await readWorldRules();
    console.log('✅ [WorldRulesPanel] 加载世界规则:', rules.value.length);
  } catch (e) {
    console.warn('加载世界规则失败', e);
    rules.value = [];
  } finally {
    isLoading.value = false;
  }
}

async function onRestore(rule: RuleData) {
  await submitRestoreWorldRule(rule.id ?? rule.title);
  await loadRules();
}

onMounted(() => {
  loadRules();
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      console.log('🔄 [WorldRulesPanel] 消息更新，刷新规则...');
      loadRules();
    });
  }
});

defineEmits<{
  (e: 'openModal', type: string, payload?: Record<string, any>): void;
}>();
</script>

<style lang="scss" scoped>
.world-rules-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .desc {
    font-size: 14px;
    color: #a1a1aa;
  }
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

:global(.light) .action-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #27272a;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  color: #71717a;
  font-size: 14px;

  i {
    font-size: 20px;
  }
}

:global(.light) .loading-state {
  color: #a1a1aa;
}

.archive-section {
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

:global(.light) .archive-section {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.02);
}

.archive-toggle {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #a1a1aa;
  font-size: 14px;
  cursor: pointer;
  text-align: left;

  .toggle-icon {
    margin-left: auto;
    transition: transform 0.2s;
  }

  &.open .toggle-icon {
    transform: rotate(180deg);
  }
}

.archive-content {
  padding: 0 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

:global(.light) .archive-content {
  border-color: rgba(0, 0, 0, 0.05);
}

.archive-rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  margin-top: 8px;
}

:global(.light) .archive-rule-row {
  background: rgba(0, 0, 0, 0.04);
}

.archive-rule-desc {
  flex: 1;
  font-size: 13px;
  color: #d4d4d8;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.light) .archive-rule-desc {
  color: #3f3f46;
}

.restore-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  font-size: 12px;
  color: #a1a1aa;
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    color: #22c55e;
    background: rgba(34, 197, 94, 0.1);
  }
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
