# 我的短文章

这是一个面向 GitHub Pages 的 Jekyll 主站模板，适合同时放博客文章、小工具、在线幻灯片、项目入口和长期记录。

## 写新文章：只新增一个 Markdown 文件

在 `_posts/` 下新建 Markdown 文件：

```text
YYYY-MM-DD-slug.md
```

文件开头使用这样的 front matter：

```yaml
---
title: "文章标题"
date: 2026-06-12
category: "产品感想"
tags: ["AI", "效率工具"]
series: "AI 产品观察"
summary: "一句话摘要，会显示在列表页。"
comments: true
math: true
---
```

正文直接写 Markdown。通常只需要新增这一篇 `.md` 文件，不需要修改首页、分类页、标签页、归档页或搜索页。

自动完成的事情：

- 首页最近文章自动更新
- `/posts/` 自动出现新文章
- `/categories/` 按 `category` 自动归类
- `/tags/` 按 `tags` 自动归类
- `/archive/` 按日期自动归档
- `/series/` 按 `series` 自动归档
- `search.json` 自动收录标题、摘要、分类和标签
- RSS feed 自动更新
- 文章里的 `##` / `###` 自动生成目录和锚点

## Markdown、LaTeX 和图片

Markdown 原生支持标题、列表、代码块、表格、链接和图片。

LaTeX 已启用 MathJax：

```markdown
行内公式：\( a^2 + b^2 = c^2 \)

块级公式：

$$
E = mc^2
$$
```

为了避免和金额混淆，行内公式建议用 `\(...\)`，美元金额建议写成 `\$2000`。

图片放在 `assets/images/posts/`：

```markdown
![图片说明](/assets/images/posts/example.png)
```

需要图注时可以写：

```html
<figure>
  <img src="/assets/images/posts/example.png" alt="图片说明">
  <figcaption>图片说明</figcaption>
</figure>
```

## 常用栏目

- 生活吐槽
- 产品感想
- 技术反思
- 阅读笔记
- 随手记

## 小工具

小工具列表放在 `_data/tools.yml`。新增工具时添加一条数据即可，`/tools/` 页面和首页侧栏会自动更新。工具和文章是平行的一级内容：文章在 `/posts/`，工具在 `/tools/`。

## 在线幻灯片

幻灯片放在 `slides/` 下，每个 deck 一个文件夹：

```text
slides/YYYY-MM-DD-slug/
  index.md
  images/
  videos/
  data/
```

`index.md` 使用 `layout: slides`，正文里用单独一行 `---` 分隔每一页幻灯片：

```yaml
---
layout: slides
title: "Online Slides System"
date: 2026-06-12
category: "Research"
tags: ["Slides", "Reveal.js"]
summary: "一句话摘要，会显示在 /slides/ 列表页。"
---
```

自动完成的事情：

- `/slides/` 自动列出所有幻灯片
- 首页幻灯片区块自动更新
- 顶部导航和快速入口自动包含幻灯片入口
- 幻灯片页面支持键盘翻页、全屏演示、代码高亮、图片和 LaTeX
- deck 内图片可以直接写相对路径，例如 `![图](images/example.png)`

## 评论和点击量

模板已经预留评论和统计配置：

- 评论：giscus，基于 GitHub Discussions，需要 GitHub 登录，抗灌水能力比匿名评论强。仓库 Discussions 已开启，配置已填好；如果页面不显示评论，需要安装 giscus GitHub App。
- 点击量/访问统计：GoatCounter，记录页面访问和外链点击。

详细配置见 `docs/integrations.md`。

## 本地预览

如果本机有 Ruby 3：

```bash
bundle install
bundle exec jekyll serve
```

然后打开 `http://127.0.0.1:4000`。

## 推送到 GitHub Pages

创建 GitHub 仓库后：

```bash
git remote add origin git@github.com:你的用户名/仓库名.git
git push -u origin main
```

在 GitHub 仓库 Settings -> Pages 里选择从 `main` 分支部署即可。

如果使用仓库内置的 GitHub Actions 工作流，在 Settings -> Pages 里把 Source 选择为 `GitHub Actions`。
