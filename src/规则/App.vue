<template>
  <!-- 开局表单界面 -->
  <OpeningForm
    v-if="gamePhase === GamePhase.OPENING"
    :key="openingFormKey"
    @submit="handleOpeningSubmit"
  />

  <!-- 游戏主界面 -->
  <div
    v-else-if="gamePhase === GamePhase.GAME"
    id="app-root"
    class="rule-modifier"
    :class="{ 'dark': isDarkMode, 'light': !isDarkMode }"
    :style="rootStyle"
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
        <button id="nav-settings" class="nav-btn" :class="{ active: activeTab === 'settings' }" @click.stop="toggleTab('settings')">
          <span v-if="activeTab === 'settings'" class="active-indicator"></span>
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
              <CharacterPanel
                v-if="activeTab === 'character'"
                @open-modal="openModal"
                @copy-to-input="copyToInput"
              />
              <WorldRulesPanel v-else-if="activeTab === 'world_rules'" @open-modal="openModal" />
              <RegionalRulesPanel v-else-if="activeTab === 'regional_rules'" @open-modal="openModal" />
              <PersonalRulesPanel v-else-if="activeTab === 'personal_rules'" @open-modal="openModal" />
              <SettingsPanel
                v-else-if="activeTab === 'settings'"
                :is-dark-mode="isDarkMode"
                @mode-change="onOutputModeChange"
                @update-worldbook="onUpdateWorldbook"
                @layout-change="onLayoutChange"
              />
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
          <h2>游戏正文</h2>
        </div>
        <div class="header-actions">
          <button
            class="header-btn"
            :class="{ active: viewMode === 'reader' }"
            @click="toggleReaderMode"
            title="阅读模式"
          >
            <i class="fa-solid fa-book-open"></i>
          </button>
          <button
            class="header-btn"
            :class="{ active: viewMode === 'save' }"
            @click="toggleSaveMode"
            title="读档/创建分支"
          >
            <i class="fa-solid fa-floppy-disk"></i>
          </button>
          <button class="header-btn" @click="refreshMessage" title="刷新内容">
            <i class="fa-solid fa-rotate-right"></i>
          </button>
          <button
            v-if="!mainText && !isGenerating && !isRegenerating"
            class="header-btn header-btn-recover"
            type="button"
            title="正文为空时：撤回最后一条用户发言并填入酒馆输入框"
            @click="onRecoverLastUserMessage"
          >
            <i class="fa-solid fa-arrow-rotate-left"></i>
          </button>
          <button class="header-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏'">
            <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
          </button>
        </div>
      </div>

      <div class="game-content">
        <!-- 普通模式：正文 + 选项 -->
        <template v-if="viewMode === 'normal'">
          <!-- 重ROLL 遮罩：仅覆盖主内容区，不挡侧边栏；结束会正常弹出标签检验 -->
          <div v-if="isRegenerating" class="regenerate-overlay" :class="{ dark: isDarkMode, light: !isDarkMode }">
            <i class="fa-solid fa-circle-notch fa-spin regenerate-spin"></i>
            <span>正在重ROLL，请稍等...</span>
          </div>
          <div class="turn-layout">
            <!-- 正文滚动区域（重ROLL 时虚化） -->
            <div class="maintext-area" :class="{ 'is-blurred': isRegenerating }">
              <!-- 生成中提示 -->
              <div v-if="isGenerating && !mainText" class="generating-indicator">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <span>AI 正在思考...</span>
              </div>
              <!-- 正文内容（长按显示重roll/编辑） -->
              <div
                v-else-if="mainText"
                class="maintext-container"
                :class="{ dark: isDarkMode, light: !isDarkMode, 'can-long-press': hasValidMessageId() }"
                @mousedown="onMaintextMouseDown"
                @mouseup="onMaintextLongPressEnd"
                @mouseleave="onMaintextLongPressEnd"
                @touchstart="onMaintextTouchStart"
                @touchmove="onMaintextTouchMove"
                @touchend="onMaintextLongPressEnd"
                @touchcancel="onMaintextLongPressEnd"
                @contextmenu.prevent
              >
                <div class="maintext-content" v-html="mainText"></div>
              </div>
              <!-- 空状态 -->
              <div v-else class="maintext-placeholder">
                <p>暂无内容...</p>
                <p class="hint">在下方输入框输入消息或点击选项开始游戏</p>
              </div>
            </div>

            <!-- 选项栏：固定在最底部（输入框上方），不参与正文滚动 -->
            <div v-if="options.length > 0" class="options-area">
              <button class="options-toggle" @click="toggleOptions">
                <i :class="isOptionsExpanded ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'"></i>
                <span>选择你的行动 ({{ options.length }})</span>
              </button>
              <Transition name="slide">
                <div v-show="isOptionsExpanded" class="options-list">
                  <button
                    v-for="option in options"
                    :key="option.id"
                    class="option-btn"
                    @click="selectOption(option.id)"
                  >
                    <span class="option-id">{{ option.id }}</span>
                    <span class="option-text">{{ option.text }}</span>
                  </button>
                </div>
              </Transition>
            </div>
          </div>

        </template>

        <!-- 阅读模式：显示所有楼层的 maintext -->
        <template v-else-if="viewMode === 'reader'">
          <div class="reader-mode">
            <div class="mode-header">
              <h3>📚 阅读模式</h3>
              <p>显示所有历史正文内容</p>
            </div>
            <div class="history-list">
              <div
                v-for="item in maintextHistory"
                :key="item.messageId"
                class="history-item"
              >
                <div class="history-meta">
                  <span class="turn-badge" v-if="item.turnNumber !== undefined">回合 {{ item.turnNumber }}</span>
                  <span>楼层 #{{ item.messageId }} · {{ item.timestamp }}</span>
                </div>
                <div class="history-content" v-html="item.maintext"></div>
              </div>
              <div v-if="maintextHistory.length === 0" class="empty-state">
                暂无历史正文记录<br>
                <small>（需要 AI 回复包含 &lt;maintext&gt; 标签的消息）</small>
              </div>
            </div>
          </div>
        </template>

        <!-- 读档模式：显示所有楼层的 sum -->
        <template v-else-if="viewMode === 'save'">
          <div class="save-mode">
            <div class="mode-header">
              <h3>💾 读档模式</h3>
              <p>点击回合创建分支，从此处继续游戏</p>
            </div>
            <div class="history-list">
              <div
                v-for="item in saveHistory"
                :key="item.messageId"
                class="history-item save-item"
                @click="createBranch(item.messageId, item.turnNumber)"
              >
                <div class="history-meta">
                  <span class="turn-badge">回合 {{ item.turnNumber }}</span>
                  <span>楼层 #{{ item.messageId }} · {{ item.timestamp }}</span>
                </div>
                <div class="history-content">{{ item.sum }}</div>
                <div class="branch-hint">
                  <i class="fa-solid fa-code-branch"></i>
                  <span>点击从此回合创建分支</span>
                </div>
              </div>
              <div v-if="saveHistory.length === 0" class="empty-state">
                暂无存档记录<br>
                <small>（需要 AI 回复包含 &lt;sum&gt; 标签的消息）</small>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="input-area">
        <div class="input-wrapper">
          <textarea
            id="llm-input"
            v-model="userInput"
            placeholder="输入指令或描述..."
            rows="1"
            :disabled="isGenerating"
            @keydown.enter.prevent="sendMessage"
          />
          <button
            id="btn-send-llm"
            class="send-btn"
            :disabled="isGenerating || !userInput.trim()"
            @click="sendMessage"
          >
            <i v-if="isGenerating" class="fa-solid fa-circle-notch fa-spin"></i>
            <span v-else>发送</span>
          </button>
        </div>
      </div>

      <!-- 右下角：变量更新提示（查看当前楼层 UpdateVariable 内容） -->
      <button
        v-if="viewMode === 'normal'"
        type="button"
        class="variable-fab"
        :class="{ dark: isDarkMode, light: !isDarkMode }"
        @click="openVariableUpdateDialog"
        title="查看当前楼层变量更新（UpdateVariable）"
      >
        <i class="fa-solid fa-code"></i>
        <span class="variable-fab-text">变量</span>
      </button>
    </main>

    <!-- Modals：左上角绿色编辑完成，右上角红色取消 -->
    <Transition name="modal">
      <div v-if="isModalOpen" id="modal-overlay" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content rule-modal-content" :class="{ dark: isDarkMode, light: !isDarkMode }">
          <div class="modal-header rule-modal-header">
            <button type="button" class="btn-complete" @click="onModalComplete">
              <i class="fa-solid fa-check"></i>
              <span>编辑完成</span>
            </button>
            <h2>{{ modalTitle }}</h2>
            <button type="button" id="btn-cancel-modal" class="btn-cancel" @click="closeModal">
              <i class="fa-solid fa-xmark"></i>
              <span>取消</span>
            </button>
          </div>
          <div class="modal-body">
            <!-- 新增角色 -->
            <div v-if="modalType === 'add_character'" class="rule-form">
              <label class="form-label">角色描写</label>
              <textarea
                v-model="modalForm.addCharacterDescription"
                class="form-textarea"
                rows="6"
                placeholder="输入一段角色描写（如外貌、身份、性格等）..."
              />
            </div>
            <!-- 新增世界规则 -->
            <div v-else-if="modalType === 'add_world_rule'" class="rule-form">
              <label class="form-label">规则名称</label>
              <input v-model="modalForm.worldRuleName" type="text" class="form-input" placeholder="输入世界规则名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.worldRuleDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入规则细节描述..."
              />
            </div>
            <!-- 编辑世界规则 -->
            <div v-else-if="modalType === 'edit_world_rule'" class="rule-form">
              <label class="form-label">规则名称</label>
              <input v-model="modalForm.worldRuleName" type="text" class="form-input" placeholder="输入世界规则名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.worldRuleDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入规则细节描述..."
              />
            </div>
            <!-- 新增区域 -->
            <div v-else-if="modalType === 'add_region'" class="rule-form">
              <label class="form-label">区域名称</label>
              <input v-model="modalForm.regionName" type="text" class="form-input" placeholder="输入区域名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.regionDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入该区域的规则细节..."
              />
            </div>
            <!-- 编辑区域 -->
            <div v-else-if="modalType === 'edit_region'" class="rule-form">
              <label class="form-label">区域名称</label>
              <input v-model="modalForm.regionName" type="text" class="form-input" placeholder="输入区域名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.regionDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入该区域的规则细节..."
              />
            </div>
            <!-- 新增区域规则 -->
            <div v-else-if="modalType === 'add_region_rule'" class="rule-form">
              <label class="form-label">所属区域</label>
              <input v-model="modalForm.regionName" type="text" class="form-input" disabled />
              <label class="form-label">规则名称</label>
              <input v-model="modalForm.regionRuleName" type="text" class="form-input" placeholder="输入规则名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.regionRuleDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入该规则的细节..."
              />
            </div>
            <!-- 编辑区域规则 -->
            <div v-else-if="modalType === 'edit_region_rule'" class="rule-form">
              <label class="form-label">所属区域</label>
              <input v-model="modalForm.regionName" type="text" class="form-input" disabled />
              <label class="form-label">规则名称</label>
              <input v-model="modalForm.regionRuleName" type="text" class="form-input" placeholder="输入规则名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.regionRuleDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入该规则的细节..."
              />
            </div>
            <!-- 新增个人规则 -->
            <div v-else-if="modalType === 'add_personal_rule'" class="rule-form">
              <label class="form-label">对象（角色名）</label>
              <input v-model="modalForm.personalRuleCharacter" type="text" class="form-input" placeholder="输入适用角色/对象名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.personalRuleDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入个人规则细节..."
              />
            </div>
            <!-- 编辑个人规则 -->
            <div v-else-if="modalType === 'edit_personal_rule'" class="rule-form">
              <label class="form-label">对象（角色名）</label>
              <input v-model="modalForm.personalRuleCharacter" type="text" class="form-input" placeholder="输入适用角色/对象名称" />
              <label class="form-label">规则细节</label>
              <textarea
                v-model="modalForm.personalRuleDetail"
                class="form-textarea"
                rows="4"
                placeholder="输入个人规则细节..."
              />
            </div>
            <!-- 编辑心理状态 -->
            <div v-else-if="modalType === 'edit_character_mind'" class="rule-form">
              <label class="form-label">当前内心想法</label>
              <textarea
                v-model="modalForm.characterPsychThought"
                class="form-textarea"
                rows="3"
                placeholder="输入该角色当前的内心想法..."
              />

              <label class="form-label">性格（每行一个标签）</label>
              <textarea
                v-model="modalForm.characterPsychTraits"
                class="form-textarea"
                rows="3"
                placeholder="例如：傲娇\n高自尊\n容易害羞"
              />
            </div>
            <!-- 编辑性癖与敏感带 -->
            <div v-else-if="modalType === 'edit_character_fetish'" class="rule-form">
              <label class="form-label">敏感部位（每行一个标签）</label>
              <textarea
                v-model="modalForm.characterPsychSensitiveParts"
                class="form-textarea"
                rows="3"
                placeholder="例如：耳垂(Lv.3)\n后颈(Lv.2)"
              />

              <label class="form-label">性癖（每行一个标签）</label>
              <textarea
                v-model="modalForm.characterPsychFetishes"
                class="form-textarea"
                rows="3"
                placeholder="例如：命令\n羞辱\n足控"
              />

              <label class="form-label">隐藏性癖</label>
              <textarea
                v-model="modalForm.characterPsychHiddenFetish"
                class="form-textarea"
                rows="3"
                placeholder="输入隐藏性癖描述..."
              />
            </div>
            <div v-else class="modal-placeholder">
              <p>未配置的弹窗类型：<code>{{ modalType }}</code></p>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 长按正文：上下文菜单 -->
    <Teleport to="body">
      <div
        v-if="contextMenu"
        class="context-menu maintext-context-menu"
        :class="{ dark: isDarkMode, light: !isDarkMode }"
        :style="contextMenuStyle"
        @click.stop
      >
        <div class="context-menu-header">
          <span>操作</span>
          <button type="button" class="context-menu-close" @click="closeContextMenu">×</button>
        </div>
        <button
          type="button"
          class="context-menu-item"
          :disabled="isGenerating"
          @click="handleRegenerate"
        >
          {{ isGenerating ? '⏳ 处理中...' : '🔄 重roll' }}
        </button>
        <button
          type="button"
          class="context-menu-item"
          :disabled="isGenerating"
          @click="handleRegenerateVariablesOnly"
        >
          {{ isGenerating ? '⏳ 处理中...' : '🎲 单独重roll变量' }}
        </button>
        <button
          type="button"
          class="context-menu-item"
          :disabled="isGenerating"
          @click="handleEdit"
        >
          ✏️ 修改正文
        </button>
      </div>
    </Teleport>

    <!-- 编辑正文模态框 -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="editingMessage"
          class="edit-maintext-overlay"
          @click.self="closeEditModal"
        >
          <div class="edit-maintext-modal" :class="{ dark: isDarkMode, light: !isDarkMode }">
            <div class="edit-maintext-header">
              <h2>编辑正文</h2>
              <button type="button" class="close-btn" @click="closeEditModal">×</button>
            </div>
            <div class="edit-maintext-body">
              <textarea
                v-if="editingMessage"
                v-model="editingText"
                class="edit-maintext-textarea"
                rows="16"
                placeholder="正文内容..."
              />
              <div class="edit-maintext-actions">
                <button type="button" class="btn-secondary" @click="closeEditModal">取消</button>
                <button type="button" class="btn-primary" @click="handleSaveEdit">保存</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 单独重roll变量：预览/编辑弹窗（确认后才写回楼层） -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="variableRerollDialogOpen"
          class="edit-maintext-overlay"
          @click.self="closeVariableRerollDialog"
        >
          <div class="edit-maintext-modal" :class="{ dark: isDarkMode, light: !isDarkMode }">
            <div class="edit-maintext-header">
              <h2>单独重roll变量预览</h2>
              <button type="button" class="close-btn" @click="closeVariableRerollDialog">×</button>
            </div>
            <div class="edit-maintext-body">
              <div class="variable-reroll-hint">
                <p>这里是本次重roll生成的 <code>&lt;UpdateVariable&gt;</code> 内容（JSON Patch）。你可以直接修改，确认后才会应用到当前楼层变量。</p>
              </div>
              <textarea
                v-model="variableRerollPatchText"
                class="edit-maintext-textarea"
                rows="16"
                placeholder='例如：[{ "op": "replace", "path": "/元信息/进度", "value": 5 }]'
              />
              <div class="edit-maintext-actions">
                <button type="button" class="btn-secondary" @click="closeVariableRerollDialog">取消</button>
                <button type="button" class="btn-primary" :disabled="isGenerating" @click="confirmVariableRerollApply">
                  {{ isGenerating ? '处理中...' : '确认应用' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- 当前楼层：变量更新查看弹窗（只读） -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="variableUpdateDialogOpen"
          class="edit-maintext-overlay"
          @click.self="closeVariableUpdateDialog"
        >
          <div class="edit-maintext-modal" :class="{ dark: isDarkMode, light: !isDarkMode }">
            <div class="edit-maintext-header">
              <h2>本楼层变量更新（UpdateVariable）</h2>
              <button type="button" class="close-btn" @click="closeVariableUpdateDialog">×</button>
            </div>
            <div class="edit-maintext-body">
              <div class="variable-reroll-hint">
                <p>这里展示的是当前楼层消息里 <code>&lt;UpdateVariable&gt;</code> 标签内部的原始内容（通常是 JSON Patch）。</p>
              </div>
              <textarea
                v-model="variableUpdateDialogText"
                class="edit-maintext-textarea"
                rows="16"
                readonly
                placeholder="当前楼层没有 UpdateVariable 内容"
              />
              <div class="edit-maintext-actions">
                <button type="button" class="btn-secondary" @click="closeVariableUpdateDialog">关闭</button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>

  <!-- 全局覆盖层（不受 gamePhase 影响） -->
  <Teleport to="body">
    <!-- 开场白生成中弹窗 -->
    <div
      v-if="isGeneratingOpening"
      class="opening-generating-overlay"
      :class="{ 'dark': isDarkMode, 'light': !isDarkMode }"
    >
      <div class="opening-generating-content">
        <i class="fa-solid fa-circle-notch fa-spin"></i>
        <span class="opening-generating-text">正在生成开场白...</span>
        <span class="opening-generating-hint">AI 正在根据您的设定创作故事</span>
      </div>
    </div>

    <!-- 标签验证弹窗（开局/游戏阶段都可显示） -->
    <Transition name="modal">
      <div v-if="isTagDialogOpen" class="modal-overlay tag-validation-overlay">
        <div class="modal-content tag-validation-modal" :class="{ dark: isDarkMode, light: !isDarkMode }">
          <div class="modal-header">
            <h2><i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i> 标签验证结果</h2>
            <button class="close-btn" @click="onTagDialogCloseAttempt">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="tag-validation-content">
              <p class="validation-intro">AI 输出标签检核结果：</p>

              <div class="ai-output-time" v-if="lastGenerationDurationLabel">
                本次生成耗时：{{ lastGenerationDurationLabel }}
              </div>

              <div class="tag-status-list">
                <div
                  v-for="result in tagCheckResults"
                  :key="result.tag"
                  class="tag-status-item"
                  :class="{ 'is-valid': result.isValid, 'is-invalid': !result.isValid }"
                >
                  <div class="tag-status-header">
                    <span class="tag-name">
                      {{ tagCheckLabel(result.tag) }}
                      <span class="tag-name-code">&lt;{{ result.tag }}&gt;</span>
                    </span>
                    <span class="tag-badge" :class="{ 'badge-success': result.isValid, 'badge-error': !result.isValid }">
                      {{ result.isValid ? '✓ 正常' : '✗ 异常' }}
                    </span>
                  </div>
                  <p class="tag-message" :title="result.message">{{ result.message }}</p>
                </div>
              </div>

              <div class="validation-warning" v-if="tagCheckHasBlockingInvalid(tagCheckResults)">
                <i class="fa-solid fa-circle-exclamation"></i>
                <span>存在格式错误的消息可能无法正常显示。建议回退后重试。</span>
              </div>

              <!-- AI 完整输出内容展示 -->
              <div class="ai-output-section">
                <button class="ai-output-toggle" @click="showAiOutput = !showAiOutput">
                  <i :class="showAiOutput ? 'fa-solid fa-chevron-down' : 'fa-solid fa-chevron-right'"></i>
                  <span>{{ showAiOutput ? '隐藏 AI 完整输出' : '查看 AI 完整输出' }}</span>
                  <span class="output-length">({{ lastGenerationRaw.length }} 字符)</span>
                </button>
                <Transition name="slide">
                  <div v-show="showAiOutput" class="ai-output-content">
                    <pre class="ai-output-text">{{ lastGenerationRaw }}</pre>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
          <div class="modal-footer tag-validation-footer">
            <button class="btn-secondary btn-rollback" @click="onTagDialogRollback">
              <i class="fa-solid fa-rotate-left"></i>
              回退到发送前
            </button>
            <button class="btn-primary btn-continue" @click="onTagDialogConfirmClick">
              <i class="fa-solid fa-check"></i>
              {{ tagCheckHasBlockingInvalid(tagCheckResults) ? '无视错误确认' : '确认信息' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- 末尾为玩家楼层检测（重载/异常时便于删楼重生成） -->
    <Transition name="modal">
      <div
        v-if="orphanUserFloorDialogOpen"
        class="modal-overlay orphan-user-floor-overlay"
        :class="{ dark: isDarkMode, light: !isDarkMode }"
        @click.self="dismissOrphanUserFloorDialog"
      >
        <div class="modal-content orphan-user-floor-modal" :class="{ dark: isDarkMode, light: !isDarkMode }">
          <div class="modal-header">
            <h2><i class="fa-solid fa-triangle-exclamation" style="color: #f59e0b;"></i> 末尾楼层为玩家发言</h2>
            <button type="button" class="close-btn" @click="dismissOrphanUserFloorDialog">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="modal-body">
            <p class="orphan-user-floor-intro">
              检测到聊天<strong>最后一楼可见消息</strong>不是 AI 回复（玩家消息）。常见于界面异常、重载后未接上生成等情况。
            </p>
            <p v-if="orphanUserFloorMessageId != null" class="orphan-user-floor-meta">
              将删除楼层：<code>#{{ orphanUserFloorMessageId }}</code>
            </p>
            <p class="orphan-user-floor-hint">
              确认后将删除该条玩家发言并刷新正文；请在<strong>酒馆中点击继续生成</strong>（或使用本界面输入后发送）以重新获取 AI 回复。
            </p>
          </div>
          <div class="modal-footer orphan-user-floor-footer">
            <button type="button" class="btn-secondary" @click="dismissOrphanUserFloorDialog">暂不处理</button>
            <button type="button" class="btn-primary" @click="confirmOrphanUserFloorDelete">确认删除</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import CharacterPanel from './components/CharacterPanel.vue';
import WorldRulesPanel from './components/WorldRulesPanel.vue';
import RegionalRulesPanel from './components/RegionalRulesPanel.vue';
import PersonalRulesPanel from './components/PersonalRulesPanel.vue';
import SettingsPanel from './components/SettingsPanel.vue';
import OpeningForm from './components/OpeningForm.vue';
import {
  loadFromLatestMessage,
  parseMaintext,
  parseOptions,
  validateTags,
  isFilteringComplete,
  extractFilteredContent,
  type Option,
  type TagCheckResult
} from './utils/messageParser';
import { GamePhase, type OpeningFormData, type OutputMode } from './types';
import {
  initializeGameVariables,
  createOpeningStoryMessage,
  isNewGame,
} from './utils/gameInitializer';
import { updateWorldbookEntriesByMode, isSecondaryApiConfigured } from './utils/apiSettings';
import { startIframeHeightFix } from './utils/iframeHeightFix';

// 游戏阶段管理
const gamePhase = ref<GamePhase>(GamePhase.OPENING);
const isInitializing = ref(false);
const isGeneratingOpening = ref(false); // 开场白生成中（显示加载弹窗）
const isOpeningPhase = ref(false); // 标志当前是否处于开局流程（用于标签弹窗区分）
const openingFormKey = ref(0); // 强制重置 OpeningForm（用于回退/失败后取消“开始游戏”转圈）

// 宿主会反复把同层 iframe 高度改成很小值（如 72px），需要在进入游戏阶段后兜底保持最小高度。
let stopIframeHeightFix: (() => void) | null = null;

// 界面状态
const activeTab = ref<string | null>(null);
const isModalOpen = ref(false);
const modalType = ref('');
const modalPayload = ref<Record<string, any> | null>(null);
const isDarkMode = ref(true);

/**
 * 立刻请求全屏（必须在用户点击回调内触发，不能先 await）
 * 用于开局“确认信息”按钮，避免异步流程导致手势上下文丢失。
 */
function requestFullscreenNow(): void {
  try {
    if (document.fullscreenElement) return;
    const docEl = document.documentElement as any;
    if (docEl?.requestFullscreen) {
      // 不要 await，确保仍处于用户手势上下文
      docEl.requestFullscreen().catch?.(() => {});
      return;
    }
  } catch (e) {
    // 忽略，继续走降级方案
  }

  // 降级：尝试对父窗口中本 iframe 进入全屏
  try {
    if (window.parent && window.parent !== window) {
      const parentDoc = window.parent.document;
      const iframe = parentDoc.querySelector('iframe#' + getIframeName()) as any;
      if (iframe?.requestFullscreen && !parentDoc.fullscreenElement) {
        iframe.requestFullscreen().catch?.(() => {});
      }
    }
  } catch (e) {
    // 忽略
  }
}

function onTagDialogConfirmClick(): void {
  // 方案 A：点击“确认信息”当下立刻尝试全屏（只在开局流程强制）
  if (isOpeningPhase.value) {
    requestFullscreenNow();
  }
  // 继续原来的确认流程（不要 await，避免影响全屏手势）
  void onTagDialogIgnore();
}

// 布局/缩放设置（来自系统设置）
const uiLayout = ref({
  scale: 0.8,
  maxWidth: 900,
  heightMode: 'fit' as 'fit' | 'custom',
  maxHeight: 400,
});

const rootStyle = computed(() => {
  const scale = Number(uiLayout.value.scale) || 1;

  // 全屏时使用视口尺寸，非全屏时使用用户设置
  const isFS = isFullscreen.value;
  const maxWidth = isFS
    ? '100vw' // 全屏时占满视口宽度
    : `${Math.round(Number(uiLayout.value.maxWidth) || 900)}px`;

  const maxHeight = isFS
    ? '100vh' // 全屏时占满视口高度
    : '600px';

  return {
    '--ui-scale': String(scale),
    '--ui-max-width': maxWidth,
    '--ui-max-height': maxHeight,
  } as Record<string, string>;
});

// 弹窗表单数据（按类型复用）
const modalForm = ref({
  addCharacterDescription: '',
  worldRuleName: '',
  worldRuleDetail: '',
  regionName: '',
  regionDetail: '',
  regionRuleName: '',
  regionRuleDetail: '',
  personalRuleCharacter: '',
  personalRuleDetail: '',
  characterPsychThought: '',
  characterPsychTraits: '',
  characterPsychFetishes: '',
  characterPsychSensitiveParts: '',
  characterPsychHiddenFetish: '',
});

// 同层界面状态
const userInput = ref('');
const isGenerating = ref(false);
const isRegenerating = ref(false); // 重 roll 中，用于显示「正在重ROLL请稍等」遮罩与正文虚化
const streamTextBuffer = ref('');

// 游戏消息相关状态
const mainText = ref('');
const options = ref<Option[]>([]);
const currentMessageId = ref<number | undefined>(undefined);
const isOptionsExpanded = ref(false); // 选项列表是否展开

// 视图模式
const viewMode = ref<'normal' | 'reader' | 'save'>('normal'); // 正常 | 阅读模式 | 读档模式
const isFullscreen = ref(false); // 是否全屏

// 阅读模式数据
const maintextHistory = ref<Array<{ messageId: number; maintext: string; turnNumber?: number; timestamp?: string }>>([]);

// 读档模式数据
const saveHistory = ref<Array<{ messageId: number; sum: string; turnNumber?: number; timestamp?: string }>>([]);

// 标签验证弹窗状态
const isTagDialogOpen = ref(false);
const tagCheckResults = ref<TagCheckResult[]>([]);
const lastGenerationRaw = ref('');
const lastGenerationDurationLabel = ref('');
/** 本次 AI 请求开始时刻（含主 generate + 双 API 第二段），用于弹窗显示耗时 */
const aiGenerationStartMs = ref(0);
const lastUserInputSnapshot = ref('');
const lastMaintextSnapshot = ref('');
const lastOptionsSnapshot = ref<Option[]>([]);
const lastMessageIdSnapshot = ref<number | undefined>(undefined);
const pendingUserMessageId = ref<number | null>(null);
const showAiOutput = ref(false); // 是否展开显示AI完整输出

/** 末尾为玩家楼层：弹窗与本次会话内「已忽略」的 message_id */
const orphanUserFloorDialogOpen = ref(false);
const orphanUserFloorMessageId = ref<number | null>(null);
const orphanUserFloorDismissedMid = ref<number | null>(null);

// 长按正文：上下文菜单与编辑
const contextMenu = ref<{ x: number; y: number } | null>(null);
const editingMessage = ref<{
  messageId: number;
  fullMessage: string;
} | null>(null);
const editingText = ref(''); // 编辑中的正文，单独 ref 保证 v-model 响应
const currentMessageInfo = ref<{
  messageId?: number;
  userMessageId?: number;
  fullMessage?: string;
}>({});
const longPressTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);
const maintextTouchStartPos = ref<{ x: number; y: number } | null>(null);

// 单独重roll变量：预览/编辑与待提交数据
const variableRerollDialogOpen = ref(false);
const variableRerollPatchText = ref('');
const pendingVariableReroll = ref<{
  messageId: number;
  filteredMessage: string;
  baseData: any;
  updatedMessage: string;
} | null>(null);

// 当前楼层：变量更新查看弹窗
const variableUpdateDialogOpen = ref(false);
const variableUpdateDialogText = ref('');

// 调试：监听 activeTab 的变化
watch(activeTab, (newVal, oldVal) => {
  console.log(`[调试] activeTab 变化: ${oldVal} -> ${newVal}`);
}, { immediate: true });

watch(
  gamePhase,
  (phase) => {
    if (phase === GamePhase.GAME) {
      stopIframeHeightFix?.();
      stopIframeHeightFix = startIframeHeightFix({ minHeightPx: 600 });
    } else {
      stopIframeHeightFix?.();
      stopIframeHeightFix = null;
    }
  },
  { immediate: true },
);

// 输出模式变更处理
function onOutputModeChange(mode: OutputMode) {
  console.log(`🔄 [App] 输出模式变更为: ${mode}`);
}

const TAG_CHECK_LABELS: Record<string, string> = {
  thinking: '思考',
  maintext: '正文',
  option: '选项',
  sum: '摘要',
  UpdateVariable: '变量',
};

function tagCheckLabel(tag: string): string {
  return TAG_CHECK_LABELS[tag] ?? tag;
}

/** 摘要 / 变量 为可选标签，其「缺失」不算阻塞；未闭合仍 isValid=false 但沿用原逻辑与 sum 一致不纳入「无视错误」提示条 */
function tagCheckHasBlockingInvalid(results: TagCheckResult[]): boolean {
  return results.some((r) => !r.isValid && r.tag !== 'sum' && r.tag !== 'UpdateVariable');
}

function formatGenerationDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return '不足 1 秒';
  if (ms < 60000) return `${(ms / 1000).toFixed(1)} 秒`;
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const rs = s % 60;
  return `${m} 分 ${String(rs).padStart(2, '0')} 秒`;
}

function onLayoutChange(layout: { scale: number; maxWidth: number; heightMode: 'fit' | 'custom'; maxHeight: number }) {
  uiLayout.value = { ...uiLayout.value, ...layout };
}

// 更新世界书条目
async function onUpdateWorldbook(mode: OutputMode) {
  try {
    console.log(`🔄 [App] 更新世界书条目为 ${mode} 模式`);
    await updateWorldbookEntriesByMode(mode);
    console.log('✅ [App] 世界书条目更新完成');
  } catch (error) {
    console.error('❌ [App] 更新世界书条目失败:', error);
    toastr.error('世界书更新失败');
  }
}

// 点击外部关闭长按上下文菜单
let contextMenuCleanup: (() => void) | null = null;

watch(contextMenu, (menu) => {
  // 清理之前的事件监听
  if (contextMenuCleanup) {
    contextMenuCleanup();
    contextMenuCleanup = null;
  }
  
  if (!menu) return;
  
  // 延迟添加事件监听，避免立即触发
  const timer = setTimeout(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.maintext-context-menu') || target.closest('.maintext-container')) return;
      closeContextMenu();
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };
    
    document.addEventListener('click', handleClickOutside, true);
    document.addEventListener('keydown', handleEscape);
    
    contextMenuCleanup = () => {
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, 100);
  
  return () => {
    clearTimeout(timer);
  };
});

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
  settings: '系统设置',
};

const panelTitle = computed(() => panelTitles[activeTab.value || ''] || '');

const modalTitles: Record<string, string> = {
  add_character: '新增角色',
  add_world_rule: '新增世界规则',
  edit_world_rule: '编辑世界规则',
  add_region: '新增区域',
  edit_region: '编辑区域',
  add_region_rule: '新增区域规则',
  edit_region_rule: '编辑区域规则',
  add_personal_rule: '新增个人规则',
  edit_personal_rule: '编辑个人规则',
  edit_character_mind: '编辑心理状态',
  edit_character_fetish: '编辑性癖与敏感带',
};
const modalTitle = computed(() => modalTitles[modalType.value] || (modalType.value.includes('add') ? '新增条目' : '编辑条目'));

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

async function openModal(type: string, payload?: Record<string, any>) {
  // 删除/归档类：直接执行并关闭，不弹窗
  if (type === 'delete_world_rule' && payload?.title) {
    try {
      const { submitArchiveWorldRule } = await import('./utils/dialogAndVariable');
      await submitArchiveWorldRule(payload.title);
    } catch (e) {
      console.error('归档世界规则失败', e);
      toastr.error('归档失败');
    }
    return;
  }
  if (type === 'delete_region' && payload?.name) {
    try {
      const { submitArchiveRegion } = await import('./utils/dialogAndVariable');
      await submitArchiveRegion(payload.name);
    } catch (e) {
      console.error('归档区域失败', e);
      toastr.error('归档失败');
    }
    return;
  }
  if (type === 'delete_personal_rule' && (payload?.id ?? payload?.title ?? payload?.character)) {
    try {
      const { submitArchivePersonalRule } = await import('./utils/dialogAndVariable');
      await submitArchivePersonalRule(
        payload.id ?? payload.title ?? payload.character,
        payload.character ?? payload.title,
        payload.title !== payload.character ? payload.title : undefined
      );
    } catch (e) {
      console.error('归档个人规则失败', e);
      toastr.error('归档失败');
    }
    return;
  }

  modalType.value = type;
  modalPayload.value = payload ?? null;
  modalForm.value = {
    addCharacterDescription: '',
    worldRuleName: payload?.title ?? '',
    worldRuleDetail: payload?.desc ?? '',
    regionName: payload?.name ?? '',
    regionDetail: payload?.description ?? '',
    regionRuleName: payload?.rule?.title ?? '',
    regionRuleDetail: payload?.rule?.desc ?? '',
    personalRuleCharacter: payload?.title ?? payload?.character ?? '',
    personalRuleDetail: payload?.desc ?? '',
    characterPsychThought: '',
    characterPsychTraits: '',
    characterPsychFetishes: '',
    characterPsychSensitiveParts: '',
    characterPsychHiddenFetish: '',
  };

  if ((type === 'edit_character_mind' || type === 'edit_character_fetish') && payload?.characterId) {
    try {
      const { readCharacters } = await import('./utils/variableReader');
      const list = await readCharacters();
      const c: any = (list || []).find((x: any) => x?.id === payload.characterId);
      if (c) {
        modalForm.value.characterPsychThought = String(c.currentThought ?? '');
        modalForm.value.characterPsychTraits = Array.isArray(c.traits) ? c.traits.join('\n') : '';
        modalForm.value.characterPsychFetishes = Array.isArray(c.fetishes) ? c.fetishes.join('\n') : '';
        modalForm.value.characterPsychSensitiveParts = Array.isArray(c.sensitiveParts) ? c.sensitiveParts.join('\n') : '';
        modalForm.value.characterPsychHiddenFetish = String(c.hiddenFetish ?? '');
      }
    } catch (e) {
      console.warn('预填角色心理字段失败', e);
    }
  }
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  modalPayload.value = null;
}

function copyToInput(text: string) {
  const messageText = String(text ?? '').trim();
  if (!messageText) return;
  userInput.value = messageText;
  toastr.success('修改信息已复制进入对话框');
}

function onCopyToInputEvent(event: Event) {
  const customEvent = event as CustomEvent<{ message?: string }>;
  const messageText = String(customEvent.detail?.message ?? '').trim();
  if (!messageText) return;
  copyToInput(messageText);
}

async function onModalComplete() {
  const type = modalType.value;
  const form = modalForm.value;
  const payload = modalPayload.value;
  let messageText = '';
  try {
    if (type === 'add_character') {
      const { submitAddCharacter } = await import('./utils/dialogAndVariable');
      messageText = await submitAddCharacter(form.addCharacterDescription);
    } else if (type === 'add_world_rule') {
      const { submitAddWorldRule } = await import('./utils/dialogAndVariable');
      messageText = await submitAddWorldRule(form.worldRuleName, form.worldRuleDetail);
    } else if (type === 'edit_world_rule' && (payload?.id ?? payload?.title)) {
      const { submitEditWorldRule } = await import('./utils/dialogAndVariable');
      messageText = await submitEditWorldRule(payload.id ?? payload.title, form.worldRuleName, form.worldRuleDetail);
    } else if (type === 'add_region') {
      const { submitAddRegion } = await import('./utils/dialogAndVariable');
      messageText = await submitAddRegion(form.regionName, form.regionDetail);
    } else if (type === 'edit_region' && (payload?.id ?? payload?.name)) {
      const { submitEditRegion } = await import('./utils/dialogAndVariable');
      messageText = await submitEditRegion(payload.id ?? payload.name, form.regionName, form.regionDetail);
    } else if (type === 'add_region_rule' && (payload?.id ?? payload?.name ?? payload?.regionId ?? payload?.regionName)) {
      const { submitAddRegionalRule } = await import('./utils/dialogAndVariable');
      const regionId = payload.id ?? payload.name ?? payload.regionId ?? payload.regionName;
      const regionName = payload.name ?? payload.regionName ?? form.regionName;
      messageText = await submitAddRegionalRule(regionId, regionName, form.regionRuleName, form.regionRuleDetail);
    } else if (type === 'edit_region_rule' && (payload?.regionId ?? payload?.regionName) && (payload?.rule?.id ?? payload?.rule?.title)) {
      const { submitEditRegionalRule } = await import('./utils/dialogAndVariable');
      messageText = await submitEditRegionalRule(
        payload.regionId ?? payload.regionName,
        payload.regionName,
        payload.rule.id ?? payload.rule.title,
        form.regionRuleName,
        form.regionRuleDetail,
      );
    } else if (type === 'add_personal_rule') {
      const { submitAddPersonalRule } = await import('./utils/dialogAndVariable');
      messageText = await submitAddPersonalRule(form.personalRuleCharacter, form.personalRuleDetail);
    } else if (type === 'edit_personal_rule' && (payload?.id ?? payload?.title ?? payload?.character)) {
      const { submitEditPersonalRule } = await import('./utils/dialogAndVariable');
      messageText = await submitEditPersonalRule(payload.id ?? payload.title ?? payload.character, form.personalRuleCharacter, form.personalRuleDetail);
    } else if (type === 'edit_character_mind' && payload?.characterId) {
      const { submitEditCharacterPsych } = await import('./utils/dialogAndVariable');
      messageText = await submitEditCharacterPsych(payload.characterId, {
        thought: form.characterPsychThought,
        traitsText: form.characterPsychTraits,
      });
    } else if (type === 'edit_character_fetish' && payload?.characterId) {
      const { submitEditCharacterPsych } = await import('./utils/dialogAndVariable');
      messageText = await submitEditCharacterPsych(payload.characterId, {
        fetishesText: form.characterPsychFetishes,
        sensitivePartsText: form.characterPsychSensitiveParts,
        hiddenFetish: form.characterPsychHiddenFetish,
      });
    } else {
      toastr.warning('未知的弹窗类型或缺少数据');
      return;
    }
    // 将生成的文本放入前端输入框
    if (messageText) {
      copyToInput(messageText);
      // 按你的要求：和其他一样写入对话框（创建一条 user 消息）
      if (type === 'edit_character_mind' || type === 'edit_character_fetish') {
        try {
          const { sendToDialog } = await import('./utils/dialogAndVariable');
          await sendToDialog(messageText);
        } catch (e) {
          console.warn('写入对话框失败', e);
        }
      }
    }
    closeModal();
  } catch (e) {
    console.error('弹窗提交失败', e);
    toastr.error('操作失败');
  }
}

// 加载最新消息内容
function loadMessageContent() {
  try {
    const result = loadFromLatestMessage();
    if (result.messageId !== currentMessageId.value) {
      // 只有消息 ID 变化时才更新，避免重复渲染
      mainText.value = result.maintext;
      options.value = result.options;
      currentMessageId.value = result.messageId;
      // 保存当前消息信息（用于长按重roll/编辑）
      currentMessageInfo.value = {
        messageId: result.messageId,
        userMessageId: result.userMessageId,
        fullMessage: result.fullMessage,
      };
      console.log('✅ [App] 已加载最新消息:', result.messageId);
    }
  } catch (error) {
    console.error('❌ [App] 加载消息失败:', error);
  }
}

// 手动刷新消息
function refreshMessage() {
  currentMessageId.value = undefined; // 重置 ID 强制刷新
  loadMessageContent();
  maybeOfferOrphanUserFloorFix();
}

/**
 * 若最后一楼可见消息为玩家发言，则视为异常末端（便于重载后修复）
 */
function getOrphanUserLatestFloor(): { messageId: number } | null {
  try {
    if (typeof getChatMessages !== 'function' || typeof getLastMessageId !== 'function') return null;
    const lastId = getLastMessageId();
    if (lastId < 1) return null;
    const list = getChatMessages(-1, { hide_state: 'unhidden' });
    const latest = list[0];
    if (!latest || latest.role !== 'user') return null;
    if (latest.message_id < 1) return null;
    return { messageId: latest.message_id };
  } catch (e) {
    console.warn('⚠️ [App] 检测末尾玩家楼层失败:', e);
    return null;
  }
}

function maybeOfferOrphanUserFloorFix() {
  if (gamePhase.value !== GamePhase.GAME) return;
  if (
    isGenerating.value ||
    isRegenerating.value ||
    isGeneratingOpening.value ||
    isInitializing.value
  ) {
    return;
  }
  if (
    isTagDialogOpen.value ||
    isModalOpen.value ||
    variableRerollDialogOpen.value ||
    variableUpdateDialogOpen.value ||
    editingMessage.value
  ) {
    return;
  }
  if (contextMenu.value || orphanUserFloorDialogOpen.value) return;

  const info = getOrphanUserLatestFloor();
  if (!info) return;
  if (orphanUserFloorDismissedMid.value === info.messageId) return;

  orphanUserFloorMessageId.value = info.messageId;
  orphanUserFloorDialogOpen.value = true;
  console.info('📋 [App] 已提示：末尾楼层为玩家发言 #', info.messageId);
}

function dismissOrphanUserFloorDialog() {
  if (orphanUserFloorMessageId.value != null) {
    orphanUserFloorDismissedMid.value = orphanUserFloorMessageId.value;
  }
  orphanUserFloorDialogOpen.value = false;
}

async function confirmOrphanUserFloorDelete() {
  const mid = orphanUserFloorMessageId.value;
  if (mid == null) {
    orphanUserFloorDialogOpen.value = false;
    return;
  }
  if (typeof deleteChatMessages !== 'function') {
    toastr.error('deleteChatMessages 不可用');
    return;
  }
  try {
    await deleteChatMessages([mid], { refresh: 'affected' });
    orphanUserFloorDismissedMid.value = null;
    orphanUserFloorDialogOpen.value = false;
    orphanUserFloorMessageId.value = null;
    currentMessageId.value = undefined;
    loadMessageContent();
    toastr.success('已删除该玩家楼层；请在酒馆中继续生成以获取 AI 回复');
  } catch (e) {
    console.error('❌ [App] 删除末尾玩家楼层失败:', e);
    toastr.error('删除失败: ' + String(e));
  }
}

/**
 * 正文为空时：删除最后一条用户发言，将其内容写入酒馆对话框（供重新发送）
 */
async function onRecoverLastUserMessage() {
  const ok = window.confirm(
    '这将删除最后一次的用户发言并且把用户发言放置到对话框内，是否执行。',
  );
  if (!ok) return;

  try {
    if (typeof getLastMessageId !== 'function' || typeof getChatMessages !== 'function') {
      toastr.error('当前环境无法访问聊天消息接口');
      return;
    }
    const lastId = getLastMessageId();
    if (lastId < 1) {
      toastr.warning('没有可恢复的用户发言');
      return;
    }

    const range = `0-${lastId}`;
    const users = getChatMessages(range, { role: 'user', hide_state: 'unhidden' });
    if (!users.length) {
      toastr.warning('没有可恢复的用户发言');
      return;
    }

    const lastUser = users[users.length - 1]!;
    const text = String(lastUser.message ?? '').trim();
    if (!text) {
      toastr.warning('最后一条用户发言为空');
      return;
    }

    const mid = lastUser.message_id;
    if (typeof deleteChatMessages !== 'function') {
      toastr.error('deleteChatMessages 不可用');
      return;
    }
    await deleteChatMessages([mid], { refresh: 'affected' });

    const { sendToDialog } = await import('./utils/dialogAndVariable');
    await sendToDialog(text);

    currentMessageId.value = undefined;
    loadMessageContent();
    toastr.success('已删除该条用户发言，内容已填入对话框');
  } catch (e) {
    console.error('❌ [App] 恢复用户发言失败:', e);
    toastr.error('操作失败: ' + String(e));
  }
}

// 发送消息（同层前端界面核心功能）
async function sendMessage() {
  const content = userInput.value.trim();
  if (!content || isGenerating.value) return;

  console.log('🎮 [App] 发送消息:', content.substring(0, 50) + '...');

  // 保存状态快照（用于错误回退）
  saveGameSnapshot(content);

  // 清空输入框
  userInput.value = '';
  isGenerating.value = true;
  streamTextBuffer.value = '';

  // 清空当前显示，准备流式接收
  mainText.value = '';
  options.value = [];

  let unsubscribeStream: any = null;
  let streamSubscriptionSuccess = false;
  let isThinkingComplete = false; // 标记是否已完成 thinking 标签的过滤

  // 检测当前输出模式
  let isDualMode = false;
  let secondaryApiConfig: any = null;
  try {
    const { getCurrentOutputMode, getSecondaryApiConfig } = await import('./utils/apiSettings');
    isDualMode = await getCurrentOutputMode() === 'dual';
    if (isDualMode) {
      secondaryApiConfig = await getSecondaryApiConfig();
      console.log(`🔄 [App] 双API模式已启用，第二API配置: ${secondaryApiConfig ? '已配置' : '未配置'}`);
    }
  } catch (error) {
    console.warn('⚠️ [App] 检测输出模式失败，使用单API模式:', error);
  }

  try {
    // 检查 generate 函数是否存在
    if (typeof generate !== 'function') {
      throw new Error('generate 函数不可用');
    }

    // 注册流式监听（在调用 generate 之前）
    if (typeof eventOn === 'function' && typeof iframe_events !== 'undefined') {
      // 监听流式传输事件
      if (iframe_events.STREAM_TOKEN_RECEIVED_FULLY) {
        const streamHandler = (text: string) => {
          streamTextBuffer.value = text;

          // 过滤机制：检查是否所有过滤标签都已闭合
          if (!isThinkingComplete) {
            isThinkingComplete = isFilteringComplete(text);
            if (!isThinkingComplete) {
              // 仍在 thinking 标签内，显示 "AI 思考中..."
              mainText.value = 'AI 正在思考...';
              return;
            }
          }

          // 提取过滤后的内容进行实时显示
          const filteredText = extractFilteredContent(text);
          const parsed = parseMaintext(filteredText);
          if (parsed) {
            mainText.value = parsed;
          }
        };

        try {
          const result = eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, streamHandler);
          // 严格检查返回值是否为函数
          if (typeof result === 'function') {
            unsubscribeStream = result;
            streamSubscriptionSuccess = true;
            console.log('✅ [App] 流式事件监听已注册（带过滤机制）');
          } else if (result === undefined || result === null) {
            console.warn('⚠️ [App] eventOn 返回了 undefined/null，流式监听可能未正确注册');
          } else {
            console.warn('⚠️ [App] eventOn 返回了非函数值:', typeof result);
          }
        } catch (err) {
          console.error('❌ [App] 注册流式事件监听失败:', err);
        }
      } else {
        console.warn('⚠️ [App] iframe_events.STREAM_TOKEN_RECEIVED_FULLY 不可用');
      }
    } else {
      console.warn('⚠️ [App] eventOn 或 iframe_events 不可用');
    }

    // 先将用户输入写入聊天楼层，便于重 roll 时找到对应的 userMessageId
    if (typeof createChatMessages === 'function') {
      const mvuData = { stat_data: {}, display_data: {}, delta_data: {} };
      try {
        const baseData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
        if (baseData) Object.assign(mvuData, baseData);
      } catch (e) {
        // 忽略
      }
      await createChatMessages(
        [{ role: 'user', message: content, data: mvuData }],
        { refresh: 'none' },
      );
      // 短暂等待再取 lastMessageId，避免酒馆未同步导致拿到旧 id
      await new Promise(r => setTimeout(r, 50));
      pendingUserMessageId.value = getLastMessageId();
      console.log('✅ [App] 已写入 user 消息，message_id:', pendingUserMessageId.value);
    }

    // 调用 generate 生成 AI 回复
    console.log('⏳ [App] 调用 generate...');
    aiGenerationStartMs.value = Date.now();
    let result = await generate({
      user_input: content,
      should_stream: true,
    });
    console.log('✅ [App] generate 完成，结果长度:', result?.length || 0);

    // 双API模式：调用第二API处理变量
    if (isDualMode && result) {
      try {
        const { processWithSecondaryApi } = await import('./utils/apiSettings');
        if (isSecondaryApiConfigured(secondaryApiConfig)) {
          console.log('🔄 [App] 双API模式：调用第二API处理变量...');

          // 提取 maintext 内容
          const maintextMatch = result.match(/<maintext>([\s\S]*?)<\/maintext>/i);
          const maintext = maintextMatch ? maintextMatch[1].trim() : '';

          if (maintext) {
            const variableUpdate = await processWithSecondaryApi(maintext, secondaryApiConfig);

            // 将变量更新合并到结果中
            if (variableUpdate) {
              // 检查结果是否已有 UpdateVariable
              if (!result.includes('<UpdateVariable>')) {
                result = result.trim() + '\n\n<UpdateVariable>' + variableUpdate + '</UpdateVariable>';
                console.log('✅ [App] 第二API变量更新已合并');
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ [App] 第二API处理失败:', error);
        // 第二API失败不影响主流程，继续使用主API结果
      }
    }

    // 清理流式监听（确保即使 generate 失败也能清理）
    if (streamSubscriptionSuccess && unsubscribeStream) {
      try {
        unsubscribeStream?.();
        console.log('✅ [App] 流式事件监听已清理');
      } catch (err) {
        console.error('❌ [App] 清理流式事件监听失败:', err);
      }
    }

    // 验证结果是否为空或无效
    if (!result || result.trim().length === 0) {
      console.error('❌ [App] 生成结果为空');
      throw new Error('生成结果为空');
    }

    // 去除过滤标签后的内容
    const filteredResult = extractFilteredContent(result);
    const parsedMaintext = parseMaintext(filteredResult);
    const parsedOptions = parseOptions(filteredResult);

    // 兜底：有时 AI 只返回了被过滤标签，过滤后等于空回
    if (!filteredResult.trim() || (!parsedMaintext && parsedOptions.length === 0)) {
      console.error('❌ [App] AI 返回为空（过滤后无正文和选项）');
      toastr.error('AI 本次返回为空，请重试');
      await rollbackToSnapshot();
      return;
    }

    // 每次生成完成后都打开标签验证弹窗，由用户确认或回退
    openTagValidationDialog(filteredResult);
    return; // 等待用户点击确认或回退

  } catch (error) {
    console.error('❌ [App] 生成失败:', error);
    toastr.error('生成失败: ' + String(error));

    // 清理流式监听
    if (unsubscribeStream) {
      try {
        unsubscribeStream?.();
      } catch (e) {
        // 忽略
      }
    }

    // 回退到快照状态
    await rollbackToSnapshot();

  } finally {
    // 只有在标签验证弹窗未打开时才重置生成状态
    if (!isTagDialogOpen.value) {
      isGenerating.value = false;
      streamTextBuffer.value = '';
    }
  }
}

// 选择选项并发送
async function selectOption(optionId: string) {
  const option = options.value.find(o => o.id === optionId);
  if (!option) return;

  console.log('📝 [App] 选择选项:', optionId, option.text);

  // 将选项文本填入输入框并发送
  userInput.value = option.text;
  await sendMessage();
}

// 切换选项列表展开/折叠
function toggleOptions() {
  isOptionsExpanded.value = !isOptionsExpanded.value;
}

// 切换阅读模式
async function toggleReaderMode() {
  if (viewMode.value === 'reader') {
    viewMode.value = 'normal';
  } else {
    viewMode.value = 'reader';
    console.log('📚 [App] 切换到阅读模式，开始加载历史...');
    await loadMaintextHistory();
    console.log('📚 [App] 阅读模式加载完成，条目数:', maintextHistory.value.length);
  }
}

// 切换读档模式
async function toggleSaveMode() {
  if (viewMode.value === 'save') {
    viewMode.value = 'normal';
  } else {
    viewMode.value = 'save';
    console.log('💾 [App] 切换到读档模式，开始加载存档...');
    await loadSaveHistory();
    console.log('💾 [App] 读档模式加载完成，条目数:', saveHistory.value.length);
  }
}

// 切换全屏 - 使用 Fullscreen API
async function toggleFullscreen() {
  try {
    const app = document.getElementById('app-root');
    if (!app) return;

    if (!document.fullscreenElement) {
      // 进入全屏
      await app.requestFullscreen();
      isFullscreen.value = true;
      console.log('🔲 [App] 进入全屏模式');
    } else {
      // 退出全屏
      await document.exitFullscreen();
      isFullscreen.value = false;
      console.log('🔲 [App] 退出全屏模式');
    }
  } catch (error) {
    console.error('❌ [App] 全屏切换失败:', error);
    // 降级方案：尝试使用父窗口的全屏
    try {
      if (window.parent && window.parent !== window) {
        const parentDoc = window.parent.document;
        const iframe = parentDoc.querySelector('iframe#' + getIframeName());
        if (iframe) {
          if (!parentDoc.fullscreenElement) {
            await iframe.requestFullscreen();
            isFullscreen.value = true;
          } else {
            await parentDoc.exitFullscreen();
            isFullscreen.value = false;
          }
        }
      }
    } catch (e) {
      console.error('❌ [App] 降级全屏也失败:', e);
    }
  }
}

// 监听全屏变化事件
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  console.log('🔲 [App] 全屏状态变化:', isFullscreen.value);
}

// ---------- 长按正文：重roll / 编辑 ----------
function hasValidMessageId(): boolean {
  const id = currentMessageInfo.value.messageId;
  const valid = id !== undefined && id !== null;
  console.log('[长按] 检查 messageId:', id, '有效:', valid);
  return valid;
}

function onMaintextLongPressStart(e: MouseEvent | TouchEvent) {
  console.log('[长按] 开始检测', { hasMenu: !!contextMenu.value, hasText: !!mainText.value, hasValidId: hasValidMessageId(), isGenerating: isGenerating.value });

  if (
    contextMenu.value ||
    !mainText.value ||
    !hasValidMessageId() ||
    isGenerating.value
  ) {
    console.log('[长按] 条件不满足，取消', { contextMenu: contextMenu.value, mainText: mainText.value, hasValidId: hasValidMessageId(), isGenerating: isGenerating.value });
    return;
  }

  // 桌面端：阻止文本选择/上下文菜单等默认行为
  // 移动端：不要在 touchstart 阶段 preventDefault，否则会直接影响滚动手势
  const isTouchEvent = 'touches' in e;
  if (!isTouchEvent && e.cancelable) {
    e.preventDefault();
  }
  e.stopPropagation();

  const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
  const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;

  console.log('[长按] 启动定时器', { x: clientX, y: clientY });

  longPressTimerRef.value = setTimeout(() => {
    console.log('[长按] 触发菜单', { x: clientX, y: clientY });
    contextMenu.value = { x: clientX, y: clientY };
    longPressTimerRef.value = null;
  }, 500);
}

function onMaintextLongPressEnd() {
  if (longPressTimerRef.value) {
    clearTimeout(longPressTimerRef.value);
    longPressTimerRef.value = null;
  }
  maintextTouchStartPos.value = null;
}

function onMaintextMouseDown(e: MouseEvent) {
  console.log('[长按] 鼠标按下', { hasMenu: !!contextMenu.value });
  if (contextMenu.value) return;
  e.stopPropagation();
  if (hasValidMessageId()) {
    onMaintextLongPressStart(e);
  }
}

function onMaintextTouchStart(e: TouchEvent) {
  console.log('[长按] 触摸开始', { hasMenu: !!contextMenu.value, hasValidId: hasValidMessageId() });
  if (contextMenu.value) return;
  if (hasValidMessageId()) {
    const touch = e.touches[0] ?? e.changedTouches[0];
    if (touch) {
      maintextTouchStartPos.value = { x: touch.clientX, y: touch.clientY };
    }
    onMaintextLongPressStart(e);
  }
}

function onMaintextTouchMove(e: TouchEvent) {
  if (!longPressTimerRef.value) return;
  const startPos = maintextTouchStartPos.value;
  if (!startPos) return;

  const touch = e.touches[0];
  if (!touch) return;

  const dx = Math.abs(touch.clientX - startPos.x);
  const dy = Math.abs(touch.clientY - startPos.y);

  // 手指明显移动则认为是滚动操作，取消长按计时
  const cancelDistancePx = 10;
  if (Math.hypot(dx, dy) >= cancelDistancePx) {
    onMaintextLongPressEnd();
  }
}

async function handleRegenerate() {
  const info = currentMessageInfo.value;
  if (info.messageId === undefined || info.messageId === null) {
    toastr.warning('无法重新生成：缺少必要的数据');
    contextMenu.value = null;
    return;
  }
  if (info.userMessageId === undefined || info.userMessageId === null) {
    toastr.warning('当前消息没有对应的用户输入，无法重 roll（首条剧情不支持重 roll）');
    contextMenu.value = null;
    return;
  }

  try {
    isGenerating.value = true;
    isRegenerating.value = true;
    contextMenu.value = null;

    // 检测当前输出模式
    let isDualMode = false;
    let secondaryApiConfig: any = null;
    try {
      const { getCurrentOutputMode, getSecondaryApiConfig } = await import('./utils/apiSettings');
      isDualMode = await getCurrentOutputMode() === 'dual';
      if (isDualMode) {
        secondaryApiConfig = await getSecondaryApiConfig();
      }
    } catch (error) {
      console.warn('⚠️ [App] 检测输出模式失败:', error);
    }

    const userMessages = getChatMessages(info.userMessageId, { role: 'user' });
    if (!userMessages || userMessages.length === 0) {
      throw new Error('无法找到用户消息');
    }
    const userMessageText = userMessages[0].message || '';

    await deleteChatMessages([info.messageId], { refresh: 'none' });

    if (typeof generate !== 'function') {
      throw new Error('generate 函数不可用');
    }

    aiGenerationStartMs.value = Date.now();
    let result = await generate({
      user_input: userMessageText,
      should_stream: true,
    });

    // 双API模式：调用第二API处理变量
    if (isDualMode && result && isSecondaryApiConfigured(secondaryApiConfig)) {
      try {
        const { processWithSecondaryApi } = await import('./utils/apiSettings');
        const maintextMatch = result.match(/<maintext>([\s\S]*?)<\/maintext>/i);
        const maintext = maintextMatch ? maintextMatch[1].trim() : '';

        if (maintext) {
          const variableUpdate = await processWithSecondaryApi(maintext, secondaryApiConfig);
          if (variableUpdate && !result.includes('<UpdateVariable>')) {
            result = result.trim() + '\n\n<UpdateVariable>' + variableUpdate + '</UpdateVariable>';
          }
        }
      } catch (error) {
        console.error('❌ [App] 第二API处理失败:', error);
      }
    }

    if (!result || result.trim().length === 0) {
      throw new Error('生成结果为空');
    }

    const filteredResult = extractFilteredContent(result);
    mainText.value = parseMaintext(filteredResult);
    options.value = parseOptions(filteredResult);
    openTagValidationDialog(filteredResult);
  } catch (error) {
    console.error('❌ [App] 重 roll 失败:', error);
    toastr.error('重 roll 失败: ' + String(error));
    loadMessageContent();
  } finally {
    isGenerating.value = false;
    isRegenerating.value = false;
  }
}

function extractLastTagContent(text: string, tag: string): string {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'gi');
  const matches = Array.from(text.matchAll(re));
  if (matches.length === 0) return '';
  const last = matches[matches.length - 1];
  return (last?.[1] ?? '').trim();
}

async function handleRegenerateVariablesOnly() {
  const info = currentMessageInfo.value;
  if (info.messageId === undefined || info.messageId === null) {
    toastr.warning('无法重roll变量：缺少楼层 ID');
    contextMenu.value = null;
    return;
  }
  if (!info.fullMessage) {
    toastr.warning('无法重roll变量：缺少楼层内容');
    contextMenu.value = null;
    return;
  }

  const filtered = extractFilteredContent(info.fullMessage);
  const maintext = extractLastTagContent(filtered, 'maintext');
  if (!maintext) {
    toastr.warning('无法重roll变量：未找到 <maintext> 内容');
    contextMenu.value = null;
    return;
  }

  try {
    isGenerating.value = true;
    isRegenerating.value = true;
    contextMenu.value = null;

    // 读取输出模式与第二 API 配置
    let mode: OutputMode = 'single';
    let secondaryApiConfig: any = null;
    try {
      const { getCurrentOutputMode, getSecondaryApiConfig } = await import('./utils/apiSettings');
      mode = await getCurrentOutputMode();
      secondaryApiConfig = await getSecondaryApiConfig();
    } catch (e) {
      console.warn('⚠️ [App] 获取输出模式/第二API配置失败，将按单API回退:', e);
    }

    // 获取“本楼层之前”的变量快照，作为变量更新基底
    let baseData: any = null;
    try {
      await waitGlobalInitialized('Mvu');
      const baseId = Math.max(info.messageId - 1, 0);
      baseData = Mvu.getMvuData({ type: 'message', message_id: baseId });
    } catch (e) {
      console.warn('⚠️ [App] 获取 MVU 基底数据失败:', e);
    }

    const buildVariableOnlyPrompt = async (): Promise<string> => {
      const currentVariables = (baseData?.stat_data ?? {}) as Record<string, any>;

      // 读取世界书中“变量相关条目”的内容（即使双API模式下这些条目被关闭，也能读取 content）
      let variableUpdateRule = '';
      let variableList = '';
      let variableOutputFormat = '';
      try {
        // 复用 apiSettings 里的常量名，避免写死字符串
        const { WORLDBOOK_ENTRIES } = await import('./utils/apiSettings');
        const worldbookName = ((SillyTavern as any).getCharacterInfo?.()?.worldbook_name) || '规则系统';
        const entries = await getWorldbook(worldbookName);
        const findContent = (name: string) =>
          (entries.find((e: any) => (e?.name || '').includes(name))?.content || '').trim();
        variableUpdateRule = findContent(WORLDBOOK_ENTRIES.variableUpdateRule);
        variableList = findContent(WORLDBOOK_ENTRIES.variableList);
        variableOutputFormat = findContent(WORLDBOOK_ENTRIES.variableOutputFormat);
      } catch (e) {
        console.warn('⚠️ [App] 读取世界书变量条目失败，将使用默认格式:', e);
      }

      const outputFormat = variableOutputFormat || `[
  { "op": "replace", "path": "/路径", "value": 值 },
  { "op": "add", "path": "/路径", "value": 值 }
]`;

      return `你是一位专门负责游戏变量更新的AI助手。你的任务是根据提供的游戏正文和当前变量数据，生成变量更新指令。

## 当前变量数据（JSON格式）
\`\`\`json
${JSON.stringify(currentVariables, null, 2)}
\`\`\`

${variableList ? `## 变量列表\n${variableList}\n\n` : ''}${variableUpdateRule ? `## 变量更新规则\n${variableUpdateRule}\n\n` : ''}## 变量输出格式
请严格按照以下 JSON Patch 格式输出变量更新：
\`\`\`json
${outputFormat}
\`\`\`

## 正文内容（请据此分析变量变化）
<maintext>
${maintext}
</maintext>

## 输出要求
1. 只输出 <UpdateVariable> 标签及其内容
2. 不要输出正文、解释或任何其他内容
3. 使用标准的 JSON Patch 格式（op: replace/add/remove）
4. 确保 JSON 格式正确无误
5. 基于“当前变量数据”进行增量更新，只更新被正文明确影响的变量

请输出：
<UpdateVariable>...</UpdateVariable>`;
    };

    // 生成新的 UpdateVariable
    let updateVariable = '';
    if (mode === 'dual' && isSecondaryApiConfigured(secondaryApiConfig)) {
      // 双API：优先走第二 API（generateRaw + 短上下文）
      const { processWithSecondaryApi } = await import('./utils/apiSettings');
      updateVariable = await processWithSecondaryApi(maintext, secondaryApiConfig);
    } else if (isSecondaryApiConfigured(secondaryApiConfig)) {
      // 单API但配置了第二 API：同样可以走第二 API 来“只重roll变量”
      const { processWithSecondaryApi } = await import('./utils/apiSettings');
      updateVariable = await processWithSecondaryApi(maintext, secondaryApiConfig);
    } else {
      // 单API且未配置第二 API：用主 API 按“第二 API 的任务格式”生成变量
      if (typeof generate !== 'function') throw new Error('generate 函数不可用');
      const prompt = await buildVariableOnlyPrompt();
      const r = await generate({ user_input: prompt, should_stream: false });
      updateVariable = extractLastTagContent(String(r || ''), 'UpdateVariable');
    }

    if (!updateVariable) {
      throw new Error('未能生成有效的 <UpdateVariable> 内容');
    }

    // 仅构建“待提交”的新消息（先不写回；弹窗确认后才应用）
    const withoutOld = filtered.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>\s*/gi, '').trim();
    const updatedMessage = `${withoutOld}\n\n<UpdateVariable>\n${updateVariable.trim()}\n</UpdateVariable>`;

    pendingVariableReroll.value = {
      messageId: info.messageId,
      filteredMessage: filtered,
      baseData,
      updatedMessage,
    };

    // 打开预览弹窗，并允许编辑 patch（只展示标签内部内容）
    variableRerollPatchText.value = updateVariable.trim();
    variableRerollDialogOpen.value = true;
    toastr.info('已生成变量更新，请确认应用');
  } catch (error) {
    console.error('❌ [App] 单独重roll变量失败:', error);
    toastr.error('单独重roll变量失败: ' + String(error));
    loadMessageContent();
  } finally {
    isGenerating.value = false;
    isRegenerating.value = false;
  }
}

function closeVariableRerollDialog() {
  variableRerollDialogOpen.value = false;
  variableRerollPatchText.value = '';
  pendingVariableReroll.value = null;
}

async function confirmVariableRerollApply() {
  const pending = pendingVariableReroll.value;
  if (!pending) {
    closeVariableRerollDialog();
    return;
  }
  const patchText = (variableRerollPatchText.value || '').trim();
  if (!patchText) {
    toastr.warning('变量更新内容为空，无法应用');
    return;
  }

  try {
    isGenerating.value = true;

    // 把用户编辑后的 patch 写回到消息中（仍保持正文/选项/sum 不变）
    const withoutOld = pending.filteredMessage.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>\s*/gi, '').trim();
    const updatedMessage = `${withoutOld}\n\n<UpdateVariable>\n${patchText}\n</UpdateVariable>`;

    await setChatMessages(
      [{ message_id: pending.messageId, message: updatedMessage }],
      { refresh: 'affected' },
    );

    // 解析并写回本楼层变量
    try {
      await waitGlobalInitialized('Mvu');
      const base = pending.baseData ?? Mvu.getMvuData({ type: 'message', message_id: Math.max(pending.messageId - 1, 0) });
      const parsed = (typeof Mvu?.parseMessage === 'function')
        ? await Mvu.parseMessage(updatedMessage, base)
        : null;
      if (parsed) {
        await replaceVariables(parsed, { type: 'message', message_id: pending.messageId });
      } else {
        console.warn('⚠️ [App] MVU 解析返回空，跳过写回变量');
      }
    } catch (e) {
      console.warn('⚠️ [App] 写回本楼层变量失败:', e);
    }

    closeVariableRerollDialog();
    loadMessageContent();
    toastr.success('变量已应用到当前楼层');
  } catch (e) {
    console.error('❌ [App] 应用变量更新失败:', e);
    toastr.error('应用失败: ' + String(e));
  } finally {
    isGenerating.value = false;
  }
}

