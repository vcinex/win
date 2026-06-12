import { ref, onUnmounted } from 'vue';
import type { WindowState } from '@/types';

interface WindowInteractOptions {
  windowState: WindowState;
  minWidth: number;
  minHeight: number;
  taskbarHeight: number;
  onUpdate: (updates: Partial<WindowState>) => void;
  onFocus: () => void;
}

export function useWindowInteract(options: WindowInteractOptions) {
  const isDragging = ref(false);
  const isResizing = ref(false);

  // 局部高性能缓存，脱离 Store 实现 60fps 拖拽
  const localRect = ref({
    x: options.windowState.position.x,
    y: options.windowState.position.y,
    w: options.windowState.size.width,
    h: options.windowState.size.height
  });

  let cleanup: (() => void) | null = null;

  const bindEvents = (onMove: (e: MouseEvent) => void) => {
    const handleMove = (e: MouseEvent) => {
      // 异常松开处理：防止鼠标移动到 iframe 或浏览器外部松开导致的挂起
      if (e.buttons === 0) return handleUp();
      onMove(e);
    };

    const handleUp = () => {
      cleanup?.();
      isDragging.value = false;
      isResizing.value = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';

      // 交互结束时，才将最终坐标状态同步回 Store
      options.onUpdate({
        position: { x: localRect.value.x, y: localRect.value.y },
        size: { width: localRect.value.w, height: localRect.value.h }
      });
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);

    cleanup = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  };

  const startDrag = (e: MouseEvent) => {
    // 防止点击标题栏按钮时触发拖拽，且最大化时不应拖拽
    if ((e.target as HTMLElement).closest('.no-drag') || options.windowState.maximized) return;
    options.onFocus();
    isDragging.value = true;
    document.body.style.userSelect = 'none';

    const startX = e.clientX - localRect.value.x;
    const startY = e.clientY - localRect.value.y;

    bindEvents((moveEvent) => {
      const newX = moveEvent.clientX - startX;
      const newY = moveEvent.clientY - startY;

      // ✅ 修复：补充 X 轴边界保护，防止窗口被彻底拖出屏幕左右侧
      const minX = -localRect.value.w + 40;
      const maxX = window.innerWidth - 40;
      const clampedX = Math.max(minX, Math.min(newX, maxX));

      // ✅ 修复：Y 轴边界保护
      const maxY = window.innerHeight - options.taskbarHeight - 40;
      const clampedY = Math.max(0, Math.min(newY, maxY));

      localRect.value.x = clampedX;
      localRect.value.y = clampedY;
    });
  };

  const startResize = (e: MouseEvent, dir: string) => {
    options.onFocus();
    isResizing.value = true;
    document.body.style.cursor = getComputedStyle(e.target as HTMLElement).cursor;
    document.body.style.userSelect = 'none';

    const start = { x: e.clientX, y: e.clientY };
    const initial = { ...localRect.value };

    bindEvents((moveEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;

      let { x, y, w, h } = initial;

      if (dir.includes('right')) w = Math.max(options.minWidth, initial.w + dx);
      if (dir.includes('bottom')) h = Math.max(options.minHeight, initial.h + dy);

      // 左侧缩放边界锁定，平滑处理到达最小宽度的情况
      if (dir.includes('left')) {
        const targetW = initial.w - dx;
        if (targetW >= options.minWidth) {
          w = targetW;
          x = initial.x + dx;
        } else {
          w = options.minWidth;
          x = initial.x + initial.w - options.minWidth;
        }
      }

      // 顶部缩放边界锁定，平滑处理到达最小高度的情况
      if (dir.includes('top')) {
        const targetH = initial.h - dy;
        if (targetH >= options.minHeight) {
          h = targetH;
          y = initial.y + dy;
        } else {
          h = options.minHeight;
          y = initial.y + initial.h - options.minHeight;
        }
      }

      localRect.value = { x, y, w, h };
    });
  };

  onUnmounted(() => cleanup?.());

  return { isDragging, isResizing, localRect, startDrag, startResize };
}
