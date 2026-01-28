import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// 优先编译的热门扩展列表
const PRIORITY_EXTENSIONS = [
  // 语言
  'python', 'javascript', 'typescript', 'rust', 'go', 'java', 'c', 'cpp',
  'html', 'css', 'json', 'yaml', 'toml', 'markdown', 'sql', 'lua',
  'ruby', 'php', 'swift', 'kotlin', 'scala', 'dart', 'elixir',
  // 主题
  'catppuccin', 'dracula', 'gruvbox', 'nord', 'one-dark', 'monokai',
  // 工具
  'dockerfile', 'git-firefly', 'make', 'snippets'
];

// 读取 .gitmodules 文件
const gitmodules = fs.readFileSync('.gitmodules', 'utf-8');

// 解析 submodules
const extensions = [];
const regex = /\[submodule "extensions\/([^"]+)"\]\s+path = extensions\/([^\s]+)\s+url = ([^\s]+)/g;

let match;
while ((match = regex.exec(gitmodules)) !== null) {
    const [, id, , url] = match;
    let repoUrl = url.replace(/\.git$/, '');

    // 提取 owner/repo
    const githubMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    const owner = githubMatch ? githubMatch[1] : '';
    const repo = githubMatch ? githubMatch[2] : '';

    extensions.push({
        id: id,
        repository: repoUrl,
        owner: owner,
        repo: repo,
        // 下载编译好的包 (从 releases)
        download_url: `https://github.com/yanghao1143/chicode-extensions/releases/download/extensions-latest/${id}.tar.gz`,
        // 备用: 直接从源码仓库下载
        source_url: `${repoUrl}/archive/refs/heads/main.zip`,
        // GitHub API
        api_url: `https://api.github.com/repos/${owner}/${repo}`,
        // 是否为优先扩展
        priority: PRIORITY_EXTENSIONS.includes(id)
    });
}

// 按优先级排序
extensions.sort((a, b) => {
    if (a.priority && !b.priority) return -1;
    if (!a.priority && b.priority) return 1;
    return a.id.localeCompare(b.id);
});

// 生成索引
const index = {
    version: 2,
    generated_at: new Date().toISOString(),
    repository: "https://github.com/yanghao1143/chicode-extensions",
    releases_url: "https://github.com/yanghao1143/chicode-extensions/releases",
    total_count: extensions.length,
    priority_count: extensions.filter(e => e.priority).length,
    extensions: extensions
};

// 写入主索引
fs.writeFileSync('index.json', JSON.stringify(index, null, 2));

// 生成优先扩展列表 (用于 CI 优先编译)
const priorityList = extensions.filter(e => e.priority).map(e => e.id);
fs.writeFileSync('priority-extensions.json', JSON.stringify(priorityList, null, 2));

console.log(`Generated index.json:`);
console.log(`  - Total extensions: ${extensions.length}`);
console.log(`  - Priority extensions: ${priorityList.length}`);
console.log(`  - Priority list: ${priorityList.join(', ')}`);
