---
title: Camel case to dash routes with Nuxt Content
description: I will show you how you can tie into the built in hooks to turn your camel cased files into dashed slugs.
image: https://i.ibb.co/FYt2LRb/og-camel.png
author: Camilla Nyberg
category: blog
categories: Nuxt, Vue, TypeScript, Nuxt Content
---

![Camel](https://i.ibb.co/mC7P9pF/cute-camel.png)

# Camel case to dashed slug with Nuxt Content

::tag-list{:tags='["Nuxt","Vue","TypeScript","Nuxt Content"]'}
::

By default Nuxt content will generate url paths forced to lowercase but you have to write the dash your self but I will show you
how you can tie into the built in hooks to turn your camel cased files into dashed slugs.

**NOTE**
For this you need to implement [Nuxt Content](https://content.nuxt.com/)

## 1. First we need to create a Nitro plugin

To do this we first need to create a plugin that utilizes the hook **content:file:afterParse**

Create a folder called **plugins** in your server folder. If you don't have a server folder then you need to create one in the root of your project. In our plugins we will then create a **hooks** and a **lib** folder.

## 2 Create function to turn camel case into dashed slug

First in your lib folder create a file called something recognizeable and related to what it's suppose to be used for.

For now I will just name it **camelCaseToDash.ts**

In your folder create an interface with the following properties

- \_extension
- \_file
- \_id
- \_path

We will use this to identify properties on the content document.

```js
export interface IContentDocument extends Record<string, string> {
  _extension: string
  _file: string
  _id: string
  _path: string
}
```

Then we'll add a function to recognize if a string actually is camel case, since we don't want to change path's for files that are already dashed or in another format than camel case.

```js
const isCamelCase = (str: string) => {
  return /[A-Z]/.test(str);
};
```

Now we'll create a function that takes the id of the document, it will be the path structure + filename separated by colon's.

Example: 'blog:2024:nuxtContentCamelCase.md'

We want the last part of that information: **nuxtContentCamelCase**
so we'll add this:

```js
const slugName = document._id
  .substring(document._id.lastIndexOf(":") + 1)
  .replace(`.${document._extension}`, "");
```

This will first separate and only take the last part of 'blog:2024:nuxtContentCamelCase.md', so that will we **nuxtContentCamelCase.md** and then we can replace the file extension with the **.replace(`.${document._extension}`, '')**

after that we'll use our **isCamelCase** function on that name to make sure that our filename is camel case.

After that we can take our camel case name and turn it into dashed slug.

```js
const dashedName = slugName.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
```

This **nuxtContentCamelCase** will turn into **nuxt-content-camel-case**

Great!

But now we need to put that into our path while also taking into consideration the folder structure.

To do that we will just take our original path and just remove the value after the last slash.

```js
const rootPath = document._path.substring(0, document._path.lastIndexOf("/"));
```

And now we turn it into the actual function and set the document.\_path to our new dashed path.

```js
export const slugFromCamelCaseToDash = (document: IContentDocument) => {
  if (document._id) {
    const slugName = document._id
      .substring(document._id.lastIndexOf(":") + 1)
      .replace(`.${document._extension}`, "");
    if (isCamelCase(slugName)) {
      const rootPath = document._path.substring(
        0,
        document._path.lastIndexOf("/")
      );
      const dashedName = slugName.replace(
        /[A-Z]/g,
        (m) => "-" + m.toLowerCase()
      );
      document._path = `${rootPath}/${dashedName}`;
    }
  }
};

export default slugFromCamelCaseToDash;
```

Your file should now look like this:

```js
export interface IContentDocument extends Record<string, string> {
  _extension: string
  _file: string
  _id: string
  _path: string
}

const isCamelCase = (str: string) => {
  return /[A-Z]/.test(str)
}

export const slugFromCamelCaseToDash = (document: IContentDocument) => {
  if (document._id) {
    const slugName = document._id
      .substring(document._id.lastIndexOf(':') + 1)
      .replace(`.${document._extension}`, '')
    if (isCamelCase(slugName)) {
      const rootPath = document._path.substring(0, document._path.lastIndexOf('/'))
      const dashedName = slugName.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())
      document._path = `${rootPath}/${dashedName}`
    }
  }
}

export default slugFromCamelCaseToDash
```

## 3. Use your new camel case to dash function

In our hook folder you can now create a file called **content.ts** and import + use your new **slugFromCamelCaseToDash** function.

```js
import { defineNitroPlugin } from "nitropack/runtime";
import { slugFromCamelCaseToDash } from "../lib/camelCaseToDash";

export default defineNitroPlugin((nitroApp: any) => {
  nitroApp.hooks.hook("content:file:afterParse", async (file) => {
    slugFromCamelCaseToDash(file);
  });
});
```

TADA! now you got camel case to dashed slugs in your content paths!
