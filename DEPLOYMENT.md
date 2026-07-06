# 宝宝老婆博士求职助手部署说明

这个项目最终应该接到 GitHub 和 Vercel。

## 为什么需要 GitHub

- 保存网页 App、抓取器和配置。
- GitHub Actions 可以每天自动运行抓取器。
- 抓取结果会写入 `outputs/app/jobs-data.js`，并自动提交回仓库。

## 为什么需要 Vercel

- Vercel 负责把 `outputs/app` 发布成一个手机随时能访问的网址。
- 每次 GitHub Actions 提交新的岗位数据后，Vercel 会自动重新部署。
- 这样手机每天打开同一个链接，就能看到最新岗位。

## 推荐流程

1. 把当前文件夹推送到 GitHub 仓库。
2. 在 Vercel 导入这个 GitHub 仓库。
3. Vercel 会读取 `vercel.json`：
   - 构建命令：`node work/crawler/crawl-jobs.mjs`
   - 输出目录：`outputs/app`
4. GitHub Actions 每天韩国时间早上 8 点运行。

## 每日更新时间

`.github/workflows/daily-crawl.yml` 里设置的是：

```yaml
cron: "0 23 * * *"
```

这对应韩国时间每天早上 8 点。

手机端不需要进入 GitHub。只要 GitHub Actions 成功运行，岗位数据会自动写入 `outputs/app/jobs-data.js`，Vercel 会继续发布同一个网页地址。

## 推荐使用方式

- 女朋友每天打开 Vercel 固定链接。
- 首页看今日岗位和老公今日支持。
- 岗位详情里看招聘专业、条件、待遇、材料和原文摘要。
- 简历页查看该岗位适合准备哪类材料。
- 正式投递前打开原文链接核对。

## 接入 OpenAI

在 Vercel 项目里打开：

```text
Settings -> Environment Variables
```

添加：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-5.4-mini
```

保存后重新部署。网页里的“AI分析”按钮会调用 `/api/analyze-job`，不会把 Key 暴露到浏览器。

## 本地运行

```powershell
npm run crawl
npm run serve
```

然后打开：

```text
http://127.0.0.1:8787/
```