async function openVariableUpdateDialog() {
  try {
    // 优先使用当前缓存的 fullMessage
    const info = currentMessageInfo.value;
    let messageText = info.fullMessage || '';

    // 兜底：如果没有 fullMessage，尝试按 messageId 拉取一次
    if (!messageText && info.messageId !== undefined && info.messageId !== null) {
      try {
        const ms = getChatMessages(info.messageId);
        if (ms && ms.length > 0) {
          messageText = ms[0].message || '';
        }
      } catch (e) {
        // 忽略
      }
    }

    const filtered = extractFilteredContent(messageText);
    const patch = extractLastTagContent(filtered, 'UpdateVariable');

    variableUpdateDialogText.value = patch || '';
    variableUpdateDialogOpen.value = true;
  } catch (e) {
    console.warn('⚠️ [App] 打开变量更新弹窗失败:', e);
    variableUpdateDialogText.value = '';
    variableUpdateDialogOpen.value = true;
  }
}

function closeVariableUpdateDialog() {
  variableUpdateDialogOpen.value = false;
  variableUpdateDialogText.value = '';
}

function handleEdit() {
  const info = currentMessageInfo.value;
  if (
    info.messageId === undefined ||
    info.messageId === null ||
    !info.fullMessage
  ) {
    toastr.warning('无法编辑：缺少必要的数据');
    contextMenu.value = null;
    return;
  }

  const maintextMatch = info.fullMessage.match(/<maintext>([\s\S]*?)<\/maintext>/i);
  if (!maintextMatch) {
    toastr.warning('无法提取要编辑的正文内容');
    contextMenu.value = null;
    return;
  }

  editingMessage.value = {
    messageId: info.messageId,
    fullMessage: info.fullMessage,
  };
  editingText.value = maintextMatch[1].trim();
  contextMenu.value = null;
}

