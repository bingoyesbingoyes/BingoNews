import { ref } from 'vue';
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { appDataDir } from '@tauri-apps/api/path';
import type { AppConfig } from '../types';

const CONFIG_FILENAME = 'config.json';
const CONFIG_VERSION = '1.0.0';

function createDefaultConfig(): AppConfig {
  return {
    version: CONFIG_VERSION,
    categories: [],
    openCounts: {},
    settings: {
      theme: 'apple',
    },
  };
}

export function useConfigFile() {
  const configPath = ref<string>('');

  async function initConfigPath(): Promise<string> {
    const dataDir = await appDataDir();
    const separator = dataDir.includes('\\') ? '\\' : '/';
    const normalizedDir = dataDir.endsWith(separator) ? dataDir : dataDir + separator;
    configPath.value = `${normalizedDir}${CONFIG_FILENAME}`;
    return configPath.value;
  }

  async function readConfig(): Promise<AppConfig> {
    try {
      const path = configPath.value || await initConfigPath();
      if (!await exists(path)) {
        const defaultConfig = createDefaultConfig();
        await writeConfig(defaultConfig);
        return defaultConfig;
      }
      return JSON.parse(await readTextFile(path)) as AppConfig;
    } catch (e) {
      console.error('Failed to read config:', e);
      return createDefaultConfig();
    }
  }

  async function writeConfig(config: AppConfig): Promise<void> {
    try {
      const path = configPath.value || await initConfigPath();
      const dataDir = await appDataDir();
      if (!await exists(dataDir)) {
        await mkdir(dataDir, { recursive: true });
      }
      await writeTextFile(path, JSON.stringify(config, null, 2));
    } catch (e) {
      console.error('Failed to write config:', e);
    }
  }

  function startWatching(onConfigChange: (config: AppConfig) => void): void {
    let lastContent = '';

    async function initWatch() {
      const path = configPath.value || await initConfigPath();
      try {
        lastContent = await readTextFile(path);
      } catch {
        lastContent = '';
      }
      setInterval(async () => {
        try {
          const content = await readTextFile(path);
          if (content && content !== lastContent) {
            lastContent = content;
            onConfigChange(JSON.parse(content) as AppConfig);
          }
        } catch {
          // Ignore transient file errors while polling.
        }
      }, 2000);
    }

    void initWatch();
  }

  return {
    initConfigPath,
    readConfig,
    writeConfig,
    startWatching,
  };
}
