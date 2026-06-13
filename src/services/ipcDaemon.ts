import { useAppManager } from '@/composables/useAppManager';
import { SystemIntents } from '@/types';
import mitt from 'mitt';

// 2. 实例化强类型的事件总线
// 导出给全系统使用
export const osBus = mitt<SystemIntents>();

let inited = false;
/**
 * 启动系统的 IPC 消息总线监听
 * 这相当于 OS 的事件轮询守护进程
 */
export function initIPCDaemon() {
  if (inited) return;
  inited = true;

  const appManager = useAppManager();

  // 监听拉起应用的 Intent
  osBus.on('intent:launch_app', (payload) => {
    console.log(`[IPC] Received launch intent for: ${payload.appId}`);
    appManager.launchApp(payload.appId, { props: payload.props });
  });

  // 监听关闭窗口的 Intent
  osBus.on('intent:close_window', (payload) => {
    appManager.closeWindow(payload.windowId);
  });
}