function closeEditModal() {
  editingMessage.value = null;
  editingText.value = '';
}

function closeContextMenu() {
  contextMenu.value = null;
  onMaintextLongPressEnd();
}

// 上下文菜单样式（计算属性确保边界安全）
const contextMenuStyle = computed((): any => {
  if (!contextMenu.value) return {};
  const menuWidth = 200;
  const menuHeight = 140;
  const padding = 8;
  
  // 确保在视口范围内
  const maxX = Math.max(window.innerWidth - menuWidth - padding, padding);
  const maxY = Math.max(window.innerHeight - menuHeight - padding, padding);
  
  const x = Math.min(Math.max(contextMenu.value.x, padding), maxX);
  const y = Math.min(Math.max(contextMenu.value.y, padding), maxY);
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    position: 'fixed',
  };
});

async function handleSaveEdit() {
  if (!editingMessage.value) return;

  try {
    const { messageId, fullMessage } = editingMessage.value;
    const currentText = editingText.value;
    const updatedMessage = fullMessage.replace(
      /<maintext>[\s\S]*?<\/maintext>/i,
      () => `<maintext>${currentText}</maintext>`
    );
    await setChatMessages(
      [{ message_id: messageId, message: updatedMessage }],
      { refresh: 'affected' }
    );
    editingMessage.value = null;
    editingText.value = '';
    loadMessageContent();
    toastr.success('正文已保存');
  } catch (error) {
    console.error('❌ [App] 保存编辑失败:', error);
    toastr.error('保存失败: ' + String(error));
  }
}

