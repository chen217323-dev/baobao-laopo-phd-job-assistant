# 宝宝老婆博士求职助手

一个手机优先的博士求职网页 App。

核心功能：

- 每天自动抓取博士相关岗位
- 优先中国高校，其次中国公司和韩国机会
- 每条岗位保留条件、待遇、材料、联系方式和原文摘要
- 手机端展示“老公今日支持”和今日流日小窗口
- 可部署到 Vercel，作为独立网页 App 使用

## 本地运行

```powershell
npm run crawl
npm run serve
```

打开：

```text
http://127.0.0.1:8787/
```

手机同 Wi-Fi 访问：

```text
http://电脑局域网IP:8787/
```

## 部署

推荐部署方式：

1. 上传到 GitHub。
2. 在 Vercel 导入 GitHub 仓库。
3. Vercel 自动读取 `vercel.json`，发布 `outputs/app`。
4. GitHub Actions 每天韩国时间早上 8 点运行抓取器并提交新数据。

详细说明见 [DEPLOYMENT.md](./DEPLOYMENT.md)。

## 数据说明

`outputs/app/jobs-data.js` 是网页读取的岗位数据。  
抓取器位于 `work/crawler/crawl-jobs.mjs`。

真实投递前仍建议打开原文链接核对截止日期、材料要求和联系方式。
