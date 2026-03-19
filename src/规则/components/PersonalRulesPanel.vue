<template>
  <section id="panel-personal-rules" class="personal-rules-panel">
    <div class="section-header">
      <p class="desc">针对特定个体的专属规则与设定。</p>
      <button id="btn-add-personal-rule" class="action-btn" @click="$emit('openModal', 'add_personal_rule')">
        <i class="fa-solid fa-plus"></i>
        <span>新增个人规则</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>正在加载个人规则...</span>
    </div>

    <template v-else>
      <!-- 顶部：折叠的归档区（按人分组） -->
      <div v-if="archivedGroups.length > 0" class="archive-section">
        <button
          class="archive-toggle"
          :class="{ open: archiveSectionOpen }"
          @click="archiveSectionOpen = !archiveSectionOpen"
        >
          <i class="fa-solid fa-archive"></i>
          <span>已归档（{{ totalArchived }} 条）</span>
          <i class="fa-solid fa-chevron-down toggle-icon"></i>
        </button>
        <div v-show="archiveSectionOpen" class="archive-content">
          <div
            v-for="grp in archivedGroups"
            :key="grp.groupName"
            class="archive-group"
          >
            <div class="archive-group-title">{{ grp.groupName }}</div>
            <div
              v-for="rule in grp.archived"
              :key="rule.id"
              class="archive-rule-row"
            >
              <span class="archive-rule-desc">{{ ruleSummary(rule) }}</span>
              <button
                class="restore-btn"
                title="复原"
                @click="onRestore(rule, grp.groupName)"
              >
                <i class="fa-solid fa-rotate-left"></i>
                <span>复原</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="grouped.length === 0 && archivedGroups.length === 0" class="empty-state">
        <i class="fa-solid fa-user-circle"></i>
        <p>暂无个人规则</p>
        <span class="hint">点击上方按钮添加新规则，或等待AI生成初始数据</span>
      </div>

      <!-- 按人分组的折叠列表 -->
      <div v-else class="personal-rules-list">
        <div
          v-for="grp in grouped"
          :key="grp.groupName"
          class="group-card"
        >
          <button
            class="group-header"
            :class="{ expanded: expandedGroups.has(grp.groupName) }"
            @click="toggleGroup(grp.groupName)"
          >
            <i class="fa-solid fa-user-circle"></i>
            <span class="group-name">{{ grp.groupName }}</span>
            <span class="group-count">{{ grp.active.length }} / {{ grp.active.length + grp.archived.length }} 条</span>
            <i class="fa-solid fa-chevron-down header-chevron"></i>
          </button>
          <div v-show="expandedGroups.has(grp.groupName)" class="group-body">
            <div
              v-for="rule in grp.active"
              :key="rule.id"
              class="rule-row"
            >
              <div class="rule-desc">{{ rule.desc || rule.title }}</div>
              <div class="rule-actions">
                <button
                  class="action edit"
                  title="编辑"
                  @click="$emit('openModal', 'edit_personal_rule', rulePayload(rule, grp.groupName))"
                >
                  <i class="fa-solid fa-pen"></i>
                </button>
                <button
                  class="action archive"
                  title="归档"
                  @click="onArchive(rule, grp.groupName)"
                >
                  <i class="fa-solid fa-archive"></i>
                </button>
                <button
                  class="action delete"
                  title="删除"
                  @click="$emit('openModal', 'delete_personal_rule', rulePayload(rule, grp.groupName))"
                >
                  <i class="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { RuleData } from '../types';
import { readPersonalRules, groupPersonalRulesByCharacter } from '../utils/variableReader';
import { submitArchivePersonalRule, submitRestorePersonalRule } from '../utils/dialogAndVariable';

const rawList = ref<RuleData[]>([]);
const isLoading = ref(true);
const archiveSectionOpen = ref(false);
const expandedGroups = ref<Set<string>>(new Set());