// 加载 maintext 历史（阅读模式）
async function loadMaintextHistory() {
  try {
    // 直接从聊天消息读取（简单可靠）
    const lastMessageId = getLastMessageId();
    if (lastMessageId < 0) {
      maintextHistory.value = [];
      console.log('📚 [App] 没有可用的消息记录');
      return;
    }

    // 获取所有 assistant 消息
    const messages = getChatMessages(`0-${lastMessageId}`, { role: 'assistant' });
    if (!messages || messages.length === 0) {
      maintextHistory.value = [];
      console.log('📚 [App] 没有可用的消息记录');
      return;
    }

    // 按楼层顺序构建阅读历史（从旧到新）
    maintextHistory.value = messages
      .map(msg => ({
        messageId: msg.message_id,
        maintext: parseMaintext(msg.message || ''),
        timestamp: new Date(msg.data?.timestamp || Date.now()).toLocaleString(),
        turnNumber: Math.floor(msg.message_id / 2),
      }))
      .filter(item => item.maintext.length > 0);

    console.log('📚 [App] 从消息加载阅读历史:', maintextHistory.value.length, '条');
  } catch (error) {
    console.error('❌ [App] 加载阅读历史失败:', error);
    maintextHistory.value = [];
  }
}

// 加载存档历史（读档模式）
async function loadSaveHistory() {
  try {
    // 直接从聊天消息读取（简单可靠）
    const lastMessageId = getLastMessageId();
    if (lastMessageId < 0) {
      saveHistory.value = [];
      console.log('💾 [App] 没有可用的存档记录');
      return;
    }

    // 获取所有 assistant 消息
    const messages = getChatMessages(`0-${lastMessageId}`, { role: 'assistant' });
    if (!messages || messages.length === 0) {
      saveHistory.value = [];
      console.log('💾 [App] 没有可用的存档记录');
      return;
    }

    // 按楼层顺序构建存档历史（从旧到新），只显示有 <sum> 的楼层
    saveHistory.value = messages
      .map(msg => {
        const message = msg.message || '';
        // 提取 <sum> 标签内容
        const sumMatch = message.match(/<sum>([\s\S]*?)<\/sum>/i);
        return {
          messageId: msg.message_id,
          turnNumber: Math.floor(msg.message_id / 2),
          sum: sumMatch ? sumMatch[1].trim() : '',
          timestamp: new Date(msg.data?.timestamp || Date.now()).toLocaleString()
        };
      })
      .filter(item => item.sum.length > 0);

    console.log('💾 [App] 从消息加载存档历史:', saveHistory.value.length, '条');
  } catch (error) {
    console.error('❌ [App] 加载存档历史失败:', error);
    saveHistory.value = [];
  }
}

