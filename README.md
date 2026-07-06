# 宝宝老婆博士求职助手

一个手机优先的博士求职网页 App。

核心功能：

- 每天自动抓取博士相关岗位
- 优先中国高校，其次中国公司和韩国机会
- 每条岗位保留条件、待遇、材料、联系方式和原文摘要
- 展示学校/单位正在招聘的专业方向和需求学科
- 提供可填写并保存的简历库页面：基本信息、博士学校、研究方向、论文、项目、技能、目标岗位
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

简历库内容保存在当前手机浏览器的本地存储里，不会上传到 GitHub。

## 手机使用方式

部署到 Vercel 后，手机每天只需要打开同一个 Vercel 链接。

不用进入 GitHub，也不用手动刷新数据。GitHub Actions 会每天韩国时间早上 8 点自动运行抓取器，并把新岗位数据提交到仓库；Vercel 会跟随仓库更新重新部署。
