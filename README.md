# GitHubPortfolioSite

一个面向 GitHub Pages 的作品集网站模板：首页是深色截图网格，作品详情是一张可悬浮把玩的 3D 明信片，背面使用 Markdown 展示项目说明。

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run typecheck
npm run build
npm run test
npm run test:e2e
```

## 内容结构

- `public/content/projects.json` 保存作品列表和元数据。
- `public/content/projects/<slug>/` 保存封面、主图和 Markdown 插图。
- 图片路径在 JSON 和 Markdown 中使用 `./content/...`，便于 GitHub Pages 静态部署。

## 管理员上传架构

公开站点部署到 GitHub Pages；管理员登录和写仓库由 Cloudflare Worker 处理。

前端环境变量：

```bash
VITE_ADMIN_API_BASE=https://your-worker.your-subdomain.workers.dev
```

Worker 变量和密钥：

```bash
SITE_ORIGIN=https://cloud-oc.github.io/GitHubPortfolioSite
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_WRITER_TOKEN=...
ADMIN_GITHUB_LOGINS=cloud-oc
SESSION_SECRET=...
REPO_OWNER=cloud-oc
REPO_NAME=GitHubPortfolioSite
REPO_BRANCH=main
```

`GITHUB_WRITER_TOKEN` 建议使用 fine-grained PAT，并只给目标仓库 `Contents: write` 权限。GitHub OAuth App 的 callback URL 设置为：

```text
https://your-worker.your-subdomain.workers.dev/auth/github/callback
```

## 部署

GitHub Pages 部署静态站：

```bash
npm run build
```

Cloudflare Worker 部署 API：

```bash
npm run worker:deploy
```