// 创建分支
function createBranch(messageId: number, turnNumber?: number) {
  try {
    triggerSlash(`/branch-create ${messageId}`);
    console.log('🌿 [App] 创建分支: 楼层', messageId, turnNumber !== undefined ? `(回合 ${turnNumber})` : '');
    toastr.success(`已从回合 ${turnNumber !== undefined ? turnNumber : '?'} 创建分支`);
    // 切换回普通模式
    viewMode.value = 'normal';
  } catch (error) {
    console.error('❌ [App] 创建分支失败:', error);
    toastr.error('创建分支失败');
  }
}

// 保存游戏状态快照（用于错误回退）
function saveGameSnapshot(userInput: string) {
  lastUserInputSnapshot.value = userInput;
  lastMaintextSnapshot.value = mainText.value;
  lastOptionsSnapshot.value = [...options.value];
  lastMessageIdSnapshot.value = currentMessageId.value;
  pendingUserMessageId.value = null;
  console.log('📸 [App] 游戏状态快照已保存');
}

// 回退到上次快照状态
async function rollbackToSnapshot() {
  console.log('⏮️ [App] 开始回退到上次快照状态...');

  try {
    const toDelete: number[] = [];

    // 1. 删除 pending 的 user 消息（如果存在）
    if (pendingUserMessageId.value !== null) {
      toDelete.push(pendingUserMessageId.value);
    }

    // 2. 兜底：若快照后多出了楼层且当前最后一条是 user，也删掉（避免 pendingUserMessageId 记错导致玩家楼层残留）
    const snapshotId = lastMessageIdSnapshot.value;
    if (snapshotId !== undefined && snapshotId !== null && typeof getLastMessageId === 'function') {
      const currentLast = getLastMessageId();
      if (currentLast > snapshotId) {
        try {
          const atLast = getChatMessages(currentLast);
          if (atLast && atLast.length > 0 && atLast[0].role === 'user') {
            if (!toDelete.includes(currentLast)) toDelete.push(currentLast);
          }
        } catch (_) {
          // 查询失败则只依赖 toDelete 中已有的 id
        }
      }
    }

    for (const id of toDelete) {
      try {
        await deleteChatMessages([id], { refresh: 'none' });
        console.log('✅ [App] 已删除 user 消息:', id);
      } catch (e) {
        console.warn('⚠️ [App] 删除 user 消息失败:', id, e);
        toastr.warning('回退时删除玩家消息失败，请检查是否有多余的玩家楼层');
      }
    }

    // 3. 恢复 UI 状态
    mainText.value = lastMaintextSnapshot.value;
    options.value = [...lastOptionsSnapshot.value];
    currentMessageId.value = lastMessageIdSnapshot.value;
    userInput.value = lastUserInputSnapshot.value;

    // 4. 清理临时状态
    lastGenerationRaw.value = '';
    lastGenerationDurationLabel.value = '';
    pendingUserMessageId.value = null;
    isTagDialogOpen.value = false;
    showAiOutput.value = false; // 重置展开状态

    console.log('✅ [App] 回退完成，输入框已还原');
    toastr.info('已回退到发送前的状态');
  } catch (error) {
    console.error('❌ [App] 回退失败:', error);
    toastr.error('回退失败');
  }
}

