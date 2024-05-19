---
title:Dynamic markdown routes with Nuxt
description:All my blog routes are dynamically imported markdown files and created together with Nuxt and fdir. No CMS needed, just a folder with .md files in my repo.
image:/imgs/og-cute-code-nuxt.png
author:Camilla Nyberg
category:Nuxt, Vue, TypeScript,Oktokit
---

::HeroImage
![Hero - cute coder girl with Nuxt and Vue logo](/imgs/cute-code-nuxt.png)
::

# Dynamic routes with Vue, Nuxt & Markdown files

::taglist{tags=['Nuxt','Vue','TypeScript', 'Oktokit']}
::

You can extend Nuxt routing and discovering of pages with your own custom implementation.

::alert{type="information"}
If you only was basic discovering and rendering of markdown files for a blog I recommend using [Nuxt Content](https://content.nuxt.com/). But I've used discovering of markdown files in this example just to show a simple implementation.
::

## First of let's install dependencies

- fdir
  - npm `npm install fdir`
  - yarn `yarn add fdir`
- picomatch
  - npm `npm install picomatch`
  - yarn `yarn add picomatch`
- markdown-it (Optional: if you don't have another markdown render for vue)

## 1. Dynamically import your .md files as routes

First start of with creating a folder where you want to put your files.

I went with just naming my folder "blog" and a markdown file to your folder. I've added this file named
**dynamicNuxtRoutes.md**

_/blog/dynamicNuxtRoutes.md_

Then we need to create a folder called **modules** (if you don't already have it ofc), and in that folder you can create the folder **blog-routes** and add a **index.ts**

_/modules/blog-routes/index.ts_

Add the following to your **index.ts**

```js
import { defineNuxtModule, extendPages } from "@nuxt/kit";
import type { ModuleOptions, NuxtPage } from "nuxt/schema";

export default defineNuxtModule <
  ModuleOptions >
  {
    setup(options, nuxt) {
      extendPages((pages) => {
        // This is where we'll put the rest of the code
      });
    },
  };
```

### Find the files

Now let's start finding all our files.

Add fdir and path to your imports

```js
import { fdir } from "fdir";
import * as path from "path";
```

Create a new instance of fdir and add your settings so we can search for our files and we only want \*.md files here.

```js
const crawler = new fdir()
  .withDirs()
  .normalize()
  .withFullPaths()
  .glob("./**/*.md")
  .crawl(path.resolve(__dirname, "../../blog/"));
const files = crawler.sync();
```

Now we need to loop through our routes and create our routes. I've got a Nuxt page below pages/\_blog/. Note the underscore since I don't want Nuxt to handle this as a regular page.

::alert{type="info"}
Instead of discovering local markdown files you could add a fetch files from a private
::

```js
const blogRoutes: NuxtPage[] = [];

for (const file of files) {
  const name = file.replace(/^.*[\\/]/, "").replace(".md", "");
  const dashedName = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

  blogRoutes.push({
    path: `/blog/${dashedName}`,
    name: `${name}`,
    file: "@/pages/_blog/index.vue",
    meta: {
      path: name,
    },
  });
}
```

Note this line in the code with take the filename and create a slug out of it.
For example:
Your name is dynamicNuxtRoute.md
then your path will be dynamic-nuxt-route

```js
const dashedName = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
```

We also add the file name to the meta data sent to our view so our view will now which markdown file to retrieve.

```js
meta: {
  path: name;
}
```

The last thing todo in this file is to add our new routes to the rest of our routes.

```js
pages.push(...blogRoutes);
```

## Lets configure our View!

Now we need to implement our view to actually import the md file and render our markdown

We'll start by adding the view that our route referenced: **@/pages/\_blog/index.vue**

I separated this into several components since I don't want one massive file.

### index.vue

```js
<script setup lang="ts">
import BlogContent from '@/components/blog/BlogContent.vue'
</script>

<template>
      <BlogContent></BlogContent>
</template>

```

### BlogContent.vue

Now we can import our markdown content from the file.
Our markdown file name was added to route metadata earlier in our route setup so we can use that here.

We'll add an async await function to retrieve our markdown file **(await import(`@/blog/${route.meta.path}.md?raw`)).default**

Make sure to add **?raw** to your path so you'll retrieve the raw content of your file.

You can now send your markdown string content into any vue component that can render markdown.
I've created a Markdown.vue component that uses [markdown-it](https://github.com/markdown-it/markdown-it) to render my markdown content. You can then optionally add markdown-it plugins and css for custom rendering.

```js
<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import Markdown from './Markdown.vue'
import '@/assets/css/blog.css'

const route = useRoute()
const markdownSource = ref<string>('')

const loadMarkdown = async () => {
  try {
    let markdownFileContent = (await import(`@/blog/${route.meta.path}.md?raw`)).default
    markdownSource.value = markdownFileContent
  }
  catch(err:any) {
    console.error(err)
  }
}

loadMarkdown()
</script>

<template>
  <div class="w-full h-full pt-24 bg-blue-dark flex items-center justify-center">
    <div class="col-span-full w-full max-w-xxl-blog px-6 py-12">
      <div class="text-blue-lightest">
        <Markdown :data="markdownSource"></Markdown>
      </div>
    </div>
  </div>
</template>


```
