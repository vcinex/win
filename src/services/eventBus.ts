import mitt from 'mitt';

import type { SystemIntents } from '@/types';

export const osBus = mitt<SystemIntents>();
