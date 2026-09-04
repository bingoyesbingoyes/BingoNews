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
  const isLoading = ref(true);
  const error = ref<string | null>(null);
  const configPath = ref<string>('');

  async function initConfigPath(): Promise<string> {
    const dataDir = await appDataDir();
    // Ensure proper path separator (dataDir may or may not end with separator)
    const separator = dataDir.includes('\\') ? '\\' : '/';
    const normalizedDir = dataDir.endsWith(separator) ? dataDir : dataDir + separator;
    configPath.value = `${normalizedDir}${CONFIG_FILENAME}`;
    return configPath.value;
  }

  async function readConfig(): Promise<AppConfig> {
    try {
      const path = configPath.value || await initConfigPath();
      const fileExists = await exists(path);

      if (!fileExists) {
        const defaultConfig = createDefaultConfig();
        await writeConfig(defaultConfig);
        return defaultConfig;
      }

      const content = await readTextFile(path);
      const config = JSON.parse(content) as AppConfig;
      isLoading.value = false;
      return config;
    } catch (e) {
      error.value = `Failed to read config: ${e}`;
      isLoading.value = false;
      return createDefaultConfig();
    }
  }

  async function writeConfig(config: AppConfig): Promise<void> {
    try {
      const path = configPath.value || await initConfigPath();

      // Ensure the directory exists
      const dataDir = await appDataDir();
      const dirExists = await exists(dataDir);
      if (!dirExists) {
        await mkdir(dataDir, { recursive: true });
      }

      const content = JSON.stringify(config, null, 2);
      await writeTextFile(path, content);
    } catch (e) {
      error.value = `Failed to write config: ${e}`;
      console.error('Failed to write config:', e);
    }
  }

  let pollInterval: ReturnType<typeof setInterval> | null = null;
  let lastContent = '';

  async function startWatching(onConfigChange: (config: AppConfig) => void): Promise<void> {
    // Use polling for file changes (cross-platform compatible)
    const path = configPath.value || await initConfigPath();

    // Initialize lastContent
    try {
      lastContent = await readTextFile(path);
    } catch {
      lastContent = '';
    }

    // Poll every 2 seconds for changes
    pollInterval = setInterval(async () => {
      try {
        if (!configPath.value) return;

        const content = await readTextFile(configPath.value);
        if (content && content !== lastContent) {
          lastContent = content;
          const config = JSON.parse(content) as AppConfig;
          onConfigChange(config);
        }
      } catch {
        // Ignore read errors during polling
      }
    }, 2000);

    console.log('Config file polling started');
  }

  function stopWatching() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  return {
    isLoading,
    error,
    configPath,
    initConfigPath,
    readConfig,
    writeConfig,
    startWatching,
    stopWatching,
  };
}
