---
title: Frontend Developer toolkit
description: A roundup of my favorite frontend tools — Storybook, Vitest, Playwright, React Aria, Tailwind Variants, and Zustand.
image: https://i.ibb.co/1YvznsWR/frontendtoolkit.png
author: Camilla Nyberg
category: blog
categories: tools
createdAt: 2026-06-06
---

# Useful Tools, Libraries & Frameworks for Modern Frontend Development

:::preamble
This guide covers some of my favorite tools in frontend development — the ones I keep reaching for across projects.
:::

---

## Storybook

[Storybook](https://storybook.js.org/)

Storybook is a tool for developing UI components in isolation. You don't have to create an entire page with all your components and modules just to visualise them — you can build and design right in the project, then demo to stackeholders or your team as soon as something is ready instead of waiting for it to land in the app.

### Key benefits

- Visualize all component states and variants without spinning up a full app
- Detect UI bugs early without having to troubleshoot an entire flow
- Test responsiveness across viewports without touching DevTools
- Build your component library while you design, not after

It also supports accessibility (WCAG), interaction, visual, and component tests via addons:

[Test addons](https://storybook.js.org/addons/tag/test)

---

## Testing

### Vitest

[Vitest](https://vitest.dev/)

Fast, easy-to-use testing framework for JavaScript and TypeScript projects. It's very similar to Jest, so if you're already familiar with Jest the transition is smooth — but Vitest is noticeably faster, especially in larger projects, thanks to being Vite-powered with native ESM and first-class TypeScript support out of the box.

| Feature      | Vitest                      | Jest                                 |
| ------------ | --------------------------- | ------------------------------------ |
| Performance  | ⚡ Very fast (Vite-powered) | 🐢 Generally slower                  |
| Startup time | Extremely fast              | Slower, especially in large projects |
| TypeScript   | ✅ First-class, built in    | ⚠️ Requires additional configuration |
| ESM support  | ✅ Native                   | ⚠️ Improved, but can be complex      |
| Mocking      | ✅ Built in (vi.mock)       | ✅ Built in (jest.mock)              |
| Browser mode | ✅ Via Browser Mode         | ⚠️ Primarily Node + jsdom            |
| Ecosystem    | Growing rapidly             | Very mature                          |

#### When to use Vitest

- Vite projects → best fit
- Vue → excellent
- Node.js → excellent
- React → excellent
- React Native → limited (Jest still dominates here)

---

### Playwright

[Playwright](https://playwright.dev/)

Great framework for writing E2E tests. I've used it across both JS and .NET projects, and the fact that it supports multiple languages means you don't have to learn a new tool every time you switch stacks. If you're coming from Cypress, the main upgrades are proper cross-browser support (including WebKit), multi-tab handling, and better parallel execution.

| Feature          | Playwright                                 | Cypress                                      |
| ---------------- | ------------------------------------------ | -------------------------------------------- |
| Browser support  | Chromium, Firefox, WebKit                  | Chromium-based, Firefox (limited), no WebKit |
| Multi-tab        | ✅ Supported                               | ❌ Limited                                   |
| Cross-browser    | ✅ Strong                                  | ⚠️ More limited                              |
| Parallel runs    | ✅ Built in                                | ✅ Available                                 |
| Mobile emulation | ✅ Built in                                | ⚠️ Basic                                     |
| Language support | TypeScript, JavaScript, Python, Java, .NET | JavaScript, TypeScript                       |
| Test runner UI   | Good                                       | Excellent                                    |
| Learning curve   | Moderate                                   | Easy to Moderate                             |

---

## Frontend Architecture

### React Aria

[React Aria](https://react-aria.adobe.com/getting-started)

React Aria provides headless hooks and components for building fully accessible UI — keyboard navigation, focus management, screen reader support, and ARIA attributes — while leaving all styling to you. No fighting with overrides to make it match your design system; just bring your own CSS or Tailwind classes.

Anyone who's built a custom dropdown that needs to feel native on mobile, support screen readers, and respect tab order knows the pain. React Aria solves that while keeping you in full control of the markup and styling.

**Use React Aria if you:**

- Are building a design system or reusable component library
- Need maximum flexibility in component structure
- Expect complex UI patterns (advanced dialogs, grids, etc.)
- Want fine-grained accessibility control based on ARIA standards

---

### React Aria vs Headless UI

[Headless UI](https://headlessui.com)

| Feature       | React Aria   | Headless UI  |
| ------------- | ------------ | ------------ |
| Level         | Low-level    | Higher-level |
| Flexibility   | ⭐ Very high | Medium       |
| Accessibility | ⭐ Advanced  | Good         |
| Components    | Broad set    | Smaller set  |
| Complexity    | Higher       | Lower        |

**Use Headless UI if you:**

- Want to build UI quickly without deep architecture decisions
- Only need common components (menus, dialogs, tabs, dropdowns)
- Prefer a simple, predictable component API
- Don't need a full component system

---

### Tailwind Variants

[Tailwind Variants](https://www.tailwind-variants.org/)

When working with React and Tailwind, I reach for Tailwind Variants to handle parameter-controlled styling. Instead of stacking if/else conditions or a long switch in the className, you define variants once and pass them as props:

```js
import { tv } from "tailwind-variants";

const dotStyle = tv({
  base: "h-1.5 w-1.5 rounded-full",
  variants: {
    color: {
      emerald: "bg-emerald-400",
      sky: "bg-sky-400",
      purple: "bg-purple-400",
    },
  },
});

<span className={dotStyle({ color })} />;
```

The other killer feature is shared styles via `extend`. Say you want a consistent focus ring across inputs and buttons — define it once:

```js
const focusRing = tv({
  base: ["focus:outline-2", "focus:outline-offset-2", "focus:outline-blue-500"],
});

const buttonStyle = tv({
  extend: focusRing,
  base: ["text-sm", "text-white", "rounded-lg", "shadow-lg"],
});
```

---

## State Management

### Zustand

[Zustand](https://zustand.docs.pmnd.rs/learn/getting-started/introduction)

Minimal global state management for React. If you've ever set up Redux and thought "this is a lot of boilerplate for what I actually need," Zustand is the answer — it gets out of your way and lets you focus on the actual app logic.

| Feature     | Zustand     | Redux Toolkit       |
| ----------- | ----------- | ------------------- |
| Complexity  | ⭐ Very low | ⚠️ Medium           |
| Boilerplate | Minimal     | Reduced             |
| Learning    | Easy        | Moderate            |
| Scalability | Medium–High | ⭐ Very high        |
| Performance | Excellent   | Excellent           |
| Structure   | Flexible    | Strict, predictable |
| DevTools    | Basic       | ⭐ Excellent        |
| Ecosystem   | Smaller     | Very large          |

Zustand is great for small-to-medium apps. If you're building something large with many teams and need strict, predictable state architecture, Redux Toolkit is worth the extra setup.

---

## Summary

| Tool              | What it is for             |
| ----------------- | -------------------------- |
| Storybook         | UI component development   |
| Vitest            | Unit & integration testing |
| Playwright        | E2E testing                |
| React Aria        | Accessibility primitives   |
| Tailwind Variants | Variant-based styling      |
| Zustand           | Lightweight state          |
