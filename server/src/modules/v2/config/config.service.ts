import { Injectable } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { V2Repo } from '@shared/index';

export interface TurboMeConfig {
  repos?: V2Repo.RepoInfo[];
  repo?: string; // 当前选中的 repo URL
}

@Injectable()
export class ConfigService {
  private readonly configPath: string;

  constructor() {
    // ~/.turbome.json
    this.configPath = path.join(os.homedir(), '.turbome.json');
  }

  /**
   * 获取配置文件路径
   */
  getConfigPath(): string {
    return this.configPath;
  }

  /**
   * 读取本地配置文件，如果不存在则创建
   */
  async readLocalConfig(): Promise<TurboMeConfig> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // 文件不存在，创建默认配置
      if (error.code === 'ENOENT') {
        const defaultConfig: TurboMeConfig = {
          repos: [],
        };
        await this.writeConfig(defaultConfig);
        return defaultConfig;
      }
      throw error;
    }
  }

  /**
   * 写入配置文件
   */
  async writeConfig(config: TurboMeConfig): Promise<void> {
    await fs.writeFile(
      this.configPath,
      JSON.stringify(config, null, 2),
      'utf-8',
    );
  }
}
