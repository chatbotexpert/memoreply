/**
 * Chrome API Polyfill / Shim for Web Preview (Vercel, Local Dev, Mobile)
 * Enables seamless demo deployment on Vercel without throwing undefined Chrome extension errors.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
const isRealExtension = typeof window !== 'undefined' && Boolean(window.chrome?.runtime?.id);

if (typeof window !== 'undefined' && !isRealExtension) {
  const memoryStore: Record<string, any> = {};

  const safeChrome: any = (window as any).chrome || {};

  if (!safeChrome.storage || !safeChrome.storage.local) {
    safeChrome.storage = {
      local: {
        get: (keys: string | string[] | null, callback?: (items: any) => void) => {
          const result: Record<string, any> = {};
          const keyList = Array.isArray(keys) ? keys : typeof keys === 'string' ? [keys] : [];
          keyList.forEach((k) => {
            try {
              const val = localStorage.getItem(k);
              result[k] = val ? JSON.parse(val) : memoryStore[k];
            } catch {
              result[k] = memoryStore[k];
            }
          });
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        set: (items: Record<string, any>, callback?: () => void) => {
          Object.entries(items).forEach(([k, v]) => {
            memoryStore[k] = v;
            try {
              localStorage.setItem(k, JSON.stringify(v));
            } catch {
              // fallback to memoryStore
            }
          });
          if (callback) callback();
          return Promise.resolve();
        },
        remove: (keys: string | string[], callback?: () => void) => {
          const keyList = Array.isArray(keys) ? keys : [keys];
          keyList.forEach((k) => {
            delete memoryStore[k];
            try {
              localStorage.removeItem(k);
            } catch {}
          });
          if (callback) callback();
          return Promise.resolve();
        },
        clear: (callback?: () => void) => {
          Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);
          try {
            localStorage.clear();
          } catch {}
          if (callback) callback();
          return Promise.resolve();
        },
      },
      onChanged: {
        addListener: () => {},
        removeListener: () => {},
      },
    };
  }

  if (!safeChrome.runtime) {
    safeChrome.runtime = {};
  }
  if (!safeChrome.runtime.onMessage) {
    safeChrome.runtime.onMessage = {
      addListener: () => {},
      removeListener: () => {},
    };
  }
  if (!safeChrome.runtime.sendMessage) {
    safeChrome.runtime.sendMessage = (_msg: any, callback?: (resp: any) => void) => {
      if (callback) callback({ success: false, error: 'Web preview mode' });
    };
  }

  if (!safeChrome.tabs) {
    safeChrome.tabs = {
      query: async () => [],
      sendMessage: (_id: any, _msg: any, callback?: (resp: any) => void) => {
        if (callback) callback({ success: false, error: 'Web preview mode' });
      },
      create: ({ url }: { url: string }) => {
        window.open(url, '_blank');
      },
      onActivated: {
        addListener: () => {},
        removeListener: () => {},
      },
    };
  }

  (window as any).chrome = safeChrome;
}

export const isWebPreview = !isRealExtension;
