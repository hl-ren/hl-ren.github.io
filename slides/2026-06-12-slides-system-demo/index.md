---
layout: slides
title: "Online Slides System"
date: 2026-06-12
category: "Site"
tags: ["Slides", "Reveal.js", "GitHub Pages"]
summary: "A small browser-based deck demonstrating the site slides workflow."
---

# Online Slides System

Huilong Ren

Browser-first decks for posts, tools, research notes, and teaching.

---

<div class="section-kicker">Section 1</div>

# From Notes to a Talk

Turn a Markdown folder into a shareable presentation URL.

---

## Authoring workflow

<div class="slide-columns" markdown="1">
  <div markdown="1">

```text
slides/YYYY-MM-DD-slug/
  index.md
  images/
  videos/
  data/
```

  </div>
  <div class="slide-card-panel" markdown="1">

![Slides system diagram](images/slides-system.svg)

  </div>
</div>

---

## Color templates

Use the theme buttons in the upper-right corner.

<div class="theme-swatch-row">
  <div class="theme-swatch paper"><span></span>Paper</div>
  <div class="theme-swatch sage"><span></span>Sage</div>
  <div class="theme-swatch midnight"><span></span>Midnight</div>
  <div class="theme-swatch amber"><span></span>Amber</div>
</div>

---

# Conclusion

<div class="equation-box" markdown="1">

$$
\text{Deck} = \text{Markdown} + \text{Assets} + \text{Browser}
$$

</div>

- One folder becomes one deck
- Assets stay next to the deck
- Keyboard presentation works in the browser
- Math still works: \( a^2 + b^2 = c^2 \)

Slides now sit beside posts and tools as a first-class content area.
