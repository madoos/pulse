export type Config = {
  apiUrl: string;
};

declare global {
  interface Window {
    __CONFIG__?: Partial<Config>;
  }
}

export const loadConfig = (runtime: Partial<Config> | undefined = window.__CONFIG__): Config => {
  if (!runtime?.apiUrl) throw new Error('Missing runtime config: apiUrl');
  return { apiUrl: runtime.apiUrl.replace(/\/$/, '') };
};
