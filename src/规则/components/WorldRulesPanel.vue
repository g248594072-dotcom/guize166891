<template>
  <section id="panel-world-rules" class="world-rules-panel">
    <div class="section-header">
      <p class="desc">影响整个世界所有实体的基础法则。</p>
      <button id="btn-add-world-rule" class="action-btn" @click="$emit('openModal', 'add_world_rule')">
        <i class="fa-solid fa-plus"></i>
        <span>新增世界规则</span>
      </button>
    </div>

    <div class="rules-list">
      <RuleListItem
        v-for="rule in rules"
        :key="rule.title"
        :title="rule.title"
        :desc="rule.desc"
        :status="rule.status"
        @open-modal="$emit('openModal', $event)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import RuleListItem from './RuleListItem.vue';

const rules = [
  { title: '强制发情期', desc: '每个月的第一天，所有成年人都会进入无法抑制的发情状态，持续24小时。', status: 'active' },
  { title: '猫娘语癖', desc: '所有女性说话最后一个字必须用喵结尾，否则会受到轻微电击惩罚。', status: 'active' },
  { title: '开裆裤法案', desc: '所有男性在公共场合必须穿着开裆裤。', status: 'inactive' },
];

defineEmits<{
  (e: 'openModal', type: string): void;
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

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
