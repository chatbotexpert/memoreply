import 'fake-indexeddb/auto';

// Mock chrome APIs for NodeJS/Vitest environment
const mockStorage: Record<string, any> = {};

(globalThis as any).chrome = {
  storage: {
    local: {
      get: async (keys: any) => {
        if (typeof keys === 'string') {
          return { [keys]: mockStorage[keys] };
        }
        if (Array.isArray(keys)) {
          const res: Record<string, any> = {};
          keys.forEach((k) => (res[k] = mockStorage[k]));
          return res;
        }
        return { ...mockStorage };
      },
      set: async (items: Record<string, any>) => {
        Object.assign(mockStorage, items);
      },
      remove: async (keys: any) => {
        const arr = Array.isArray(keys) ? keys : [keys];
        arr.forEach((k) => delete mockStorage[k]);
      },
      clear: async () => {
        for (const k of Object.keys(mockStorage)) {
          delete mockStorage[k];
        }
      },
    },
    onChanged: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
  runtime: {
    sendMessage: () => {},
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    lastError: null,
  },
  tabs: {
    query: async () => [],
    sendMessage: () => {},
    create: async () => {},
    onActivated: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
};
