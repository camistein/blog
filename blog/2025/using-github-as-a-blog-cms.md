---
title: Using GitHub as a blog CMS in Next.js
description: How I fetch markdown files from a separate GitHub repo as blog posts, with parallel fetching and built-in Next.js caching.
author: Camilla Nyberg
createdAt: 2025-12-10
category: Next.js
draft: false
image: https://i.ibb.co/YB5pB5Kw/github-cms.png
---

Writing blog posts in a CMS felt overkill for what I actually needed — a place to dump notes and the occasional writeup. So instead, I keep my posts as markdown files in a separate GitHub repo and fetch them at runtime. No database, no CMS subscription, no redeploy needed when I publish something new.

## The structure

Posts live under `blog/{year}/{slug}.md` in my [blog repo](https://github.com/camistein/blog). The portfolio fetches from the GitHub Contents API at request time, parses frontmatter, and renders via `react-markdown`.

## Fetching in parallel

The naive approach is sequential — fetch the year directories one by one, then each file one by one. For any reasonable number of posts that's a waterfall of HTTP requests.

The fix is `Promise.all` at every level:

```ts
// Fetch all year listings in parallel
const yearFiles = await Promise.all(
  years
    .filter((entry) => entry.type === "dir")
    .map(async (yearEntry) => {
      const files = await fetchJson(`.../${yearEntry.name}`);
      return { year: yearEntry.name, files };
    }),
);

// Then fetch all markdown files across all years in parallel
const posts = await Promise.all(
  yearFiles.flatMap(({ year, files }) =>
    files.filter(isMarkdown).map((file) => fetchPost(file, year)),
  ),
);
```

Instead of N×M sequential fetches, you get two parallel batches.

## Skipping the double round-trip

When fetching a single post by slug, the GitHub API response already includes the file content — base64 encoded. No need for a second fetch to the raw download URL:

```ts
if (file.content && file.encoding === "base64") {
  const md = Buffer.from(file.content.replace(/\n/g, ""), "base64").toString(
    "utf-8",
  );
  return buildPost(file, year, md);
}
```

## Caching

Since this runs inside Next.js App Router server components, adding `next: { revalidate: 3600 }` to each `fetch` call is all you need. Next.js caches the responses in its Data Cache for an hour — new posts show up within 60 minutes of publishing, no redeploy required.

```ts
const res = await fetch(url, {
  headers: { Authorization: `Bearer ${process.env.GH_AUTH}` },
  next: { revalidate: 3600 },
});
```

That's really it. GitHub becomes the CMS, markdown stays portable, and the portfolio stays fast.
