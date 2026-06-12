# Slides Feature Requirements

## Goal

Add a first-class online slides system to the site.

The site should eventually have three parallel content areas:

```text
/posts/    Long-form posts
/tools/    Online tools
/slides/   Online slides, talks, lectures, and research decks
```

Slides are for public research talks, paper explanations, course materials, tool introductions, and lightweight presentations that can be opened directly in a browser.

## Motivation

Online slides make it possible to:

- Share research or teaching material with a single URL.
- Present in class without carrying a PPT file.
- Open the deck directly from GitHub Pages.
- Let students or collaborators revisit the same link later.
- Use a more visual and lighter format than long-form articles.
- Promote research, tools, and ideas more easily than downloadable PPT/PDF files.

## Recommended Technology

Use Reveal.js.

Reasons:

- Mature browser-based slides framework.
- Supports full-screen presentation.
- Supports keyboard navigation.
- Supports Markdown-style authoring.
- Supports LaTeX math.
- Supports images, videos, code blocks, and tables.
- Can later support PDF export.

## User Experience

Example URL:

```text
https://hl-ren.github.io/slides/nonlocal-mechanics/
```

Expected behavior:

- Open the URL and see a slide deck.
- Use arrow keys or space to move between slides.
- Use `F` or browser full-screen mode to present.
- Use `Esc` for overview mode if supported by Reveal.js.
- Share the same URL with students, collaborators, or readers.

## Content Structure

Each slides deck should live in its own folder.

Recommended structure:

```text
_slides/
  2026-06-12-nonlocal-mechanics/
    index.md
    images/
      horizon.png
      fracture-demo.png
    videos/
      demo.mp4
    data/
      result.csv

  2026-06-20-mesh-refinement/
    index.md
    images/
      mesh-01.png
      mesh-02.png
```

One folder equals one online PPT/deck.

```text
_slides/YYYY-MM-DD-slug/
```

The main Markdown file is always:

```text
index.md
```

`index.md` is the body of the slides deck. It contains the actual slide pages.

Suggested meaning of each folder:

```text
index.md   Main slide content
images/    Images used only by this deck
videos/    Videos used only by this deck
data/      Data files or attachments used only by this deck
```

## Why Per-Deck Asset Folders

Slides often contain many figures, screenshots, diagrams, animations, and videos. These should not all be mixed into one global image folder.

Keeping assets next to the deck has several benefits:

- A deck and its assets can be copied together.
- Deleting a deck deletes all related assets.
- Different decks do not pollute each other's image namespace.
- Image filenames can stay simple.
- Research figures, paper screenshots, and demo videos remain organized.
- It is easier to migrate a deck from another project.

## Example Deck

Folder:

```text
_slides/2026-06-12-nonlocal-mechanics/
  index.md
  images/
    horizon.png
    fracture-demo.png
```

`index.md`:

```md
---
layout: slides
title: "A Short Introduction to Nonlocal Mechanics"
date: 2026-06-12
category: "Research"
tags: ["Mechanics", "Peridynamics", "FEM"]
summary: "A browser-based talk deck for sharing the main ideas."
---

# A Short Introduction to Nonlocal Mechanics

Huilong Ren

---

## Motivation

- Classical continuum models rely on local derivatives
- Discontinuities are difficult to represent
- Nonlocal models provide another route

---

## Core equation

$$
\rho \ddot{u}(x,t) = \int_{H_x} f(u(x') - u(x), x' - x)\,dx'
$$

---

## Horizon

![Horizon illustration](images/horizon.png)

---

## Fracture demo

![Fracture demo](images/fracture-demo.png)

---

## Takeaway

Nonlocal formulations make fracture and discontinuities easier to describe.
```

## Slide Splitting

Use this as the first-version page separator:

```md
---
```

Each section separated by `---` becomes one slide.

Later versions may support vertical slides with:

```md
--
```

but the first implementation can support horizontal slides only.

## Output URLs

The generated deck URL should be stable and shareable.

Possible output:

```text
/slides/2026-06-12-nonlocal-mechanics/
```

or:

```text
/slides/nonlocal-mechanics/
```

The implementation can decide the exact permalink rule, but each deck must have a clean standalone URL.

Assets should resolve relative to the deck URL:

```text
/slides/2026-06-12-nonlocal-mechanics/images/horizon.png
/slides/2026-06-12-nonlocal-mechanics/videos/demo.mp4
```

Inside `index.md`, authors should be able to use relative paths:

```md
![Horizon illustration](images/horizon.png)
```

## Required Features

The first version should support:

- `/slides/` as a first-level navigation item.
- A `/slides/` index page listing all decks.
- One folder per deck.
- `index.md` as the main slide content.
- Per-deck asset folders such as `images/`, `videos/`, and `data/`.
- Full-screen browser presentation.
- Keyboard navigation.
- Markdown headings, lists, emphasis, links, tables, and code blocks.
- LaTeX math.
- Images.
- Videos if Reveal.js supports them directly through HTML/Markdown.
- Mobile-readable fallback behavior.
- Chinese/English navigation labels.

## Navigation

Add Slides as a peer of Posts and Tools.

Chinese navigation:

```text
文章 / 工具 / 幻灯片 / 分类 / 标签 / 归档 / 系列 / 搜索 / 关于
```

English navigation:

```text
Posts / Tools / Slides / Categories / Tags / Archive / Series / Search / About
```

## Slides Index Page

Add:

```text
/slides/
```

The page should automatically list all slide decks.

Each deck card should show:

- Title
- Date
- Category
- Tags
- Summary
- Link to open the deck

## Automation Requirements

Adding a new deck should require only creating a new folder:

```text
_slides/2026-06-12-nonlocal-mechanics/
```

with:

```text
index.md
images/
videos/
data/
```

The author should not need to manually edit:

- Homepage
- `/slides/`
- Navigation
- Tags
- Categories
- Search

First version can focus on automatically updating `/slides/`.

Later versions can integrate slides into:

- Full-site search
- Tags
- Categories
- Related content

## LaTeX Requirements

Slides should support the same math syntax as posts:

```md
Inline math: \( a^2 + b^2 = c^2 \)

Block math:

$$
E = mc^2
$$
```

Use MathJax or Reveal.js math plugin.

## Visual Requirements

Slides pages should not use the normal article reading layout.

They should feel like presentation pages:

- Full-screen or near full-screen.
- Larger type than posts.
- Centered slide content.
- Sparse content per page.
- Clean background.
- Suitable for projection.

## Teaching Scenario

The system should support classroom use:

- Open a URL in class.
- Present full-screen.
- Navigate with keyboard.
- Share the same link after class.
- Students can review on laptops, tablets, or phones.
- Content updates without changing the link.

## Research Promotion Scenario

The system should support research sharing:

- Public paper reading notes.
- Research progress talks.
- Method introductions.
- Tool demos.
- Lightweight public presentations.
- Easy sharing with a single URL.

## Future Enhancements

Possible later additions:

- PDF export using Reveal.js print mode.
- Speaker notes.
- Fragment animations.
- Theme switching.
- Slide-level anchors.
- Search integration.
- Tags/categories integration.
- Related posts/tools links.
- Downloadable PDF or PPTX fallback.