// 打开标签验证弹窗
function openTagValidationDialog(rawText: string) {
  lastGenerationRaw.value = rawText;
  const elapsed =
    aiGenerationStartMs.value > 0 ? Date.now() - aiGenerationStartMs.value : NaN;
  lastGenerationDurationLabel.value = formatGenerationDurationMs(elapsed);
  tagCheckResults.value = validateTags(rawText);
  isTagDialogOpen.value = true;
  showAiOutput.value = false; // 默认折叠“AI 完整输出”
  console.log('🔍 [App] 打开标签验证弹窗:', tagCheckResults.value);
}

function onTagDialogCloseAttempt() {
  toastr.info('请使用下方按钮选择“回退到发送前”或“确认信息”');
}

// 处理标签验证弹窗 - 无视错误继续
async function onTagDialogIgnore() {
  console.log('⚠️ [App] 用户选择无视标签错误，继续本回合');

  // 解析最终结果
  const finalMaintext = parseMaintext(lastGenerationRaw.value);
  const finalOptions = parseOptions(lastGenerationRaw.value);

  // 兜底：确认前再次检查，防止界面出现“空白无提示”
  if (!finalMaintext && finalOptions.length === 0) {
    console.warn('⚠️ [App] 标签确认时检测到空回，自动回退');
    toastr.error('AI 返回内容为空，已回退到发送前状态');
    await rollbackToSnapshot();
    isTagDialogOpen.value = false;
    isGenerating.value = false;
    showAiOutput.value = false;
    return;
  }

  mainText.value = finalMaintext;
  options.value = finalOptions;

  // 静默记录到酒馆楼层（等待写入完成）
  await recordAssistantMessage(lastGenerationRaw.value);
  // 修正可能出现的变量套娃，确保前端能从 stat_data 根读取到中文结构
  await normalizeLatestChineseStatData();

  // 清理状态
  lastGenerationRaw.value = '';
  lastGenerationDurationLabel.value = '';
  pendingUserMessageId.value = null;
  lastUserInputSnapshot.value = '';
  lastMaintextSnapshot.value = '';
  lastOptionsSnapshot.value = [];
  lastMessageIdSnapshot.value = undefined;
  isTagDialogOpen.value = false;
  isGenerating.value = false;
  showAiOutput.value = false; // 重置展开状态

  // 如果是开局流程，进入游戏阶段
  if (isOpeningPhase.value) {
    console.log('🎮 [App] 开局确认，进入游戏主界面...');
    gamePhase.value = GamePhase.GAME;
    isOpeningPhase.value = false;
    isInitializing.value = false;

    // 加载消息内容
    setTimeout(() => {
      loadMessageContent();
    }, 500);

    toastr.success('游戏初始化完成！');
  } else {
    // 正常流程：刷新当前消息信息，使长按重 roll 使用正确的 messageId / userMessageId
    loadMessageContent();
    toastr.success('已确认，继续游戏');
  }
}

// 处理标签验证弹窗 - 回退
async function onTagDialogRollback() {
  console.log('⏮️ [App] 用户选择回退');

  // 如果是开局流程，删除已创建的 user 消息并回到开局表单
  if (isOpeningPhase.value) {
    console.log('🎮 [App] 开局回退，返回开局表单...');

    // 删除已写入的 user 消息
    if (pendingUserMessageId.value !== null) {
      try {
        await deleteChatMessages([pendingUserMessageId.value], { refresh: 'none' });
        console.log('✅ [App] 已删除开局 user 消息:', pendingUserMessageId.value);
      } catch (e) {
        console.warn('⚠️ [App] 删除开局 user 消息失败:', e);
      }
    }

    // 清理状态
    pendingUserMessageId.value = null;
    lastGenerationRaw.value = '';
    lastGenerationDurationLabel.value = '';
    isTagDialogOpen.value = false;
    isGenerating.value = false;
    isInitializing.value = false;
    isOpeningPhase.value = false;
    showAiOutput.value = false;
    mainText.value = '';
    options.value = [];
    streamTextBuffer.value = '';

    // 保持在开局表单（不进入游戏阶段）
    gamePhase.value = GamePhase.OPENING;
    // 强制重置开局表单内部提交状态（避免“开始游戏”一直转圈）
    openingFormKey.value += 1;
    toastr.info('已回退到开局表单，可以重新设置并生成');
    return;
  }

  // 正常流程：回退到快照状态
  await rollbackToSnapshot();
  isGenerating.value = false;
  showAiOutput.value = false; // 重置展开状态
}

// 静默记录 assistant 消息到酒馆楼层
async function recordAssistantMessage(message: string) {
  try {
    if (typeof createChatMessages === 'function') {
      // 准备数据
      const mvuData = { stat_data: {}, display_data: {}, delta_data: {} };
      let baseData: any = null;
      try {
        baseData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
        if (baseData) Object.assign(mvuData, baseData);
      } catch (e) {
        // 忽略错误
      }

      // 关键：解析 <UpdateVariable>，把 JSONPatch 应用到 MVU 数据中
      let finalData: any = mvuData;
      try {
        await waitGlobalInitialized('Mvu');
        if (typeof Mvu?.parseMessage === 'function' && baseData) {
          const parsed = await Mvu.parseMessage(message, baseData);
          if (parsed && typeof parsed === 'object') {
            finalData = parsed;
          } else {
            finalData = baseData;
          }
        }
      } catch (e) {
        console.warn('⚠️ [App] 解析 <UpdateVariable> 失败，将使用原始变量数据写入:', e);
        finalData = baseData ?? mvuData;
      }

      await createChatMessages(
        [
          {
            role: 'assistant',
            message: message,
            data: finalData,
          },
        ],
        { refresh: 'none' },
      );
      console.log('✅ [App] 已静默记录到酒馆楼层');

      // 更新编年史
      try {
        const { checkAndUpdateChronicle } = await import('./utils/chronicleUpdater');
        await checkAndUpdateChronicle();
      } catch (e) {
        console.warn('⚠️ [App] 更新编年史失败:', e);
      }
    }
  } catch (e) {
    console.warn('⚠️ [App] 记录到酒馆楼层失败:', e);
  }
}

// 检查游戏阶段
async function checkGamePhase() {
  try {
    const lastMessageId = getLastMessageId();
    console.log('📊 [App] 当前楼层数:', lastMessageId);

    if (lastMessageId === 0 || isNewGame()) {
      // 新游戏，显示开局表单
      console.log('🎮 [App] 检测到新游戏，显示开局表单');
      gamePhase.value = GamePhase.OPENING;
    } else {
      // 已有游戏进度，直接进入游戏
      console.log('🎮 [App] 检测到已有游戏，进入游戏界面');
      gamePhase.value = GamePhase.GAME;

      // 已有游戏进度进入时，也做布局安全兜底（防止之前保存了异常值）
      try {
        const { readGameData } = await import('./utils/variableReader');
        const gameData = await readGameData();
        if (gameData?.player?.settings?.uiLayout) {
          uiLayout.value = { ...uiLayout.value, ...gameData.player.settings.uiLayout };
          // 安全兜底：避免异常数据导致布局极端变窄
          const safeMaxWidth = Number(uiLayout.value.maxWidth);
          if (!Number.isFinite(safeMaxWidth) || safeMaxWidth < 800) {
            uiLayout.value.maxWidth = 900; // 与设置面板最小宽度一致
            console.log('⚠️ [App] 已有游戏：检测到异常maxWidth，已重置为900');
          }
        }
      } catch (e) {
        console.warn('⚠️ [App] 已有游戏读取布局设置失败:', e);
      }

      // 修正历史遗留的变量套娃：stat_data.stat_data -> stat_data
      await normalizeLatestChineseStatData();
      // 加载最新消息内容
      const result = loadFromLatestMessage();
      if (result.maintext) {
        mainText.value = result.maintext;
        options.value = result.options;
        currentMessageId.value = result.messageId;
        currentMessageInfo.value = {
          messageId: result.messageId,
          userMessageId: result.userMessageId,
          fullMessage: result.fullMessage,
        };
        console.log('✅ [App] 已加载最新消息:', result.messageId);
      }
    }
  } catch (error) {
    console.error('❌ [App] 检测游戏阶段失败，默认显示开局表单:', error);
    gamePhase.value = GamePhase.OPENING;
  }
}

/**
 * 兼容修正：把 stat_data.stat_data 里的中文结构提升到 stat_data 根下
 * 解决「变量套娃导致前端不显示」的问题。
 */
async function normalizeLatestChineseStatData(): Promise<void> {
  try {
    const vars = getVariables({ type: 'message', message_id: 'latest' }) as any;
    if (!vars || typeof vars !== 'object') return;
    if (!vars.stat_data || typeof vars.stat_data !== 'object') return;

    const nested = vars.stat_data.stat_data;
    if (!nested || typeof nested !== 'object') return;

    const keys = ['游戏状态', '世界规则', '区域规则', '个人规则', '角色档案', '元信息'] as const;
    let moved = 0;

    for (const k of keys) {
      if (nested[k] == null) continue;

      const rootVal = vars.stat_data[k];
      const nestedVal = nested[k];

      if (rootVal == null) {
        vars.stat_data[k] = nestedVal;
        moved += 1;
      } else if (typeof rootVal === 'object' && rootVal && typeof nestedVal === 'object' && nestedVal) {
        // 根已存在则合并，避免覆盖已有字段
        vars.stat_data[k] = { ...nestedVal, ...rootVal };
        moved += 1;
      }
    }

    delete vars.stat_data.stat_data;

    if (moved > 0) {
      await replaceVariables(vars, { type: 'message', message_id: 'latest' });
      console.log(`✅ [App] 已修正最新楼层变量套娃，提升字段数: ${moved}`);
    }
  } catch (e) {
    console.warn('⚠️ [App] 修正最新楼层变量套娃失败:', e);
  }
}

// 处理开局表单提交（改为和正常发消息一样的标签校验流程）
async function handleOpeningSubmit(formData: OpeningFormData) {
  if (isInitializing.value) return;

  isInitializing.value = true;
  isOpeningPhase.value = true; // 标记为开局流程
  console.log('🎮 [App] 开始初始化游戏...', formData);

  let unsubscribeStream: any = null;
  let streamSubscriptionSuccess = false;

  // 检测当前输出模式
  let isDualMode = false;
  let secondaryApiConfig: any = null;
  try {
    const { getCurrentOutputMode, getSecondaryApiConfig } = await import('./utils/apiSettings');
    isDualMode = await getCurrentOutputMode() === 'dual';
    if (isDualMode) {
      secondaryApiConfig = await getSecondaryApiConfig();
      console.log(`🔄 [App] 开局流程：双API模式已启用`);
    }
  } catch (error) {
    console.warn('⚠️ [App] 检测输出模式失败:', error);
  }

  try {
    // 1. 初始化游戏变量（写入0层）
    console.log('🎮 [App] 步骤1: 初始化游戏变量...');
    const initSuccess = await initializeGameVariables(formData);
    if (!initSuccess) {
      console.error('❌ [App] 初始化游戏变量失败，但继续进入游戏');
    } else {
      console.log('✅ [App] 游戏变量初始化成功');
    }

    // 2. 获取开局提示词内容
    console.log('🎮 [App] 步骤2: 准备开局提示词...');
    const storyResult = await createOpeningStoryMessage(formData);
    if (!storyResult.success) {
      console.error('❌ [App] 创建开局楼层失败，但继续进入游戏');
    } else {
      console.log('✅ [App] 开局提示词准备完成');
    }

    // 3. 触发 AI 生成开场白（和正常发消息一样的流程）
    if (storyResult.success && typeof generate === 'function') {
      console.log('🎮 [App] 步骤3: 触发 AI 生成开场白...');
      isGenerating.value = true;
      isGeneratingOpening.value = true;

      const userPrompt = storyResult.promptContent || '';
      console.log('📝 [App] 发送给 AI 的提示词:', userPrompt.substring(0, 300) + '...');

      // 注册流式监听（和 sendMessage 一样）
      if (typeof eventOn === 'function' && typeof iframe_events !== 'undefined') {
        const streamHandler = (text: string) => {
          streamTextBuffer.value = text;
          let isThinkingComplete = false;
          const isFilteringComplete = (t: string) => {
            const thinkingOpen = (t.match(/<thinking>/gi) || []).length;
            const thinkingClose = (t.match(/<\/thinking>/gi) || []).length;
            return thinkingOpen > 0 && thinkingOpen === thinkingClose;
          };
          if (!isThinkingComplete) {
            isThinkingComplete = isFilteringComplete(text);
            if (!isThinkingComplete) {
              mainText.value = 'AI 正在思考...';
              return;
            }
          }
          const filteredText = extractFilteredContent(text);
          const parsed = parseMaintext(filteredText);
          if (parsed) {
            mainText.value = parsed;
          }
        };
        try {
          const result = eventOn(iframe_events.STREAM_TOKEN_RECEIVED_FULLY, streamHandler);
          if (typeof result === 'function') {
            unsubscribeStream = result;
            streamSubscriptionSuccess = true;
          }
        } catch (err) {
          console.error('❌ [App] 注册流式事件监听失败:', err);
        }
      }

      // 先将用户输入写入聊天楼层（便于重 roll）
      if (typeof createChatMessages === 'function') {
        const mvuData = { stat_data: {}, display_data: {}, delta_data: {} };
        try {
          const baseData = Mvu.getMvuData({ type: 'message', message_id: 'latest' });
          if (baseData) Object.assign(mvuData, baseData);
        } catch (e) { /* 忽略 */ }
        await createChatMessages(
          [{ role: 'user', message: userPrompt, data: mvuData }],
          { refresh: 'none' },
        );
        await new Promise(r => setTimeout(r, 50));
        pendingUserMessageId.value = getLastMessageId();
        console.log('✅ [App] 已写入开局 user 消息，message_id:', pendingUserMessageId.value);
      }

      // 调用 generate
      aiGenerationStartMs.value = Date.now();
      let result = await generate({
        user_input: userPrompt,
        should_stream: true,
      });
      console.log('✅ [App] generate 完成，结果长度:', result?.length || 0);

      // 双API模式：调用第二API处理变量
      if (isDualMode && result && isSecondaryApiConfigured(secondaryApiConfig)) {
        try {
          const { processWithSecondaryApi } = await import('./utils/apiSettings');
          const maintextMatch = result.match(/<maintext>([\s\S]*?)<\/maintext>/i);
          const maintext = maintextMatch ? maintextMatch[1].trim() : '';

          if (maintext) {
            const variableUpdate = await processWithSecondaryApi(maintext, secondaryApiConfig);
            if (variableUpdate && !result.includes('<UpdateVariable>')) {
              result = result.trim() + '\n\n<UpdateVariable>' + variableUpdate + '</UpdateVariable>';
              console.log('✅ [App] 开局流程：第二API变量更新已合并');
            }
          }
        } catch (error) {
          console.error('❌ [App] 开局流程：第二API处理失败:', error);
        }
      }

      // 清理流式监听
      if (streamSubscriptionSuccess && unsubscribeStream) {
        try {
          unsubscribeStream?.();
        } catch {
          /* 流式监听已释放或宿主不支持 */
        }
      }

      // 验证结果
      if (!result || result.trim().length === 0) {
        throw new Error('生成结果为空');
      }

      // 关闭 loading 弹窗，避免遮挡标签验证弹窗
      isGeneratingOpening.value = false;
      isGenerating.value = false;

      // 打开标签验证弹窗（和正常发消息一样）
      const filteredResult = extractFilteredContent(result);
      openTagValidationDialog(filteredResult);
      return; // 等待用户点击确认或回退，不立即进入游戏
    }
  } catch (error) {
    console.error('❌ [App] 游戏初始化失败:', error);
    toastr.error('游戏初始化失败: ' + String(error));
    // 重置所有状态，确保按钮不再转圈
    isOpeningPhase.value = false;
    isGenerating.value = false;
    isGeneratingOpening.value = false;
    isInitializing.value = false;
    streamTextBuffer.value = '';
    // 强制重置开局表单内部提交状态（避免“开始游戏”一直转圈）
    openingFormKey.value += 1;
  } finally {
    // 正常流程（弹出标签验证窗）时，由弹窗按钮处理状态重置
    if (!isTagDialogOpen.value) {
      isGeneratingOpening.value = false;
      isGenerating.value = false;
      isInitializing.value = false;
    }
  }
}

