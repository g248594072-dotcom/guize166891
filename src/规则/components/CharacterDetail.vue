<template>
  <section id="panel-character-detail" class="character-detail">
    <button class="back-btn" @click="$emit('back')">
      <i class="fa-solid fa-arrow-left"></i>
      <span>返回角色列表</span>
    </button>

    <!-- Header Profile -->
    <div class="profile-header">
      <div
        id="btn-edit-avatar"
        class="avatar-edit"
        @click="$emit('openModal', 'edit_avatar')"
      >
        <i class="fa-solid fa-user"></i>
        <div class="edit-overlay">
          <i class="fa-solid fa-pen"></i>
        </div>
      </div>
      <div class="profile-info">
        <div class="name-row">
          <h2>{{ name }}</h2>
          <span v-if="isProtagonist" class="protagonist-tag">PROTAGONIST</span>
        </div>
        <p class="meta">ID: {{ characterId }} | 状态: 活跃</p>
      </div>
      <button id="btn-edit-basic" class="edit-btn" @click="$emit('openModal', 'edit_basic')">
        <i class="fa-solid fa-pen"></i>
        <span>编辑基础信息</span>
      </button>
    </div>

    <div class="detail-grid">
      <!-- Basic Stats -->
      <article class="detail-card">
        <div class="card-title">
          <i class="fa-solid fa-chart-line"></i>
          <h3>生理指标</h3>
        </div>
        <div class="stats-list">
          <StatRow label="年龄" :value="isProtagonist ? '20 岁' : '17 岁'" />
          <StatRow label="身高" :value="isProtagonist ? '180 cm' : '165 cm'" />
          <StatRow label="体重" :value="isProtagonist ? '70 kg' : '48 kg'" />
          <StatRow v-if="!isProtagonist" label="三围" value="B88 W58 H89" />
          <StatRow label="体质" :value="isProtagonist ? '规则免疫' : '敏感型'" />
        </div>
        <div v-if="!isProtagonist" class="stat-bars">
          <StatBar label="好感度 AFFECTION" value="42/100" :percentage="42" />
          <StatBar label="发情值 LUST" value="75/100" :percentage="75" />
          <StatBar label="性癖开发值 FETISH" value="15/100" :percentage="15" />
        </div>
        <div v-else class="protagonist-note">
          主角不受常规属性限制。
        </div>
      </article>

      <!-- Psychology -->
      <article class="detail-card">
        <div class="card-title">
          <i class="fa-solid fa-brain"></i>
          <h3>心理状态</h3>
        </div>
        <div class="psych-content">
          <div class="thought-section">
            <span class="section-label">当前想法</span>
            <p class="thought-text">
              {{ isProtagonist ? '"这个世界的规则，由我来制定。"' : '"为什么身体会这么奇怪...明明不想发出那种声音的..."' }}
            </p>
          </div>
          <div class="traits-section">
            <span class="section-label">性格特征</span>
            <div class="badges">
              <template v-if="isProtagonist">
                <Badge text="掌控者" highlight />
                <Badge text="冷静" />
                <Badge text="观察者" />
              </template>
              <template v-else>
                <Badge text="傲娇" />
                <Badge text="高自尊" />
                <Badge text="容易害羞" />
              </template>
            </div>
          </div>
        </div>
      </article>

      <!-- Fetishes -->
      <article v-if="!isProtagonist" class="detail-card">
        <div class="card-title">
          <i class="fa-solid fa-heart"></i>
          <h3>性癖与敏感带</h3>
        </div>
        <div class="fetish-content">
          <div class="sensitive-section">
            <span class="section-label">敏感部位</span>
            <div class="badges">
              <Badge text="耳垂 (Lv.3)" highlight />
              <Badge text="后颈 (Lv.2)" />
              <Badge text="大腿内侧 (Lv.4)" highlight />
            </div>
          </div>
          <div class="hidden-fetish">
            <span class="section-label">隐藏性癖</span>
            <p>表面上抗拒，但内心深处对被强制命令有微弱的期待。</p>
          </div>
        </div>
      </article>
    </div>

    <!-- Affected Rules -->
    <article v-if="!isProtagonist" class="rules-card">
      <div class="rules-header">
        <div class="title-group">
          <i class="fa-solid fa-shield-exclamation"></i>
          <h3>当前受影响规则</h3>
        </div>
        <button id="btn-manage-rules" class="manage-btn" @click="$emit('openModal', 'manage_rules')">
          管理规则影响
        </button>
      </div>
      <div class="rules-grid">
        <RuleCard type="world" title="猫娘语癖" desc="所有女性说话最后一个字必须用喵结尾。" active />
        <RuleCard type="regional" title="圣华女学院：生理报告" desc="上课时上厕所必须提前报告，报告内容为羞辱自己的话语。" active />
        <RuleCard type="personal" title="赤足禁忌" desc="永远不能穿鞋子，必须时刻感受地面的触感。" active />
      </div>
    </article>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import StatRow from './StatRow.vue';
