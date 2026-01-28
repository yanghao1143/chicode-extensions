import fs from 'fs';

// 读取 .gitmodules 文件
const gitmodules = fs.readFileSync('.gitmodules', 'utf-8');

// 解析 submodules
const extensions = [];
const regex = /\[submodule "extensions\/([^"]+)"\]\s+path = extensions\/([^\s]+)\s+url = ([^\s]+)/g;

let match;
while ((match = regex.exec(gitmodules)) !== null) {
    const [, id, , url] = match;

    // 转换 URL 格式
    let repoUrl = url.replace(/\.git$/, '');

    extensions.push({
        id: id,
        repository: repoUrl,
        // 直接从 GitHub 下载 archive
        download_url: `${repoUrl}/archive/refs/heads/main.zip`,
        // 或者使用 GitHub API 获取最新 release
        releases_url: `${repoUrl.replace('github.com', 'api.github.com/repos')}/releases/latest`
    });
}

// 生成索引
const index = {
    version: 1,
    generated_at: new Date().toISOString(),
    count: extensions.length,
    extensions: extensions
};

fs.writeFileSync('index.json', JSON.stringify(index, null, 2));

console.log(`Generated index.json with ${extensions.length} extensions`);
