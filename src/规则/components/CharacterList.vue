<template>
  <section id="panel-character-list" class="character-list">
    <div class="section-header">
      <p class="desc">管理当前世界中的所有角色实体。</p>
      <button id="btn-add-character" class="action-btn" @click="$emit('openModal', 'add_character')">
        <i class="fa-solid fa-plus"></i>
        <span>新增角色</span>
      </button>
    </div>

    <div class="character-grid">
      <article
        v-for="char in characters"
        :key="char.id"
        class="character-card"
        :class="{ protagonist: char.isProtagonist }"
        @click="$emit('select', char.id)"
      >
        <div v-if="char.isProtagonist" class="protagonist-badge">PROTAGONIST</div>
        <div class="card-header">
          <div class="avatar" :class="{ protagonist: char.isProtagonist }">
            <i class="fa-solid fa-user"></i>
          </div>
          <div class="info">
            <h4>{{ char.name }}</h4>
            <p>{{ char.role }} | {{ char.id }}</p>
          </div>
        </div>
        <div v-if="!char.isProtagonist" class="stats">
          <div class="stat-row">
            <span class="label">好感度 AFFECTION</span>
            <span class="value">{{ char.affection }}%</span>
          </div>
          <div class="stat-row">
            <span class="label">发情值 LUST</span>
            <span class="value">{{ char.lust }}%</span>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
const characters = [
  { id: 'CHR-000', name: '玩家 (你)', role: '主角 / 规则掌控者', status: '活跃', lust: 0, affection: 100, isProtagonist: true },
  { id: 'CHR-001', name: '神宫寺 琉璃', role: '学生会书记', status: '活跃', lust: 75, affection: 42, isProtagonist: false },
  { id: 'CHR-002', name: '白银 辉夜', role: '学生会会长', status: '活跃', lust: 10, affection: 10, isProtagonist: false },
  { id: 'CHR-003', name: '早坂 爱', role: '专属女仆', status: '活跃', lust: 30, affection: 60, isProtagonist: false },
];

defineEmits<{
  (e: 'select', id: string): void;
  (e: 'openModal', type: string): void;
}>();
</script>

<style lang="scss" scoped>
.character-list {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 80px;
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

.character-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.character-card {
  padding: 20px;
  border-radius: 16px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);

  &:hover {
    border-color: rgba(255, 255, 255, 0.2);
  }

  &.protagonist {
    border-color: rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.03);
  }
}

:global(.light) .character-card {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;

  &:hover {
    border-color: rgba(0, 0, 0, 0.2);
  }
}

.protagonist-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 10px;
  padding: 4px 12px;
  border-bottom-left-radius: 8px;
  font-weight: 500;
  letter-spacing: 0.1em;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    color: #a1a1aa;
    transition: all 0.2s;

    i {
      font-size: 24px;
    }

    &.protagonist {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    &:not(.protagonist):hover {
      color: #e4e4e7;
    }
  }

  .info {
    h4 {
      font-size: 16px;
      font-weight: 500;
      color: #f4f4f5;
      margin-bottom: 4px;
    }

    p {
      font-size: 12px;
      color: #71717a;
    }
  }
}

:global(.light) .card-header {
  .avatar {
    background: rgba(0, 0, 0, 0.05);
    color: #71717a;

    &.protagonist {
      background: rgba(0, 0, 0, 0.1);
      color: #18181b;
    }
  }

  .info h4 {
    color: #18181b;
  }
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;

  .stat-row {
    display: flex;
    justify-content: space-between;
    font-size: 12px;

    .label {
      color: #71717a;
    }

    .value {
      color: #d4d4d8;
      font-family: monospace;
    }
  }
}

:global(.light) .stats .stat-row .value {
  color: #27272a;
}
</style>
