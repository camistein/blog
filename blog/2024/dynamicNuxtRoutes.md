---
title: Dynamic routes with Nuxt
description: Some of my blog routes are imported from another github repo.
image: https://i.ibb.co/hMJ4yzG/og-cute-code-nuxt.png
author: Camilla Nyberg
categories: Nuxt, Vue, TypeScript, Oktokit
---

![Hero - cute coder girl with Nuxt and Vue logo](https://i.ibb.co/w4BzQWN/cute-code-nuxt.png)

# Dynamic Vue routes with Nuxt & Github

You can extend Nuxt routing and discovering of pages with your own custom implementation and even get pages from another Github repo completely

> [!NOTE]  
> If you only was basic discovering and rendering of markdown files for a blog I recommend using [Nuxt Content](https://content.nuxt.com/).

## First of let's install dependencies

- oktokit
  - npm `npm install oktokit`
  - yarn `yarn add oktokit`
- markdown-it (Optional: if you don't have another markdown render for vue)

## 1. Setup a content github repo

Create a public or private repository with the same structure as you want your routing to be.
Mine has this structure: blog / 2024 / dynamicNuxtRoutes.md [See it here](https://github.com/camistein/blog/tree/main/blog/2024)

Also setup a personal access token so we can include this when we get our files.

## 2. Get the markdown files from Github

Now go back to your Nuxt site repository.

We need to create a folder called **modules** (if you don't already have it ofc),
and in that folder you can create the folder **blog-routes** and add a new file called **index.ts**

_/modules/blog-routes/index.ts_

Add the following to your **index.ts**

```js
import { defineNuxtModule, extendPages } from "@nuxt/kit";
import type { ModuleOptions } from "nuxt/schema";

export default defineNuxtModule <
  ModuleOptions >
  {
    setup(options, nuxt) {
      extendPages(async (pages) => {
        // This is where we'll put the rest of the code
      });
    },
  };
```

### Get the files from github

Now let's start getting our files from and creating routes!

Add Octokit to your imports

```js
import { Octokit } from "octokit";
```

We need to do this in 2 steps if we want this to get the latest files in our repository.

First of we need to get the latest **sha** key for our **main** branch in the repo we just created.

Create a new instance of Octokit inside your extendPages and include your personal access token to make api calls to private and public github repos.

```js
import { defineNuxtModule, extendPages } from "@nuxt/kit";
import type { ModuleOptions } from "nuxt/schema";
import { Octokit } from "octokit";

export default defineNuxtModule <
  ModuleOptions >
  {
    setup(options, nuxt) {
      extendPages(async (pages) => {
        const octokit = new Octokit({
          auth: "_add_your_personal_access_token",
        });
      });
    },
  };
```

Now continue with adding a call to get the latest sha value for your main branch. Replace all the github name and repo name parameters, mine are for example camistein and blog for owner and repo. This will get the latest sha so we can get the latest tree structure for our repository.

> [!NOTE]  
> Instead of discovering local markdown files you could add a fetch files from a private

```js
const branchResult = await octokit.request(
  "GET /repos/{owner}/{repo}/branches/{branch}",
  {
    owner: "_replace_your_github_name_",
    repo: "_replace_your_github_repo_",
    branch: "main",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
);
```

Now moving on we're actually going to get the tree structure of our repository. To do that we'll make a call to _git/tree_ path together with your sha value.
This will give us the tree structur of our repository both including folders and files.

```js
if (branchResult && branchResult?.data?.commit?.sha) {
  const treeResult = await octokit.request(
    `GET /repos/{owner}/{repo}/git/trees/${branchResult.data.commit.sha}?recursive=3`,
    {
      owner: "_replace_your_github_name_",
      repo: "_replace_your_github_repo_",
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
}
```

After receiving the tree result we'll loop through all the values and only take blob files of type markdown (.md). Ive only done a simple check here, checking the **indexOf('.md')**
since I know that my repository only contains folders and .md files but you can change that to properly check for each file extension.

```js
if (treeResult) {
  if (treeResult.data.tree) {
    for (const dataContent of treeResult.data.tree) {
      if (
        dataContent.type === "blob" &&
        dataContent.path &&
        dataContent.sha &&
        dataContent.path.indexOf(".md") > -1
      ) {
        // lets do stuff with our files
      }
    }
  }
}
```

Foreach file I'll get the path structure for example _/blog/2024_ as my rootPath in my path and then I'll convert the filename itself from camel case to a dashed slug.
For example:
Your name is dynamicNuxtRoutes.md
then your slug will be dynamic-nuxt-routes

I choose to do this so I didnt have to write filenames like exactly like the slug but instead use camel casing. You can of course do as you like.

```js
const rootPath = dataContent.path.substring(
  0,
  dataContent.path.lastIndexOf("/")
);
const file = dataContent.path.substring(dataContent.path.lastIndexOf("/") + 1);
const name = file.replace(/^.*[\\/]/, "").replace(".md", "");
const slug = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

pages.push({
  path: `/${rootPath}/${slug}`,
  name: `${name}`,
  file: "@/pages/_blog/index.vue",
  meta: {
    path: dataContent.path,
    sha: dataContent.sha,
  },
});
```

We also add the file path to the meta data sent to our view so our view will now which markdown file to retrieve.

```js
meta: {
  path: dataContent.path,
  sha: dataContent.sha,
}
```

Last but definitely important! Add your new route module to your nuxt.config and you should see your routes generated when you run npm run dev or similar dev site command.

```js
  modules: [
    './src/modules/blog-routes',
  ],
```

## 3. Setup and api path to retrieve github file as content

We have a module that generates our routes, great! but we also need to get the content of your files to actually render them.

Remember we added the actual path to the meta data of our route, we are going to use that.

But we don't want to expose our personal access token so we're going to setup an api route.

In your server folder or create a folder called _server_ in your root directory, create 2 folders, first one called **api** and then one called **github**

so it should look like this: _/server/api/github/_

In that folder create a file called content.ts (or .js if you use javascript).

In that file we are going to use Octokit and defineEventHandler, getQuery from h3.

The getQuery will recieve the path to the github file for each page.

```js
import { Octokit } from "octokit";
import type { OctokitResponse } from "@octokit/types";
import { defineEventHandler, getQuery } from "h3";

export default defineEventHandler(async (event) => {
  const { path } = getQuery(event);
  return {
    content: "",
  };
});
```

Now we can use Octokit to call the _contents_ endpoint instead and this will give us the actual content on the file but **base64** endcoded.
We wont decode it quite yet since the encoding will make the response smaller.

```js
const octokit = new Octokit({
  auth: "_add_your_personal_access_token",
});

const result: OctokitResponse<any> = await octokit.request(
  "GET /repos/{owner}/{repo}/contents/{path}",
  {
    owner: "_replace_your_github_name_",
    repo: "_replace_your_github_repo_",
    path: path?.toString() ?? "",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
);

if (result?.data?.content) {
  return {
    content: result.data.content,
  };
}
```

## Lets configure our View!

Now we need to implement our view to actually call our api to get the md file and render our markdown

We'll start by adding the view that our route referenced: **@/pages/\_blog/index.vue**

I separated this into several components since I don't want one massive file.

### index.vue

```js
<script setup lang="ts">
import GithubContent from '@/components/blog/GithubContent.vue'
</script>

<template>
      <GithubContent></GithubContent>
</template>

```

### GithubContent.vue

Now we can import our markdown content from the file.
Our markdown file path was added to route metadata earlier in our route setup so we can use that here together with the api endpoint we setup to
get the file from github.

We'll add an useFetch call to retrieve our markdown file from our api: **const { data } = await useFetch('/api/github/content?path=' + route.meta.path)**

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

const transformData = (data?: string) => {
  if (data && data['content']) {
    let markdownFileContent = atob(data['content'])
    return markdownFileContent
  }

  return data
}

const loadMarkdown = async () => {
  try {
    const { data, pending, error, refresh } = await useFetch(
      '/api/github/content?path=' + route.meta.path,
      {
        method: 'GET',
        onResponse(context) {
          markdownSource.value = transformData(context.response._data) ?? ''
        }
      }
    )
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

And that is how I imported blog markdown files from another github repo and added them dynamically to my Nuxt website.
