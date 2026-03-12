<template>
  <section id="panel-regional-rules" class="regional-rules-panel">
    <div class="section-header">
      <p class="desc">仅在特定地理区域或建筑内生效的规则。</p>
      <button id="btn-add-region" class="action-btn" @click="$emit('openModal', 'add_region')">
        <i class="fa-solid fa-plus"></i>
        <span>新增区域</span>
      </button>
    </div>

    <div class="regions-grid">
      <RegionCard
        v-for="region in regions"
        :key="region.name"
        :name="region.name"
        :rule-count="region.ruleCount"
        :rules="region.rules"
        @open-modal="$emit('openModal', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import RegionCard from './RegionCard.vue';

const regions = [
  {
    name: '圣华女子高级中学',
    ruleCount: 3,
    rules: [
      '上课时上厕所必须提前报告，报告内容为羞辱自己的话语。',
      '禁止穿着内衣，必须真空上阵。',
      '见到教师必须行跪拜礼。',
    ],
  },
  {
    name: '地下黑市',
    ruleCount: 1,
    rules: [
      '所有交易必须以体液作为货币结算。',
    ],
  },
];

defineEmits<{
  (e: 'openModal', type: string): void;
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

.regions-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
