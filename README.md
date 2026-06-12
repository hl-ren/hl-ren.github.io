# 我的短文章

这是一个面向 GitHub Pages 的 Jekyll 主站模板，适合同时放博客文章、小工具、在线幻灯片、项目入口和长期记录。

## 本地预览

本机已安装 Homebrew Ruby 3.1 和本项目的 Jekyll 依赖。以后在仓库目录运行：

```bash
/opt/homebrew/opt/ruby@3.1/bin/bundle install
/opt/homebrew/opt/ruby@3.1/bin/bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

然后打开 `http://127.0.0.1:4000/`。

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
logo: "/slides/YYYY-MM-DD-slug/images/logo.svg"
logo_alt: "Logo description"
---
```

标题等级会自动决定页面版式：

```markdown
# 封面标题

作者

作者单位 / 课程 / 日期

---

# 大纲或章节页

- 第一部分
- 第二部分
- 第三部分

---

## 普通内容页

正文、图片、公式、代码或分栏。

### 左栏标题

- 左栏要点一
- 左栏要点二

### 右栏标题

- 右栏要点一
- 右栏要点二

---

## 结束页

最后一页会自动使用结束页版式。
```

约定：

- 第一个 `#` 是封面页
- 封面页中，`#` 是大标题，第一段是作者，后续段落是作者信息，`logo` 会显示在右侧
- 后续 `#` 是章节页或大纲页
- 章节页顶部标题会显示 `Outline`，列表里和当前章节同名的 item 会自动高亮加粗
- `##` 是普通内容页
- 普通页里两个或以上的 `###` 会自动变成分栏
- 每个 `#` section 后面的 `##` 普通页，底部中间只显示当前 section 标题
- 最后一页自动作为结束页
- `logo` 可选；填写后会显示在每页标题栏右侧
- `slide_theme`、`slide_topbar_color`、`slide_content_color`、`slide_footer_color` 可选；也可以演示时在 Settings 里临时切换
- 普通页和结束页的 bullet item 会自动逐条播放；section/outline 页的 bullet 会直接显示
- 内容字号会按可用宽高自动缩放，最大不超过页面标题字号；某页不想自动缩放时，加 `.no-fit` 或 `data-no-fit`
- 某个区域不想 bullet 动画时，加 `.no-fragments` 或 `data-no-fragments`

自动完成的事情：

- `/slides/` 自动列出所有幻灯片
- 首页幻灯片区块自动更新
- 顶部导航和快速入口自动包含幻灯片入口
- 幻灯片页面支持键盘翻页、全屏演示、代码高亮、图片和 LaTeX
- deck 内图片可以直接写相对路径，例如 `![图](images/example.png)`
- 图片尺寸可以用 Kramdown 属性控制，例如 `![图](images/example.png){: .slide-img-md }` 或 `![图](images/example.png){: width="60%" }`

Slides front matter 可选项示例：

```yaml
slide_theme: "paper"
slide_topbar_color: "sage"
slide_content_color: "sage"
slide_footer_color: "sage"
```

颜色值可用 `default`、`white`、`sage`、`blue`、`amber`，顶部和底部还支持 `charcoal`。图片尺寸类可用 `.slide-img-xs`、`.slide-img-sm`、`.slide-img-md`、`.slide-img-lg`、`.slide-img-full`、`.slide-img-tall`，需要去掉圆角时加 `.slide-img-plain`。

Slides 里可以用内置版式辅助类做分栏和公式块：

```html
<div class="slide-columns" markdown="1">
  <div markdown="1">
    左栏内容
  </div>
  <div class="slide-card-panel" markdown="1">
    右栏图片、表格或说明
  </div>
</div>

<div class="equation-box" markdown="1">

$$
E = mc^2
$$

</div>
```

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
