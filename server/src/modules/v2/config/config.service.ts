import { Injectable, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { V2Repo } from '@shared/index';

export interface TurboMeConfig {
  repos?: V2Repo.RepoInfo[];
  repo?: string; // 当前选中的 repo URL
}

@Injectable()
export class ConfigService implements OnModuleInit {
  private readonly configPath: string;
  private configCache: TurboMeConfig | null = null;
  private isInitialized = false;

  constructor() {
    // ~/.turbome.json
    this.configPath = path.join(os.homedir(), '.turbome.json');
  }

  /**
   * 模块初始化时加载配置到缓存
   */
  async onModuleInit() {
    await this.loadConfigToCache();
    this.isInitialized = true;
    console.log('[ConfigService] Configuration loaded into cache');
  }

  /**
   * 从文件加载配置到缓存
   */
  private async loadConfigToCache(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      this.configCache = JSON.parse(content);
    } catch (error) {
      // 文件不存在，创建默认配置
      if (error.code === 'ENOENT') {
        const defaultConfig: TurboMeConfig = {
          repos: [],
        };
        await this.writeConfig(defaultConfig);
        this.configCache = defaultConfig;
      } else {
        throw error;
      }
    }
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 读取本地配置文件（从缓存读取）
   */
  async readLocalConfig(): Promise<TurboMeConfig> {
    // 如果缓存未初始化，先加载
    if (!this.isInitialized || this.configCache === null) {
      await this.loadConfigToCache();
    }

    // 返回缓存的深拷贝，避免外部修改影响缓存
    return JSON.parse(JSON.stringify(this.configCache));
  }

  /**
   * 清除缓存，强制重新加载
   */
  async reloadConfig(): Promise<void> {
    await this.loadConfigToCache();
  }

  /**
   * 写入配置文件（同时更新缓存）
   */
  async writeConfig(config: TurboMeConfig): Promise<void> {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8',
    );

    // 更新缓存
    this.configCache = JSON.parse(JSON.stringify(config));
  }
}
