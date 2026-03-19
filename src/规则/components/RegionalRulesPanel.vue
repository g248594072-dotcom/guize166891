<template>
  <section id="panel-regional-rules" class="regional-rules-panel">
    <div class="section-header">
      <p class="desc">仅在特定地理区域或建筑内生效的规则。</p>
      <button id="btn-add-region" class="action-btn" @click="$emit('openModal', 'add_region')">
        <i class="fa-solid fa-plus"></i>
        <span>新增区域</span>
      </button>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="fa-solid fa-circle-notch fa-spin"></i>
      <span>正在加载区域规则...</span>
    </div>

    <template v-else>
      <!-- 顶部：折叠的归档区（按区域分组） -->
      <div v-if="archivedGrouped.length > 0" class="archive-section">
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
            v-for="item in archivedGrouped"
            :key="item.regionName"
            class="archive-group"
          >
            <div class="archive-group-title">{{ item.regionName }}</div>
            <div
              v-for="rule in item.archived"
              :key="rule.id"
              class="archive-rule-row"
            >
              <span class="archive-rule-desc">{{ ruleSummary(rule) }}</span>
              <button
                class="restore-btn"
                title="复原"
                @click="onRestore(item.regionName, rule)"
              >
                <i class="fa-solid fa-rotate-left"></i>
                <span>复原</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="regions.length === 0 && archivedGrouped.length === 0" class="empty-state">
        <i class="fa-solid fa-map"></i>
        <p>暂无区域规则</p>
        <span class="hint">点击上方按钮新增区域</span>
      </div>

      <!-- 区域卡片（可折叠，展示启用规则与编辑/归档） -->
      <div v-else class="regions-grid">
        <div
          v-for="region in regions"
          :key="region.name"
          class="region-card-wrap"
        >
          <div class="region-card">
            <button
              class="card-header"
              :class="{ expanded: expandedRegions.has(region.name) }"
              @click="toggleRegion(region.name)"
            >
              <div class="title-group">
                <i class="fa-solid fa-map"></i>
                <h3>{{ region.name }}</h3>
              </div>
              <span class="rule-count">{{ activeRules(region).length }} / {{ (region.rules || []).length }} 条</span>
              <i class="fa-solid fa-chevron-down header-chevron"></i>
            </button>
            <div v-show="expandedRegions.has(region.name)" class="card-body">
              <div
                v-for="rule in activeRules(region)"
                :key="rule.id"
                class="rule-row"
              >
                <div class="rule-desc">{{ rule.desc || rule.title }}</div>
                <div class="rule-actions">
                  <button
                    class="action edit"
                    title="编辑"
                    @click="$emit('openModal', 'edit_region_rule', { regionId: region.id, regionName: region.name, rule })"
                  >
                    <i class="fa-solid fa-pen"></i>
                  </button>
                  <button
                    class="action archive"
                    title="归档"
                    @click="onArchive(region.name, rule)"
                  >
                    <i class="fa-solid fa-archive"></i>
                  </button>
                </div>
              </div>
              <div class="card-footer">
                <button
                  class="footer-btn edit"
                  @click="$emit('openModal', 'add_region_rule', regionPayload(region))"
                >
                  <i class="fa-solid fa-plus"></i>
                  <span>新增规则</span>
                </button>
                <button
                  class="footer-btn delete"
                  @click="$emit('openModal', 'delete_region', regionPayload(region))"
                >
                  <i class="fa-solid fa-trash"></i>
                  <span>删除</span>
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
import type { RegionData, RuleData } from '../types';
import { readRegionalRules, getRegionalArchivedGrouped } from '../utils/variableReader';
import { submitArchiveRegionalRule, submitRestoreRegionalRule } from '../utils/dialogAndVariable';

const regions = ref<RegionData[]>([]);
const isLoading = ref(true);
const archiveSectionOpen = ref(false);
const expandedRegions = ref<Set<string>>(new Set());

const archivedGrouped = computed(() => getRegionalArchivedGrouped(regions.value));

const totalArchived = computed(() =>
  archivedGrouped.value.reduce((sum, g) => sum + g.archived.length, 0)
);

function activeRules(region: RegionData): RuleData[] {
  return (region.rules || []).filter((r) => r.status === 'active');
}

function ruleSummary(rule: RuleData): string {
  const d = (rule.title || rule.desc || '').trim();
  return d.length > 40 ? d.slice(0, 40) + '…' : d || '（无描述）';
}

function regionPayload(region: RegionData): Record<string, any> {
  return {
    id: region.id,
    name: region.name,
    description: region.description,
    rules: region.rules,
  };
}

function toggleRegion(name: string) {
  const next = new Set(expandedRegions.value);
  if (next.has(name)) next.delete(name);
  else next.add(name);
  expandedRegions.value = next;
}

async function onArchive(regionName: string, rule: RuleData) {
  await submitArchiveRegionalRule(regionName, rule.id, ruleSummary(rule));
  await loadRegions();
}

async function onRestore(regionName: string, rule: RuleData) {
  await submitRestoreRegionalRule(regionName, rule.id, ruleSummary(rule));
  await loadRegions();
}

async function loadRegions() {
  isLoading.value = true;
  try {
    regions.value = await readRegionalRules();
    console.log('✅ [RegionalRulesPanel] 加载区域规则:', regions.value.length);
  } catch (e) {
    console.warn('加载区域规则失败', e);
    regions.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadRegions();
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    eventOn(tavern_events.MESSAGE_UPDATED, () => {
      console.log('🔄 [RegionalRulesPanel] 消息更新，刷新区域...');
      loadRegions();
    });
  }
});

defineEmits<{
  (e: 'openModal', type: string, payload?: Record<string, any>): void;
}>();
</script>

<style lang="scss" scoped>
.regional-rules-panel {
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

/* 区域卡片 */
.regions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.region-card-wrap {
  border-radius: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
}

:global(.light) .region-card-wrap {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;
}

.region-card .card-header {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: none;
  background: rgba(255, 255, 255, 0.02);
  color: #fff;
  font-size: 14px;
  cursor: pointer;
  text-align: left;

  .title-group {
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      font-size: 20px;
      color: #a1a1aa;
    }

    h3 {
      font-size: 16px;
      font-weight: 500;
      margin: 0;
    }
  }

  .rule-count {
    margin-left: auto;
    font-size: 12px;
    color: #71717a;
  }

  .header-chevron {
    font-size: 12px;
    color: #71717a;
    transition: transform 0.2s;
  }

  &.expanded .header-chevron {
    transform: rotate(180deg);
  }
}

:global(.light) .region-card .card-header {
  background: rgba(0, 0, 0, 0.02);

  .title-group h3 {
    color: #18181b;
  }
}

.card-body {
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

:global(.light) .card-body {
  border-color: rgba(0, 0, 0, 0.05);
}

.rule-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
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
  color: #a1a1aa;
  line-height: 1.5;
}

:global(.light) .rule-desc {
  color: #71717a;
}

.rule-actions .action {
  padding: 6px 10px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #71717a;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: #e4e4e7;
  }
}

:global(.light) .rule-actions .action:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #18181b;
}

.card-footer {
  padding-top: 12px;
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  gap: 8px;
}

:global(.light) .card-footer {
  border-color: rgba(0, 0, 0, 0.05);
}

.footer-btn {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  color: #a1a1aa;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    color: #fff;
    background: rgba(255, 255, 255, 0.05);
  }

  &.delete:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
}

:global(.light) .footer-btn {
  color: #71717a;

  &:hover {
    color: #18181b;
    background: rgba(0, 0, 0, 0.05);
  }
}
</style>
