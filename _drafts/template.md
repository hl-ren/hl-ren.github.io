---
title: "文章标题"
date: 2026-06-12
category: "随手记"
tags: ["标签一", "标签二"]
series: ""
summary: "一句话摘要，列表页会显示。"
comments: true
math: true
---

这里开始写正文。

## 一个小标题

继续写。页面会自动把 `##` 和 `###` 生成文章目录，不需要手动维护。

### 一个三级标题

继续写。

## 数学公式

行内公式建议写成 `\( a^2 + b^2 = c^2 \)`。

块级公式可以写成：

```text
$$
E = mc^2
$$
```

如果正文里要写美元符号，建议写成 `\$2000`，避免和公式语法混淆。

## 图片

把图片放到 `assets/images/posts/`，然后这样引用：

```markdown
![图片说明](/assets/images/posts/example.png)
```

也可以用 HTML 写图注：

```html
<figure>
  <img src="/assets/images/posts/example.png" alt="图片说明">
  <figcaption>图片说明</figcaption>
</figure>
```
