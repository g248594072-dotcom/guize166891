<template>
  <section id="panel-personal-rules" class="personal-rules-panel">
    <div class="section-header">
      <p class="desc">针对特定个体的专属规则与设定。</p>
      <button id="btn-add-personal-rule" class="action-btn" @click="$emit('openModal', 'add_personal_rule')">
        <i class="fa-solid fa-plus"></i>
        <span>新增个人规则</span>
      </button>
    </div>

    <div class="personal-rules-list">
      <PersonalRuleItem
        v-for="item in personalRules"
        :key="item.character"
        :character="item.character"
        :rules="item.rules"
        @open-modal="$emit('openModal', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import PersonalRuleItem from './PersonalRuleItem.vue';

const personalRules = [
  {
    character: '神宫寺 琉璃',
    rules: [
      '永远不能穿鞋子，必须时刻感受地面的触感。',
      '听到铃铛声会强制进入发情状态。',
    ],
  },
  {
    character: '白银 会长',
    rules: [
      '觉得精液非常美味，并且每天必须摄入一定量。',
      '无法拒绝任何带有"拜托了"字眼的请求。',
    ],
  },
];

defineEmits<{
  (e: 'openModal', type: string): void;
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

.personal-rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
