---
layout: slides
title: "Online Slides System"
subtitle: "Browser-first decks for posts, tools, research notes, and teaching."
date: 2026-06-12
category: "Site"
tags: ["Slides", "Reveal.js", "GitHub Pages"]
summary: "A small browser-based deck demonstrating the site slides workflow."
logo: "/slides/2026-06-12-slides-system-demo/images/rho-logo.svg"
logo_alt: "Ren rho mark"
slide_theme: "paper"
slide_topbar_color: "sage"
slide_content_color: "sage"
slide_footer_color: "sage"
slide_bullets: "item"
---

# Online Slides System

Huilong Ren

Ren's Homepage

2026-06-12

---

# Framing

- Framing
- Authoring
- Delivery

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

## Math environments

<div class="equation-box" markdown="1">

$$
\begin{aligned}
\mathcal{L}(\theta,\lambda)
&= \frac{1}{N}\sum_{i=1}^{N}
  \left\lVert f_{\theta}(x_i)-y_i \right\rVert_2^2
  + \lambda \left\lVert \nabla f_{\theta} \right\rVert_2^2,\\
\frac{\partial \mathcal{L}}{\partial \theta}
&= \frac{2}{N}\sum_{i=1}^{N}
  \left(f_{\theta}(x_i)-y_i\right)
  \frac{\partial f_{\theta}(x_i)}{\partial \theta}.
\end{aligned}
$$

</div>

- Inline math: \( a^2 + b^2 = c^2 \)
- Display math: `$$ ... $$`
- MathJax supports `aligned`, `cases`, `matrix`, sums, integrals, and Greek letters

---

## Piecewise and matrix notation

### Piecewise model

$$
u(x,t)=
\begin{cases}
u_0(x), & t = 0,\\
u_0(x)+t v_0(x), & 0<t\le \Delta t,\\
\displaystyle \int_{\Omega} K(x,\xi)u(\xi,t)\,d\xi, & t>\Delta t.
\end{cases}
$$

### Matrix form

$$
\begin{bmatrix}
K_{11} & K_{12} & 0\\
K_{21} & K_{22} & K_{23}\\
0 & K_{32} & K_{33}
\end{bmatrix}
\begin{bmatrix}
u_1\\ u_2\\ u_3
\end{bmatrix}
=
\begin{bmatrix}
f_1\\ f_2\\ f_3
\end{bmatrix}
$$

---

## Theorem-style blocks

<div class="slide-env definition" markdown="1">
<span class="slide-env-title">Definition</span>

A slide environment is an HTML block with `markdown="1"` so Markdown and LaTeX still render inside it.
</div>

<div class="slide-env theorem" markdown="1">
<span class="slide-env-title">Theorem</span>

If the residual satisfies $\|r_k\|_2 \le \epsilon$, then the iteration is accepted.
</div>

<div class="slide-env proof compact" markdown="1">
<span class="slide-env-title">Proof sketch</span>

Use the triangle inequality:

$$
\|e_{k+1}\|_2 \le \|A^{-1}\|_2 \|r_k\|_2.
$$
</div>

---

## Markdown environments

### Tables

| Mode | Use case | Syntax |
|---|---:|---|
| `16:9` | Modern screens | `slide_aspect: "16:9"` |
| `4:3` | Classic classroom PPT | `slide_aspect: "4:3"` |

### Quotes

> Use block quotes for short claims, assumptions, or paper excerpts.

---

## More block environments

<div class="slide-env example" markdown="1">
<span class="slide-env-title">Example</span>

A compact example block can mix text, lists, and inline math such as $E=mc^2$.
</div>

<div class="slide-env note" markdown="1">
<span class="slide-env-title">Note</span>

Markdown supports code fences, block quotes, tables, lists, images, and raw HTML blocks.
</div>

<div class="slide-env remark" markdown="1">
<span class="slide-env-title">Remark</span>

Inside HTML slide blocks, prefer `$...$` and `$$...$$` for math.
</div>

---

## Code and callouts

### Markdown source

```md
<div class="slide-env theorem" markdown="1">
<span class="slide-env-title">Theorem</span>

For \( x \in \Omega \), define

$$
E(u)=\int_{\Omega} W(\nabla u)\,dx.
$$
</div>
```

### Callout

<div class="slide-env warning" markdown="1">
<span class="slide-env-title">Warning</span>

This is not a full LaTeX compiler. It is Markdown plus MathJax, so Beamer commands are not interpreted directly.
</div>

---

# Delivery

- Framing
- Authoring
- Delivery

---

## Local assets

### Local assets

![Slides system diagram](images/slides-system.svg){: .slide-img-md .slide-img-plain }

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
- Math still works: $a^2 + b^2 = c^2$

Slides now sit beside posts and tools as a first-class content area.
