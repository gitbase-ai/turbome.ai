const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

/**
 * Check if current directory is a git repository
 */
function isGitRepository() {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      stdio: 'ignore',
      cwd: process.cwd()
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git remote origin URL
 */
function getGitOriginUrl() {
  try {
    const originUrl = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      cwd: process.cwd()
    }).trim();
    return originUrl;
  } catch {
    return null;
  }
}

/**
 * Normalize git URL to format: domain/owner/repo
 * Examples:
 * - https://github.com/user/repo.git -> github.com/user/repo
 * - git@github.com:user/repo.git -> github.com/user/repo
 */
function normalizeGitUrl(gitUrl) {
  let url = gitUrl.trim();

  // Remove .git suffix
  if (url.endsWith('.git')) {
    url = url.slice(0, -4);
  }

  // Handle HTTPS URL: https://github.com/user/repo
  if (url.startsWith('https://')) {
    return url.replace('https://', '');
  }

  // Handle HTTP URL: http://github.com/user/repo
  if (url.startsWith('http://')) {
    return url.replace('http://', '');
  }

  // Handle SSH URL: git@github.com:user/repo
  if (url.includes('@') && url.includes(':')) {
    const match = url.match(/^(?:ssh:\/\/)?(.+)@([^:]+):(.+)$/);
    if (match) {
      const [, , host, repoPath] = match;
      return `${host}/${repoPath}`;
    }
  }

  // Handle ssh:// protocol: ssh://git@github.com/user/repo
  if (url.startsWith('ssh://')) {
    url = url.replace('ssh://', '');
    if (url.includes('@')) {
      const match = url.match(/^[^@]+@(.+)$/);
      if (match) {
        return match[1];
      }
    }
  }

  return url;
}

/**
 * Initialize ~/.turbome.json
 *
 * TODO: This function currently overwrites the config file every time
 * when started in a git repository. This is a temporary behavior because
 * repo switching is not yet supported. Once repo switching is implemented,
 * restore the following logic:
 * 1. Check if config exists
 * 2. If exists, check if current repo is in the repos list
 * 3. If not in list, add it and update the 'repo' field
 * 4. If in list, just update the 'repo' field to switch to it
 * 5. Only create new config if it doesn't exist
 */
function initializeConfig() {
  const configPath = path.join(os.homedir(), '.turbome.json');

  // TODO: Remove this behavior once repo switching is supported
  // Currently: Always overwrite config with current git repository
  // This ensures the config always reflects the current working directory

  console.log('📝 Initializing TurboMe configuration...');

  // Check if current directory is a git repository
  if (!isGitRepository()) {
    console.error('❌ Error: Current directory is not a git repository.');
    console.error('   Please run "turbome" from within a git repository directory.');
    process.exit(1);
  }

  // Get git origin URL
  const originUrl = getGitOriginUrl();
  if (!originUrl) {
    console.error('❌ Error: No git remote origin URL found.');
    console.error('   Please ensure your repository has a remote origin configured.');
    process.exit(1);
  }

  // Normalize URL
  const normalizedUrl = normalizeGitUrl(originUrl);
  const localPath = process.cwd();

  // Create config object
  const config = {
    repos: [
      {
        origin: originUrl,
        url: normalizedUrl,
        localPath: localPath
      }
    ],
    repo: normalizedUrl
  };

  // Write config file (overwrite if exists)
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('✅ Configuration initialized successfully!');
    console.log(`   Repository: ${normalizedUrl}`);
    console.log(`   Local path: ${localPath}`);
    console.log(`   Config file: ${configPath}`);
  } catch (error) {
    console.error('❌ Failed to write configuration file:', error.message);
    process.exit(1);
  }
}

module.exports = {
  initializeConfig
};