const grouped = computed(() => groupPersonalRulesByCharacter(rawList.value));

const archivedGroups = computed(() =>
  grouped.value.filter((g) => g.archived.length > 0)
);

const totalArchived = computed(() =>
  archivedGroups.value.reduce((sum, g) => sum + g.archived.length, 0)
);

function ruleSummary(rule: RuleData): string {
  if (rule.title && rule.title !== (rule as any).target) return rule.title;
  const d = (rule.desc || '').trim();
  return d.length > 40 ? d.slice(0, 40) + '…' : d || '（无描述）';
}

function rulePayload(rule: RuleData, character: string): Record<string, any> {
  return {
    id: rule.id,
    title: rule.title,
    character,
    desc: rule.desc,
  };
}

function toggleGroup(name: string) {
  const next = new Set(expandedGroups.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  expandedGroups.value = next;
}

async function onArchive(rule: RuleData, groupName: string) {
  await submitArchivePersonalRule(rule.id, groupName, ruleSummary(rule));
  await loadRules();
}

async function onRestore(rule: RuleData, groupName: string) {
  await submitRestorePersonalRule(rule.id, groupName, ruleSummary(rule));
  await loadRules();
}

async function loadRules() {
  isLoading.value = true;
  try {
    rawList.value = await readPersonalRules();
    console.log('✅ [PersonalRulesPanel] 加载个人规则:', rawList.value.length);
  } catch (e) {
    console.warn('加载个人规则失败', e);
    rawList.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadRules();
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      console.log('🔄 [PersonalRulesPanel] 消息更新，刷新规则...');
      loadRules();
    });
  }
});

defineEmits<{
  (e: 'openModal', type: string, payload?: Record<string, any>): void;
}>();
</script>

<style lang="scss" scoped>
.personal-rules-panel {
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  gap: 12px;

  i {
    font-size: 48px;
    color: #52525b;
    opacity: 0.5;
  }

  p {
    font-size: 16px;
    font-weight: 500;
    color: #e4e4e7;
    margin: 0;
  }

  .hint {
    font-size: 13px;
    color: #71717a;
    max-width: 280px;
  }
}

:global(.light) .empty-state {
  i {
    color: #a1a1aa;
  }

  p {
    color: #27272a;
  }

  .hint {
    color: #a1a1aa;
  }
}

/* 归档区 */
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

.archive-group {
  margin-top: 12px;

  &:first-child {
    margin-top: 12px;
  }
}

.archive-group-title {
  font-size: 12px;
  color: #71717a;
  margin-bottom: 6px;
}

.archive-rule-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  margin-bottom: 4px;
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

/* 分组卡片 */
.personal-rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-card {
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
}

:global(.light) .group-card {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;
}

.group-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: none;
  background: transparent;
  color: #e4e4e7;
  font-size: 14px;
  cursor: pointer;
  text-align: left;

  .header-chevron {
    margin-left: auto;
    font-size: 12px;
    color: #71717a;
    transition: transform 0.2s;
  }

  &.expanded .header-chevron {
    transform: rotate(180deg);
  }
}

:global(.light) .group-header {
  color: #18181b;
}

.group-name {
  font-weight: 500;
}

.group-count {
  font-size: 12px;
  color: #71717a;
}

.group-body {
  padding: 0 16px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

:global(.light) .group-body {
  border-color: rgba(0, 0, 0, 0.05);
}

.rule-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
}

:global(.light) .rule-row {
  border-color: rgba(0, 0, 0, 0.05);
}

.rule-desc {
  flex: 1;
  font-size: 14px;
  color: #d4d4d8;
  line-height: 1.5;
}

:global(.light) .rule-desc {
  color: #3f3f46;
}

.rule-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.rule-actions .action {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #71717a;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #e4e4e7;
  }

  &.delete:hover {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
  }

  &.archive:hover {
    color: #a1a1aa;
  }
}

:global(.light) .rule-actions .action:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #18181b;
}
</style>
