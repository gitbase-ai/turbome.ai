import { Injectable } from '@nestjs/common';
import { GitUtil } from '../../../utils/git.util';
import { V2Repo } from '@shared/index';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ReposService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 获取 repos 列表
   */
  async getReposList(): Promise<V2Repo.RepoInfo[]> {
    const config = await this.configService.readLocalConfig();
    return config.repos || [];
  }

  /**
   * 根据 URL 获取指定的 repo 信息
   */
  async getRepoByUrl(url: string): Promise<V2Repo.RepoInfo> {
    const config = await this.configService.readLocalConfig();
    const repos = config.repos || [];

    const repo = repos.find((r) => r.url === url);

    if (!repo) {
      throw new Error(`Repository with URL "${url}" not found`);
    }

    return repo;
  }

  /**
   * 添加 repo
   */
  async addRepo(repoPath: string): Promise<V2Repo.RepoInfo[]> {
    const config = await this.configService.readLocalConfig();
    if (!config.repos) {
      config.repos = [];
    }

    // 避免重复添加（根据 localPath 判断）
    const exists = config.repos.some((r) => r.localPath === repoPath);
    if (!exists) {
      // 需要从 repoPath 读取 git 信息
      const gitUtil = new GitUtil(repoPath);
      const isRepo = await gitUtil.isGitRepository();
      if (!isRepo) {
        throw new Error('Not a git repository');
      }

      const originUrl = await gitUtil.getGitConfigValue('remote.origin.url');
      if (!originUrl) {
        throw new Error('No remote origin URL found');
      }

      const normalizedUrl = this.normalizeGitUrl(originUrl);

      config.repos.push({
        origin: originUrl,
        url: normalizedUrl,
        localPath: repoPath,
      });
      await this.configService.writeConfig(config);
    }

    return config.repos;
  }

  /**
   * 删除 repo
   */
  async removeRepo(repoPath: string): Promise<V2Repo.RepoInfo[]> {
    const config = await this.configService.readLocalConfig();
    if (config.repos) {
      config.repos = config.repos.filter((r) => r.localPath !== repoPath);
      await this.configService.writeConfig(config);
    }

    return config.repos || [];
  }

  /**
   * 获取配置文件中设置的当前 repo
   */
  async getCurrentRepo(): Promise<V2Repo.RepoInfo> {
    const config = await this.configService.readLocalConfig();

    // 读取当前选中的 repo URL
    const currentRepoUrl = config.repo;
    if (!currentRepoUrl) {
      throw new Error('No current repository set in config');
    }

    // 从 repos 列表中查找匹配的 repo
    const repos = config.repos || [];
    const repo = repos.find((r) => r.url === currentRepoUrl);

    if (!repo) {
      throw new Error(
        `Repository with URL "${currentRepoUrl}" not found in repos list`,
      );
    }

    return repo;
  }

  /**
   * 获取当前工作目录的 git repo 信息
   */
  async getLocalRepo(): Promise<V2Repo.RepoInfo> {
    const cwd = process.cwd();
    const gitUtil = new GitUtil(cwd);

    // 检查是否是 git 仓库
    const isRepo = await gitUtil.isGitRepository();
    if (!isRepo) {
      throw new Error('Current directory is not a git repository');
    }

    // 获取 remote.origin.url
    const originUrl = await gitUtil.getGitConfigValue('remote.origin.url');
    if (!originUrl) {
      throw new Error('No remote origin URL found');
    }

    // 转换 URL
    const normalizedUrl = this.normalizeGitUrl(originUrl);

    return {
      origin: originUrl,
      url: normalizedUrl,
      localPath: cwd,
    };
  }

  /**
   * 将 git URL 转换为标准格式（去掉协议，兼容 HTTPS 和 SSH）
   *
   * Examples:
   * - https://github.com/user/repo.git -> github.com/user/repo
   * - git@github.com:user/repo.git -> github.com/user/repo
   * - ssh://git@github.com/user/repo.git -> github.com/user/repo
   */
  private normalizeGitUrl(gitUrl: string): string {
    let url = gitUrl.trim();

    // 移除 .git 后缀
    if (url.endsWith('.git')) {
      url = url.slice(0, -4);
    }

    // 处理 HTTPS URL: https://github.com/user/repo
    if (url.startsWith('https://')) {
      return url.replace('https://', '');
    }

    // 处理 HTTP URL: http://github.com/user/repo
    if (url.startsWith('http://')) {
      return url.replace('http://', '');
    }

    // 处理 SSH URL: git@github.com:user/repo
    if (url.includes('@') && url.includes(':')) {
      const match = url.match(/^(?:ssh:\/\/)?(.+)@([^:]+):(.+)$/);
      if (match) {
        const [, , host, path] = match;
        return `${host}/${path}`;
      }
    }

    // 处理 ssh:// 协议: ssh://git@github.com/user/repo
    if (url.startsWith('ssh://')) {
      url = url.replace('ssh://', '');
      if (url.includes('@')) {
        // ssh://git@github.com/user/repo -> github.com/user/repo
        const match = url.match(/^[^@]+@(.+)$/);
        if (match) {
          return match[1];
        }
      }
    }

    // 如果都不匹配，返回原始值
    return url;
  }
}
