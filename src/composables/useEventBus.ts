import { onUnmounted } from 'vue';

import { osBus } from '@/services';
import type { SystemIntents } from '@/types';

export function useSystemEvent<T extends keyof SystemIntents>(
  event: T,
  handler: (payload: SystemIntents[T]) => void
) {
  osBus.on(event, handler);

  onUnmounted(() => {
    osBus.off(event, handler);
  });
}
