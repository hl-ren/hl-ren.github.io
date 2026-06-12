---
layout: slides
title: "Online Slides System"
date: 2026-06-12
category: "Site"
tags: ["Slides", "Reveal.js", "GitHub Pages"]
summary: "A small browser-based deck demonstrating the site slides workflow."
logo: "/slides/2026-06-12-slides-system-demo/images/rho-logo.svg"
logo_alt: "Ren rho mark"
---

# Online Slides System

Huilong Ren

Ren's Homepage

2026-06-12

Browser-first decks for posts, tools, research notes, and teaching.

---

# Framing

- Framing
- Authoring
- Delivery

---

## Why browser slides

- One URL is enough for sharing
- Assets live beside the deck
- Posts, tools, and slides stay in one site

---

## Deck structure

```text
slides/YYYY-MM-DD-slug/
  index.md
  images/
  videos/
  data/
```

---

# Authoring

- Framing
- Authoring
- Delivery

---

## Markdown sections

### Page roles

- First `#` creates the cover
- Later `#` creates section pages
- `##` creates content pages

### Local structure

- Each section can hold many pages
- This demo uses two pages per section
- Footer shows the section title

---

## Markdown columns

### Left column

- Write `###` headings
- Add bullets below each heading
- The deck builds columns automatically

### Right column

- Bullet items reveal one by one
- HTML columns still work
- Use `.no-fragments` to disable animation

---

# Delivery

- Framing
- Authoring
- Delivery

---

## Color templates

Use the theme buttons in the settings menu.

<div class="theme-swatch-row">
  <div class="theme-swatch paper"><span></span>Paper</div>
  <div class="theme-swatch sage"><span></span>Sage</div>
  <div class="theme-swatch midnight"><span></span>Midnight</div>
  <div class="theme-swatch amber"><span></span>Amber</div>
</div>

---

## Local assets

### Local assets

![Slides system diagram](images/slides-system.svg)

- Keep figures near the deck
- Use relative image paths
- Copy the folder as one unit

---

## Conclusion

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