import StatBar from './StatBar.vue';
import Badge from './Badge.vue';
import RuleCard from './RuleCard.vue';

const props = defineProps<{
  characterId: string;
}>();

const isProtagonist = computed(() => props.characterId === 'CHR-000');
const name = computed(() => isProtagonist.value ? '玩家 (你)' : '神宫寺 琉璃');

defineEmits<{
  (e: 'back'): void;
  (e: 'openModal', type: string): void;
}>();
</script>

<style lang="scss" scoped>
.character-detail {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-bottom: 80px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #a1a1aa;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
  width: fit-content;

  &:hover {
    color: #fff;
  }
}

:global(.light) .back-btn:hover {
  color: #18181b;
}

.profile-header {
  display: flex;
  align-items: flex-end;
  gap: 24px;

  .avatar-edit {
    width: 128px;
    height: 128px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);

    i {
      font-size: 48px;
      color: #52525b;
      transition: transform 0.5s ease;
    }

    &:hover i {
      transform: scale(1.1);
    }

    .edit-overlay {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s;

      i {
        font-size: 20px;
        color: #fff;
        transform: none;
      }
    }

    &:hover .edit-overlay {
      opacity: 1;
    }
  }

  .profile-info {
    flex: 1;
    padding-bottom: 8px;

    .name-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;

      h2 {
        font-size: 36px;
        font-weight: 700;
        letter-spacing: -0.02em;
        color: #fff;
      }

      .protagonist-tag {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
        font-size: 12px;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 500;
        letter-spacing: 0.1em;
      }
    }

    .meta {
      font-size: 14px;
      color: #a1a1aa;
      font-family: monospace;
    }
  }
}

:global(.light) .profile-header {
  .avatar-edit {
    border-color: rgba(0, 0, 0, 0.1);
    background: #f4f4f5;
  }

  .profile-info .name-row h2 {
    color: #18181b;
  }

  .protagonist-tag {
    background: rgba(0, 0, 0, 0.1);
    color: #18181b;
  }
}

.edit-btn {
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
  margin-bottom: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

:global(.light) .edit-btn {
  background: rgba(0, 0, 0, 0.05);
  color: #27272a;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.detail-card {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);
  display: flex;
  flex-direction: column;
  gap: 24px;

  .card-title {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    i {
      font-size: 20px;
      color: #d4d4d8;
    }

    h3 {
      font-size: 18px;
      font-weight: 500;
      color: #f4f4f5;
    }
  }
}

:global(.light) .detail-card {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;

  .card-title {
    border-color: rgba(0, 0, 0, 0.1);

    i { color: #52525b; }
    h3 { color: #18181b; }
  }
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

:global(.light) .stat-bars {
  border-color: rgba(0, 0, 0, 0.05);
}

.protagonist-note {
  text-align: center;
  padding: 16px 0;
  color: #71717a;
  font-size: 14px;
}

.psych-content,
.fetish-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thought-section {
  .section-label {
    display: block;
    font-size: 12px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  .thought-text {
    font-size: 14px;
    color: #d4d4d8;
    font-style: italic;
    line-height: 1.6;
  }
}

:global(.light) .thought-section .thought-text {
  color: #3f3f46;
}

.traits-section,
.sensitive-section {
  .section-label {
    display: block;
    font-size: 12px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 12px;
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.hidden-fetish {
  .section-label {
    display: block;
    font-size: 12px;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: #d4d4d8;
    line-height: 1.6;
  }
}

:global(.light) .hidden-fetish p {
  color: #3f3f46;
}

.rules-card {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);

  .rules-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 24px;

    .title-group {
      display: flex;
      align-items: center;
      gap: 12px;

      i {
        font-size: 20px;
        color: #d4d4d8;
      }

      h3 {
        font-size: 18px;
        font-weight: 500;
        color: #f4f4f5;
      }
    }

    .manage-btn {
      font-size: 12px;
      color: #a1a1aa;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #fff;
      }
    }
  }
}

:global(.light) .rules-card {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;

  .rules-header {
    border-color: rgba(0, 0, 0, 0.1);

    .title-group {
      i { color: #52525b; }
      h3 { color: #18181b; }
    }

    .manage-btn {
      color: #71717a;

      &:hover {
        color: #18181b;
      }
    }
  }
}

.rules-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
