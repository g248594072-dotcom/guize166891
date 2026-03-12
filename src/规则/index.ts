import { waitUntil } from 'async-wait-until';
import App from './App.vue';
import './index.scss';

$(async () => {
  // 等待酒馆助手全局初始化完成
  await waitUntil(() => typeof getVariables === 'function', { timeout: 30000 });

  // 创建 Vue 应用
  const app = createApp(App).use(createPinia());

  // 挂载到 #app
  app.mount('#app');

  // 页面卸载时清理
  $(window).on('pagehide', () => {
    app.unmount();
  });
});
