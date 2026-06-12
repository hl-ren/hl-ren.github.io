# 评论和点击量配置

评论配置已经写入 `_config.yml`，统计默认关闭。

## 评论：giscus

giscus 使用 GitHub Discussions 存评论，读者需要登录 GitHub 才能评论。它适合静态博客，因为不需要自己维护数据库，也能利用 GitHub 的登录、通知、编辑、删除和举报机制来减少灌水。

当前状态：

- GitHub Discussions 已开启。
- `_config.yml` 已配置 `hl-ren/hl-ren.github.io` 和 `General` 分类。
- 如果页面底部没有显示评论框，需要安装 giscus GitHub App，并授权这个仓库。

标准准备步骤：

1. GitHub 仓库设为 public。
2. 在仓库 Settings -> Features 里打开 Discussions。
3. 安装 giscus GitHub App：`https://github.com/apps/giscus`。
4. 打开 `https://giscus.app/zh-CN`，按页面提示选择仓库和 Discussion 分类。
5. 把页面生成脚本里的这些值复制到 `_config.yml`：
   - `data-repo`
   - `data-repo-id`
   - `data-category`
   - `data-category-id`

配置示例：

```yaml
comments:
  enabled: true
  provider: "giscus"
  giscus:
    repo: "你的用户名/仓库名"
    repo_id: "R_kgDOxxxxxx"
    category: "Announcements"
    category_id: "DIC_kwDOxxxxxx"
    mapping: "pathname"
    strict: "1"
    reactions_enabled: "1"
    emit_metadata: "0"
    input_position: "bottom"
    theme: "preferred_color_scheme"
    lang: "zh-CN"
    loading: "lazy"
```

单篇文章关闭评论：

```yaml
---
comments: false
---
```

防灌水建议：

- 评论仓库不要打开匿名写入，giscus 本身要求 GitHub 登录。
- Discussions 分类可以单独建一个 `Comments`，便于管理。
- 对明显灌水的账号使用 GitHub 的 block/report。
- 如果评论区开始变吵，把 `comments.enabled` 改回 `false` 即可全站关闭。

## 点击量和访问统计：GoatCounter

GoatCounter 是轻量统计服务，用来记录页面访问和外链点击。这个模板会自动记录页面访问；如果 `track_outbound_clicks` 为 true，也会记录外链点击事件。

准备步骤：

1. 注册 GoatCounter，得到一个站点 code。
2. 在 `_config.yml` 里打开统计。

配置示例：

```yaml
analytics:
  enabled: true
  provider: "goatcounter"
  goatcounter:
    code: "你的站点code"
    track_outbound_clicks: true
```

如果只想统计某个按钮点击，可以给链接加上 `data-track-click`：

```html
<a href="https://example.com" data-track-click="homepage-example">Example</a>
```

这个方案不会在页面上展示公开计数。如果以后想把每篇文章的浏览量显示出来，建议用 Cloudflare Worker 或自建 API 做限流和去重，再把只读接口接到页面上。
