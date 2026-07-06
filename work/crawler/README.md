# 宝宝老婆博士求职助手：岗位抓取器

这个目录是第一版真实采集管线。

运行方式：

```powershell
C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe work\crawler\crawl-jobs.mjs
```

输出文件：

- `outputs/jobs.json`：结构化岗位数据
- `outputs/jobs-data.js`：手机页面直接读取的数据

第一版策略：

- 从 `sources.json` 里的公开招聘页抓取链接
- 抓每个详情页全文
- 尽量解析学校/公司、岗位、条件、待遇、材料、联系人、截止日期
- 解析不出的字段保留“公告未明确”，同时保存 `rawText`
- 手机页面优先展示 `jobs-data.js` 里的真实抓取数据

注意：

- 真实投递前仍要打开原文核对，因为招聘网站格式不统一。
- 后续可以给每个重点网站写专属解析器，提高字段准确率。