// 组件挂载时加载消息并监听事件
let unsubscribeMessageUpdate: any = null;
let unsubscribeChatChange: (() => void) | null = null;

watch(
  () => gamePhase.value,
  (phase) => {
    if (phase === GamePhase.GAME) {
      setTimeout(() => maybeOfferOrphanUserFloorFix(), 500);
    }
  },
);

function onPageShowStaleUserCheck() {
  if (gamePhase.value === GamePhase.GAME) {
    setTimeout(() => maybeOfferOrphanUserFloorFix(), 400);
  }
}

onMounted(() => {
  // 检查游戏阶段并加载内容
  checkGamePhase();

  // 读取界面布局设置（最大宽高/缩放）
  (async () => {
    try {
      const { readGameData } = await import('./utils/variableReader');
      const gameData = await readGameData();
      if (gameData?.player?.settings?.uiLayout) {
        uiLayout.value = { ...uiLayout.value, ...gameData.player.settings.uiLayout };
        // 安全兜底：避免异常数据导致布局极端变窄/变扁
        const safeScale = Number(uiLayout.value.scale);
        const safeMaxWidth = Number(uiLayout.value.maxWidth);
        const safeMaxHeight = Number(uiLayout.value.maxHeight);
        uiLayout.value.scale = Number.isFinite(safeScale) ? Math.min(1.3, Math.max(0.8, safeScale)) : 0.8;
        // 最小宽度 800：避免变量里写入过小值导致界面缩成一条
        uiLayout.value.maxWidth = Number.isFinite(safeMaxWidth) ? Math.min(2400, Math.max(800, safeMaxWidth)) : 900;
        uiLayout.value.maxHeight = Number.isFinite(safeMaxHeight) ? Math.max(400, safeMaxHeight) : 400;
      }
    } catch (e) {
      console.warn('⚠️ [App] 读取 uiLayout 设置失败:', e);
    }
  })();

  // 监听全屏变化事件
  document.addEventListener('fullscreenchange', onFullscreenChange);
  // 监听工具层发来的“写入前端对话框”事件
  window.addEventListener('th:copy-to-input', onCopyToInputEvent as EventListener);

  // 监听酒馆消息更新事件（用于检测外部消息变化，如分支切换）
  try {
    if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
      unsubscribeMessageUpdate = eventOn(tavern_events.MESSAGE_RECEIVED, () => {
        console.log('📨 [App] 收到新消息事件，刷新内容...');
        // 如果不在生成中，才刷新（避免覆盖正在流式显示的内容）
        if (!isGenerating.value) {
          loadMessageContent();
          maybeOfferOrphanUserFloorFix();
        }
      });
    }
  } catch (e) {
    console.warn('⚠️ [App] 无法监听消息事件:', e);
  }

  // 切换聊天文件后重新检测末尾楼层
  try {
    if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
      unsubscribeChatChange = eventOn(tavern_events.CHAT_CHANGED, () => {
        orphanUserFloorDismissedMid.value = null;
        orphanUserFloorDialogOpen.value = false;
        setTimeout(() => maybeOfferOrphanUserFloorFix(), 500);
      });
    }
  } catch (e) {
    console.warn('⚠️ [App] 无法监听 CHAT_CHANGED:', e);
  }

  window.addEventListener('pageshow', onPageShowStaleUserCheck);

  console.log('✅ [App] 同层前端界面挂载完成');
});

onUnmounted(() => {
  // 清理事件监听
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  window.removeEventListener('th:copy-to-input', onCopyToInputEvent as EventListener);
  window.removeEventListener('pageshow', onPageShowStaleUserCheck);
  if (typeof unsubscribeMessageUpdate === 'function') {
    unsubscribeMessageUpdate();
  }
  if (typeof unsubscribeChatChange === 'function') {
    unsubscribeChatChange();
  }
  stopIframeHeightFix?.();
  stopIframeHeightFix = null;
});
</script>

<style lang="scss" scoped>
.rule-modifier {
  display: flex;
  width: 100%;
  height: var(--ui-max-height, 100%);
  max-width: var(--ui-max-width, 900px);
  max-height: var(--ui-max-height, 100%);
  margin: 0 auto;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: calc(14px * var(--ui-scale, 1));
  line-height: 1.5;

  // 全局CSS变量，用于整体UI缩放
  --space-xs: calc(4px * var(--ui-scale, 1));
  --space-sm: calc(8px * var(--ui-scale, 1));
  --space-md: calc(12px * var(--ui-scale, 1));
  --space-lg: calc(16px * var(--ui-scale, 1));
  --space-xl: calc(24px * var(--ui-scale, 1));
  --space-2xl: calc(32px * var(--ui-scale, 1));
  --radius-sm: calc(6px * var(--ui-scale, 1));
  --radius-md: calc(8px * var(--ui-scale, 1));
  --radius-lg: calc(12px * var(--ui-scale, 1));
  --radius-xl: calc(16px * var(--ui-scale, 1));
  --sidebar-width: calc(80px * var(--ui-scale, 1));
  --sidebar-width-wide: calc(240px * var(--ui-scale, 1));
  --middle-panel-width: calc(700px * var(--ui-scale, 1));

  @media (min-width: 1024px) {
    --sidebar-width: var(--sidebar-width-wide);
  }

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
  width: var(--sidebar-width);
  height: 100%;
  max-height: var(--ui-max-height, 600px);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  border-right: 1px solid rgba(255, 255, 255, 0.05);
  background: rgba(255, 255, 255, 0.02);
  overflow: hidden;
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
    height: calc(80px * var(--ui-scale, 1));
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    gap: var(--space-md);
    padding: 0 var(--space-xl);

    i {
      font-size: calc(24px * var(--ui-scale, 1));
    }

    .logo-text {
      display: none;
      font-weight: 600;
      letter-spacing: 0.15em;
      font-size: calc(16px * var(--ui-scale, 1));

      @media (min-width: 1024px) {
        display: block;
      }
    }
  }

  .nav-items {
    padding: var(--space-lg);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
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
  padding: var(--space-lg);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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
  padding: var(--space-md);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
  position: relative;
  background: transparent;
  border: none;
  cursor: pointer;
  gap: var(--space-md);
  width: 100%;

  i {
    font-size: calc(18px * var(--ui-scale, 1));
    width: calc(24px * var(--ui-scale, 1));
    text-align: center;
  }

  .nav-label {
    display: none;
    font-size: calc(14px * var(--ui-scale, 1));
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
      width: calc(4px * var(--ui-scale, 1));
      height: calc(32px * var(--ui-scale, 1));
      background: currentColor;
      border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
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
  width: var(--middle-panel-width);
  height: 100%;
  max-height: var(--ui-max-height, 600px);
  flex-shrink: 0;
  overflow: hidden;
  box-shadow: 0 0 calc(40px * var(--ui-scale, 1)) rgba(0, 0, 0, 0.3);
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
  width: var(--middle-panel-width);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  height: calc(80px * var(--ui-scale, 1));
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(40px * var(--ui-scale, 1));
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.02);

  h1 {
    font-size: calc(24px * var(--ui-scale, 1));
    font-weight: 300;
    letter-spacing: 0.05em;
  }

  .close-btn {
    padding: var(--space-sm);
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
  padding: var(--space-xl) calc(40px * var(--ui-scale, 1));
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
  height: 100%;
  max-height: var(--ui-max-height, 600px);
}

.dark .main-panel {
  background: #030303;
}

.light .main-panel {
  background: #fafafa;
}

.main-header {
  height: calc(80px * var(--ui-scale, 1));
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 calc(32px * var(--ui-scale, 1));

  .header-title {
    display: flex;
    align-items: center;
    gap: var(--space-md);

    i {
      font-size: calc(24px * var(--ui-scale, 1));
    }

    h2 {
      font-size: calc(18px * var(--ui-scale, 1));
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
  font-size: calc(20px * var(--ui-scale, 1));
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

.header-actions {
  display: flex;
  gap: var(--space-sm);
}

.header-btn.active {
  color: #3b82f6;
}

.dark .header-btn.active {
  color: #60a5fa;
}

.light .header-btn.active {
  color: #2563eb;
}

.header-btn-recover {
  color: #f59e0b;
}

.dark .header-btn-recover {
  color: #fbbf24;

  &:hover {
    color: #fde68a;
  }
}

.light .header-btn-recover {
  color: #d97706;

  &:hover {
    color: #b45309;
  }
}

// 游戏内容区域
.game-content {
  position: relative;
  flex: 1;
  padding: var(--space-xl) calc(32px * var(--ui-scale, 1));
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
  overflow: hidden;
}

.turn-layout {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

// 重ROLL 遮罩：仅覆盖主内容，不挡侧边栏
.regenerate-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  border-radius: 8px;

  .regenerate-spin {
    font-size: 32px;
    opacity: 0.9;
  }

  span {
    font-size: 15px;
    font-weight: 500;
  }

  &.dark {
    background: rgba(3, 3, 3, 0.75);
    color: #e4e4e7;

    .regenerate-spin {
      color: #a1a1aa;
    }
  }

  &.light {
    background: rgba(250, 250, 250, 0.85);
    color: #27272a;

    .regenerate-spin {
      color: #71717a;
    }
  }
}

// 开场白生成中弹窗
.opening-generating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  &.dark {
    background: rgba(3, 3, 3, 0.9);

    .opening-generating-content {
      i {
        color: #60a5fa;
      }

      .opening-generating-text {
        color: #e4e4e7;
      }

      .opening-generating-hint {
        color: #71717a;
      }
    }
  }

  &.light {
    background: rgba(250, 250, 250, 0.9);

    .opening-generating-content {
      i {
        color: #2563eb;
      }

      .opening-generating-text {
        color: #18181b;
      }

      .opening-generating-hint {
        color: #71717a;
      }
    }
  }
}

.opening-generating-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px;
  border-radius: 16px;

  i {
    font-size: 48px;
  }

  .opening-generating-text {
    font-size: 20px;
    font-weight: 600;
  }

  .opening-generating-hint {
    font-size: 14px;
  }
}

// 正文区域（重ROLL 时虚化）
.maintext-area {
  flex: 1;
  min-height: 0;
  transition: filter 0.2s ease;
  overflow-y: auto;
  padding-right: calc(6px * var(--ui-scale, 1));

  &.is-blurred {
    filter: blur(calc(4px * var(--ui-scale, 1)));
    pointer-events: none;
  }
}

.maintext-container {
  cursor: default;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;

  &.can-long-press {
    cursor: pointer;
  }
}

.maintext-content {
  font-size: calc(16px * var(--ui-scale, 1));
  line-height: 1.8;
  color: #e4e4e7;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.dark .maintext-content {
  color: #e4e4e7;
}

.light .maintext-content {
  color: #27272a;
}

.maintext-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  color: #71717a;
  text-align: center;

  .hint {
    font-size: 12px;
    margin-top: 8px;
    color: #52525b;
  }
}

.light .maintext-placeholder {
  color: #a1a1aa;

  .hint {
    color: #d4d4d8;
  }
}

// 长按正文：上下文菜单
.context-menu.maintext-context-menu {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;

  .context-menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    font-size: 13px;
    font-weight: 600;
  }

  .context-menu-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0 4px;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }

  .context-menu-item {
    display: block;
    width: 100%;
    padding: 10px 16px;
    text-align: left;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.15s;

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
}

.maintext-context-menu.dark {
  background: rgba(24, 24, 27, 0.98);
  border: 1px solid rgba(63, 63, 70, 0.8);

  .context-menu-header,
  .context-menu-item {
    color: #e4e4e7;
  }
}

.maintext-context-menu.light {
  background: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(0, 0, 0, 0.1);

  .context-menu-header,
  .context-menu-item {
    color: #27272a;
  }

  .context-menu-item:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.06);
  }
}

// 编辑正文模态框
.edit-maintext-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
}

.edit-maintext-modal {
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.edit-maintext-modal.dark {
  background: #18181b;
  border: 1px solid rgba(63, 63, 70, 0.8);
}

.edit-maintext-modal.light {
  background: #fafafa;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.edit-maintext-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
  }

  .close-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
    padding: 0 4px;
    opacity: 0.8;

    &:hover {
      opacity: 1;
    }
  }
}

.edit-maintext-modal.dark .edit-maintext-header {
  color: #e4e4e7;
  border-color: rgba(255, 255, 255, 0.1);

  .close-btn {
    color: #e4e4e7;
  }
}

.edit-maintext-modal.light .edit-maintext-header {
  color: #27272a;
  border-color: rgba(0, 0, 0, 0.1);

  .close-btn {
    color: #27272a;
  }
}

.edit-maintext-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
}

.edit-maintext-textarea {
  width: 100%;
  min-height: 320px;
  padding: 12px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.variable-reroll-hint {
  font-size: 13px;
  line-height: 1.6;
  opacity: 0.9;

  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
    padding: 2px 6px;
    border-radius: 6px;
    background: rgba(127, 127, 127, 0.15);
  }
}

// 右下角变量按钮
.variable-fab {
  position: absolute;
  right: var(--space-xl);
  bottom: calc(120px * var(--ui-scale, 1));
  z-index: 15;
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: calc(10px * var(--ui-scale, 1)) var(--space-md);
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
  font-size: calc(13px * var(--ui-scale, 1));
  user-select: none;

  &:hover {
    transform: translateY(calc(-1px * var(--ui-scale, 1)));
  }

  i {
    font-size: calc(14px * var(--ui-scale, 1));
  }
}

.variable-fab-text {
  font-weight: 600;
  letter-spacing: 0.02em;
}

.variable-fab.dark {
  background: rgba(39, 39, 42, 0.85);
  border-color: rgba(63, 63, 70, 0.8);
  color: #e4e4e7;

  &:hover {
    background: rgba(63, 63, 70, 0.7);
  }
}

.variable-fab.light {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(0, 0, 0, 0.12);
  color: #27272a;

  &:hover {
    background: rgba(244, 244, 245, 0.95);
  }
}

// =========================
// 响应式布局（手机/平板）
// =========================

// 平板及以下：去掉桌面端固定高度限制
@media (max-width: 1024px) {
  // 平板及以下：宽度自适应，但保留用户设置的高度
  .rule-modifier {
    max-width: 100%;
  }

  .sidebar,
  .middle-panel,
  .main-panel {
    max-height: var(--ui-max-height, none);
  }

  .middle-panel {
    width: min(90vw, 520px);
  }

  .panel-inner {
    width: 100%;
  }
}

// 手机端：底部导航 + 中间面板全屏抽屉 + 适配视口高度
@media (max-width: 768px) {
  .rule-modifier {
    max-width: 100%;
    width: 100%;
    margin: 0;
    // 手机端高度使用 CSS 变量，支持自定义高度
    height: var(--ui-max-height, 100dvh);
    max-height: var(--ui-max-height, 100dvh);
    // 为底部导航留出空间
    padding-bottom: 72px;
  }

  // Sidebar 变成底部栏
  .sidebar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 72px;
    max-height: none;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    border-right: none;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    z-index: 50;
  }

  .light .sidebar {
    border-top-color: rgba(0, 0, 0, 0.08);
  }

  // 底部栏不显示 logo 区与分组布局，改为水平排列
  .sidebar-top .logo {
    display: none;
  }

  .sidebar-top,
  .sidebar-bottom {
    padding: 0;
    border: none;
  }

  .sidebar-top .nav-items {
    padding: 8px 10px;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    justify-content: space-around;
    width: 100%;
  }

  // 底部栏按钮：仅图标为主，文字隐藏
  .nav-btn {
    padding: 10px 12px;
    border-radius: 14px;
  }

  .nav-label {
    display: none;
  }

  // Middle panel 变成全屏抽屉（覆盖正文）
  .middle-panel {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100dvh;
    max-height: none;
    z-index: 60;
    border-left: none;
    border-right: none;
    border-radius: 0;
  }

  .panel-inner {
    width: 100%;
  }

  .panel-content {
    padding: 16px 16px;
  }

  .panel-header {
    padding: 0 16px;
  }

  // 主面板占满宽度；输入区避免被底部导航遮挡
  .main-panel {
    max-height: none;
  }

  .input-area {
    padding-bottom: calc(24px + env(safe-area-inset-bottom));
  }

  // 右下角浮动按钮在手机上抬高一点，避免和底部栏/输入框打架
  .variable-fab {
    bottom: calc(152px * var(--ui-scale, 1));
    right: var(--space-lg);
  }
}

