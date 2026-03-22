import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './index.scss';

$(async () => {
  // 等待酒馆助手全局初始化完成
  await waitUntil(() => typeof getVariables === 'function', { timeout: 30000 });

  // ⭐ 关键：等待 MVU 变量框架初始化完成
  await waitGlobalInitialized('Mvu');

  // ⭐ 关键：等待变量被正确设置（确保 schema 已解析）
  await waitUntil(() => {
    try {
      const vars = getVariables({ type: 'message', message_id: getCurrentMessageId() });
      return _.has(vars, 'stat_data');
    } catch {
      return false;
    }
  }, { timeout: 10000 });

  console.log('🎮 [规则] 同层前端界面初始化完成，MVU 已就绪');

  // 创建 Vue 应用
  const app = createApp(App).use(createPinia());

  // 挂载到 #app
  app.mount('#app');

  console.log('✅ [规则] 同层前端界面已挂载');

  // 页面卸载时清理
  $(window).on('pagehide', () => {
    app.unmount();
  });
});