.edit-maintext-modal.dark .edit-maintext-textarea {
  background: rgba(39, 39, 42, 0.8);
  border: 1px solid rgba(63, 63, 70, 0.8);
  color: #e4e4e7;
}

.edit-maintext-modal.light .edit-maintext-textarea {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #27272a;
}

.edit-maintext-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  flex-shrink: 0;
}

// 选项区域
.options-area {
  z-index: 12;
  margin-top: 0;
  flex-shrink: 0;
  padding-top: var(--space-md);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(calc(10px * var(--ui-scale, 1)));
}

.dark .options-area {
  border-color: rgba(255, 255, 255, 0.1);
  background: linear-gradient(
    to top,
    rgba(3, 3, 3, 0.92) 0%,
    rgba(3, 3, 3, 0.75) 65%,
    rgba(3, 3, 3, 0) 100%
  );
}

.light .options-area {
  border-color: rgba(0, 0, 0, 0.1);
  background: linear-gradient(
    to top,
    rgba(250, 250, 250, 0.96) 0%,
    rgba(250, 250, 250, 0.82) 65%,
    rgba(250, 250, 250, 0) 100%
  );
}

.options-title {
  font-size: calc(14px * var(--ui-scale, 1));
  font-weight: 500;
  color: #a1a1aa;
  margin-bottom: var(--space-md);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.dark .options-title {
  color: #a1a1aa;
}

.light .options-title {
  color: #71717a;
}

.options-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  width: 100%;
  padding: calc(10px * var(--ui-scale, 1)) var(--space-md);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
  font-size: calc(14px * var(--ui-scale, 1));
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: var(--space-sm);

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }

  i {
    font-size: calc(12px * var(--ui-scale, 1));
    transition: transform 0.2s;
  }
}

.dark .options-toggle {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
}

.light .options-toggle {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.05);
  color: #27272a;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

// 选项列表展开/折叠动画
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  overflow: hidden;
}

.option-btn {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-radius: var(--radius-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateX(calc(4px * var(--ui-scale, 1)));
  }
}

.dark .option-btn {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #e4e4e7;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
  }
}

.light .option-btn {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.05);
  color: #27272a;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
    border-color: rgba(0, 0, 0, 0.2);
  }
}

.option-id {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(28px * var(--ui-scale, 1));
  height: calc(28px * var(--ui-scale, 1));
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.1);
  font-size: calc(12px * var(--ui-scale, 1));
  font-weight: 600;
  flex-shrink: 0;
}

.dark .option-id {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.light .option-id {
  background: rgba(0, 0, 0, 0.1);
  color: #18181b;
}

.option-text {
  font-size: calc(14px * var(--ui-scale, 1));
  line-height: 1.5;
}

// 阅读模式和读档模式
.reader-mode,
.save-mode {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.mode-header {
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 16px;

  h3 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  p {
    font-size: 13px;
    color: #a1a1aa;
  }
}

.dark .mode-header {
  border-color: rgba(255, 255, 255, 0.1);

  h3 { color: #f4f4f5; }
  p { color: #a1a1aa; }
}

.light .mode-header {
  border-color: rgba(0, 0, 0, 0.1);

  h3 { color: #18181b; }
  p { color: #71717a; }
}

.history-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);

  .history-meta {
    font-size: 12px;
    color: #71717a;
    margin-bottom: 8px;
    font-family: monospace;
    display: flex;
    align-items: center;
    gap: 8px;

    .turn-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      background: rgba(96, 165, 250, 0.15);
      color: #60a5fa;
    }
  }

  .history-content {
    font-size: 14px;
    line-height: 1.6;
    color: #e4e4e7;
    white-space: pre-wrap;
  }
}

.dark .history-item {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.02);

  .history-meta { color: #71717a; }
  .history-content { color: #e4e4e7; }
}

.light .history-item {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;

  .history-meta {
    color: #a1a1aa;

    .turn-badge {
      background: rgba(37, 99, 235, 0.1);
      color: #2563eb;
    }
  }
  .history-content { color: #27272a; }
}

.save-item {
  cursor: pointer;
  transition: all 0.2s;
  position: relative;

  &:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.1);
  }

  .branch-hint {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 12px;
    padding-top: var(--space-md);
    border-top: 1px dashed rgba(255, 255, 255, 0.1);
    font-size: 12px;
    color: #3b82f6;

    i {
      font-size: 14px;
    }
  }
}

.dark .save-item {
  &:hover {
    border-color: rgba(96, 165, 250, 0.5);
    background: rgba(96, 165, 250, 0.1);
  }

  .branch-hint {
    border-color: rgba(255, 255, 255, 0.1);
    color: #60a5fa;
  }
}

.light .save-item {
  &:hover {
    border-color: rgba(37, 99, 235, 0.5);
    background: rgba(37, 99, 235, 0.1);
  }

  .branch-hint {
    border-color: rgba(0, 0, 0, 0.1);
    color: #2563eb;
  }
}

.empty-state {
  text-align: center;
  padding: 48px 24px;
  color: #71717a;
  font-size: 14px;
  line-height: 1.6;

  small {
    display: block;
    margin-top: 8px;
    font-size: 12px;
    opacity: 0.8;
  }
}

.dark .empty-state {
  color: #71717a;

  small {
    color: #52525b;
  }
}

.light .empty-state {
  color: #a1a1aa;

  small {
    color: #d4d4d8;
  }
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
  padding: var(--space-lg) calc(32px * var(--ui-scale, 1));
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

// 输入框 + 发送：一体条（flex），避免按钮浮在框内产生缝隙
.input-wrapper {
  display: flex;
  align-items: stretch;
  max-width: calc(1000px * var(--ui-scale, 1));
  margin: 0 auto;
  border-radius: var(--radius-xl);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  transition: box-shadow 0.2s, border-color 0.2s;

  &:focus-within {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.2);
  }

  textarea {
    flex: 1;
    min-width: 0;
    width: auto;
    border: none;
    border-radius: 0;
    padding: var(--space-md) var(--space-md) var(--space-md) var(--space-xl);
    font-size: calc(15px * var(--ui-scale, 1));
    line-height: 1.5;
    resize: none;
    outline: none;
    background: transparent;
    color: inherit;
    transition: color 0.2s, opacity 0.2s;

    &::placeholder {
      color: #52525b;
    }

    &:disabled {
      opacity: 0.75;
      cursor: not-allowed;
    }
  }
}

.dark .input-wrapper {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #fff;

  &:focus-within {
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.22);
  }

  textarea {
    &::placeholder {
      color: #52525b;
    }

    &:disabled {
      color: #71717a;
    }
  }
}

.light .input-wrapper {
  border-color: rgba(0, 0, 0, 0.1);
  background: #fff;
  color: #18181b;

  &:focus-within {
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.18);
    border-color: rgba(0, 0, 0, 0.18);
  }

  textarea {
    &::placeholder {
      color: #a1a1aa;
    }

    &:disabled {
      color: #a1a1aa;
    }
  }
}

// 发送按钮：贴在输入条右侧，与框共用外轮廓
.send-btn {
  position: static;
  transform: none;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  min-width: calc(72px * var(--ui-scale, 1));
  padding: 0 var(--space-lg);
  margin: 0;
  border: none;
  border-radius: 0;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  font-size: calc(14px * var(--ui-scale, 1));
  font-weight: 500;
  transition: background 0.2s, color 0.2s;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.7;
    background: rgba(47, 54, 61, 0.6) !important;
    color: #71717a !important;
  }
}

.main-panel.dark .send-btn {
  background: #363f46;
  color: #a9a9a9;
  border-left-color: rgba(255, 255, 255, 0.12);

  &:hover:not(:disabled) {
    background: #434d58;
    color: #d4d4d8;
  }

  &:disabled {
    background: rgba(47, 54, 61, 0.8) !important;
    color: #71717a !important;
  }
}

.main-panel.light .send-btn {
  background: #e5e7eb;
  color: #6b7280;
  border-left-color: rgba(0, 0, 0, 0.08);

  &:hover:not(:disabled) {
    background: #d1d5db;
    color: #374151;
  }

  &:disabled {
    background: rgba(229, 231, 235, 0.8) !important;
    color: #9ca3af !important;
  }
}

// 生成中动画提示
.generating-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  font-size: calc(14px * var(--ui-scale, 1));
  color: #60a5fa;

  i {
    animation: pulse 1.5s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

// Modal（需高于 .middle-panel 手机抽屉 z-index: 60，否则点「编辑」弹窗在抽屉下方看不见）
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 80;
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

.rule-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  h2 {
    flex: 1;
    text-align: center;
    margin: 0;
  }
}

.btn-complete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: #22c55e;
  color: #fff;
  flex-shrink: 0;

  &:hover {
    background: #16a34a;
  }
}

.btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: #ef4444;
  color: #fff;
  flex-shrink: 0;

  &:hover {
    background: #dc2626;
  }
}

.rule-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: #a1a1aa;
}

.dark .form-label {
  color: #a1a1aa;
}

.light .form-label {
  color: #71717a;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  font-family: inherit;
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

.dark .form-input,
.dark .form-textarea {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;

  &::placeholder {
    color: #71717a;
  }
}

.light .form-input,
.light .form-textarea {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.15);
  color: #18181b;

  &::placeholder {
    color: #a1a1aa;
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

// 末尾玩家楼层提示（叠在标签弹窗之上，避免被挡）
.orphan-user-floor-overlay {
  z-index: 10002;
}

.orphan-user-floor-modal {
  max-width: 440px;
  width: 100%;
}

.orphan-user-floor-intro,
.orphan-user-floor-hint {
  font-size: 14px;
  line-height: 1.55;
  margin: 0 0 12px;
  color: #a1a1aa;
}

.light .orphan-user-floor-intro,
.light .orphan-user-floor-hint {
  color: #52525b;
}

.orphan-user-floor-meta {
  font-size: 13px;
  margin: 0 0 12px;
  color: #e4e4e7;

  code {
    font-family: ui-monospace, monospace;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.08);
  }
}

.light .orphan-user-floor-meta {
  color: #27272a;

  code {
    background: rgba(0, 0, 0, 0.06);
  }
}

.orphan-user-floor-footer {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-end;
}

// 标签验证弹窗样式 - 紧凑设计
.tag-validation-overlay {
  z-index: 10001;
  align-items: flex-start;
  justify-content: center;
  padding: 8px 10px;
  padding-top: calc(48px * var(--ui-scale, 1));
}

.tag-validation-modal {
  max-width: 440px;
  width: 100%;
  max-height: min(78vh, calc(100dvh - 88px));
  overflow-y: auto;
}

.tag-validation-modal .modal-header {
  padding: 10px 14px;

  h2 {
    font-size: 15px;
  }
}

.tag-validation-modal .modal-body {
  padding: 10px 14px;
  min-height: auto;
}

.tag-validation-modal .modal-footer {
  padding: 10px 14px;
}

.tag-validation-content {
  .validation-intro {
    font-size: 12px;
    color: #a1a1aa;
    margin: 0 0 4px;
    line-height: 1.35;
  }

  .ai-output-time {
    font-size: 11px;
    margin-bottom: 8px;
    font-family: ui-monospace, monospace;
    opacity: 0.95;
    color: #a1a1aa;
  }

  .tag-status-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;

    @media (max-width: 380px) {
      grid-template-columns: 1fr;
    }
  }

  .tag-status-item {
    padding: 6px 8px;
    border-radius: 6px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
    min-width: 0;

    &.is-valid {
      border-color: rgba(34, 197, 94, 0.3);
      background: rgba(34, 197, 94, 0.05);
    }

    &.is-invalid {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.05);
    }
  }

  .tag-status-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 2px;
  }

  .tag-name {
    font-size: 12px;
    font-weight: 600;
    color: #e4e4e7;
    line-height: 1.25;
    min-width: 0;
  }

  .tag-name-code {
    display: block;
    font-family: ui-monospace, monospace;
    font-size: 10px;
    font-weight: 500;
    opacity: 0.75;
    margin-top: 2px;
    word-break: break-all;
  }

  .tag-badge {
    flex-shrink: 0;
    font-size: 10px;
    padding: 2px 5px;
    border-radius: 4px;
    font-weight: 500;

    &.badge-success {
      background: rgba(34, 197, 94, 0.15);
      color: #22c55e;
    }

    &.badge-error {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }
  }

  .tag-message {
    font-size: 11px;
    color: #71717a;
    margin: 0;
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .validation-warning {
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 6px;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.2);
    display: flex;
    align-items: flex-start;
    gap: 6px;
    font-size: 11px;
    color: #f59e0b;

    i {
      font-size: 11px;
      margin-top: 1px;
    }
  }

  .ai-output-section {
    margin-top: 8px;
  }

  .ai-output-toggle {
    font-size: 12px;
    padding: 6px 0;
  }
}

.dark .tag-validation-content {
  .validation-intro { color: #a1a1aa; }
  .ai-output-time { color: #a1a1aa; }
  .tag-name { color: #e4e4e7; }
  .tag-message { color: #71717a; }
}

.light .tag-validation-content {
  .validation-intro { color: #71717a; }
  .ai-output-time { color: #71717a; }
  .tag-name { color: #27272a; }
  .tag-message { color: #a1a1aa; }

  .tag-status-item {
    border-color: rgba(0, 0, 0, 0.1);
    background: #fff;

    &.is-valid {
      border-color: rgba(34, 197, 94, 0.3);
      background: rgba(34, 197, 94, 0.05);
    }

    &.is-invalid {
      border-color: rgba(239, 68, 68, 0.3);
      background: rgba(239, 68, 68, 0.05);
    }
  }
}

.tag-validation-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  button {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px; // 减小按钮 padding
    font-size: 13px; // 减小字体
  }
}

.btn-rollback {
  background: rgba(239, 68, 68, 0.1) !important;
  color: #ef4444 !important;

  &:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }
}

.btn-continue {
  background: rgba(245, 158, 11, 0.15) !important;
  color: #f59e0b !important;

  &:hover {
    background: rgba(245, 158, 11, 0.25) !important;
  }
}

// AI 完整输出展示区域
.ai-output-section {
  margin-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: var(--space-md);
}

.dark .ai-output-section {
  border-color: rgba(255, 255, 255, 0.1);
}

.light .ai-output-section {
  border-color: rgba(0, 0, 0, 0.1);
}

.ai-output-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #a1a1aa;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e4e4e7;
  }

  i {
    font-size: 10px;
    transition: transform 0.2s;
  }

  .output-length {
    margin-left: auto;
    font-size: 11px;
    color: #71717a;
    font-family: monospace;
  }
}

.dark .ai-output-toggle {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.05);
  color: #a1a1aa;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #e4e4e7;
  }

  .output-length {
    color: #71717a;
  }
}

.light .ai-output-toggle {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.05);
  color: #71717a;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #27272a;
  }

  .output-length {
    color: #a1a1aa;
  }
}

.ai-output-content {
  margin-top: 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.dark .ai-output-content {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
}

.light .ai-output-content {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.05);
}

.ai-output-text {
  margin: 0;
  padding: 12px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  line-height: 1.5;
  color: #d4d4d8;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow-y: auto;

  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.dark .ai-output-text {
  color: #d4d4d8;

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.light .ai-output-text {
  color: #52525b;

  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}
</style>
