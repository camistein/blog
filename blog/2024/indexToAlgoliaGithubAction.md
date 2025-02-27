---
title: Index content to Algolia in Github Action
description: I will show you how you can index your markdown files into Algolia
image: https://i.ibb.co/WNCyJgRX/indexing.jpg
author: Camilla Nyberg
category: blog
categories: Algolia, Github,
createdAt: 2025-02-27
---

# Index content to Algolia in Github Action

In this article I'll show you how to index data from markdown files to an Algolia index.
The markdown files are in a separate repository and used as blog articles on my [website](https//camistein.dev/blog/) and I use Algolia to enable filtering of my articles by facets.

We'll create an `index.js` file to call during a Github Action that will fetch and parse all markdown files in [this repository](https://github.com/camistein/blog).

## Create Indexing functions

Create a `index.js` in the root of your directory

### Fetch config from arguments

```js
function getConfig() {
  const appIdIndex = process.argv.indexOf("-appId");
  const appKeyIndex = process.argv.indexOf("-appKey");
  const index = process.argv.indexOf("-index");

  return {
    index: process.argv[index + 1],
    appId: process.argv[appIdIndex + 1],
    appKey: process.argv[appKeyIndex + 1],
  };
}
```

### Fetch files from blog directory

We'll use `fs` to fetch and loop through folders and files in our blog directory.
The folder structure is blog/[Year]/[files]

```js
async function getFiles() {
  const files = [];
  const folderPath = __dirname + "/blog/";
  const yearFolders = await fs.promises.readdir(folderPath, {
    recursive: false,
  });

  for (const yearFolder of yearFolders) {
    const directoryContent = await fs.promises.readdir(
      `${folderPath}/${yearFolder}`,
      { recursive: true, withFileTypes: true }
    );

    for (const file of directoryContent) {
      if (file.isFile()) {
        files.push({
          name: file.name,
        });
      }
    }
  }

  return files;
}
```

But just having the file name doesnt do much for us, we want to index title, description, image and path for the actual file so we can display nice search items with Algolia.

### Map file content to metadata

We'll now fetch the file content and construct the `parseFileData` function to parse our file content to data we want to index to Algolia.

### Parse Markdown meta content

We want to extract the meta section of the markdown and use this to index to Algolia, it looks like this:

```
---
title: Index content to Algolia in Github Action
description: I will show you how you can index your markdown files into Algolia
image: https://i.ibb.co/WNCyJgRX/indexing.jpg
author: Camilla Nyberg
category: blog
categories: Algolia, Github,
createdAt: 2025-02-27
---

```

For that I've created this function to fetch all the different values in the meta section.

```js
function parseMetadata(data) {
  if (!data) {
    return {
      draft: "true",
      markdown: data ?? "",
    };
  }

  const meta = {
    draft: "false",
    markdown: data ?? "",
  };

  const metaDataSection = new RegExp(
    /(---(.|\n|\r|\r\n|\/)*?(?=---))(---)/g,
    "m"
  );

  const matchSection = data.trim().match(metaDataSection);

  if (matchSection) {
    const seoMeta = matchSection[0];
    const titles = [
      "title",
      "description",
      "image",
      "author",
      "createdAt",
      "authorImage",
      "category",
      "categories",
      "draft",
    ];

    for (const titleIndex in titles) {
      const titleRex = new RegExp(
        `(${titles[titleIndex]}:(.|\n|\r|\r\n|/|-)*?(?=(${titles.join(
          ":|"
        )}|---)))`,
        "gm"
      );
      const titleMatch = seoMeta.match(titleRex);
      if (titleMatch) {
        meta[titles[titleIndex]] = titleMatch[0]
          .replace(`${titles[titleIndex]}:`, "")
          .replace("\r\n", "")
          .replace("\n", "")
          .trim();
      }
    }
    meta.markdown = data.replace(metaDataSection, "");
  }

  return meta;
}
```

### Optional: Calculate reading time

If you'd like you can use the file content to calculate an estimated reading time to display for your articles.

```js
function calculateReadingTime(content) {
  const wpm = 225;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wpm);
}
```

### Now lets create an object to index from our file

Since we want to use our articles on a website with friendly urls we'll create a dashed name from our file name. The current file name is `indexToAlgoliaGithubAction.md`.
The following 2 rows will instead create this name `index-to-algolia-github-action`

```js
const name = filename.replace(/^.*[\\/]/, "").replace(".md", "");
const dashedName = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
```

We use the earlier created functions `parseMetadata` and the optional `calculateReadingTime` to fetch the meta data for your file.

```js
function parseFileData(filename, rootPath, content) {
  const name = filename.replace(/^.*[\\/]/, "").replace(".md", "");
  const dashedName = name.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

  const metadata = parseMetadata(content);
  const readingTime = calculateReadingTime(content);

  return {
    path: `${rootPath}/${dashedName}/`,
    name: `${name}`,
    meta: {
      path: `${rootPath}/${dashedName}/`,
      title: metadata?.title,
      description: metadata?.description,
      createdAt: metadata?.createdAt,
      readingTime: readingTime,
      createdAtTimeStamp: metadata?.createdAt
        ? convertToTimeStamp(metadata.createdAt)
        : 0,
      tags: metadata?.categories?.split(","),
      category: metadata?.category,
      categories: metadata?.categories,
      author: metadata?.author,
      image: metadata?.image,
      draft: metadata?.draft?.trim() ?? "false",
      objectID: `${rootPath}/${dashedName}/`.replaceAll("/", ":"),
    },
  };
}
```

The `convertToTimeStamp` function called above looks like below. This is generated so we can easily create a sorted index in Algolia that sorts on the value `createdAtTimeStamp`.

```js
function convertToTimeStamp(value) {
  const date = new Date(value);
  const timestamp = date.getTime() / 1000;
  return timestamp;
}
```

### Now use your parser

Change the content of the if `if (file.isFile())` in the function `getFiles` to use your parser method instead of just pushing an object with a name.

```js
if (file.isFile()) {
  const fileContent = await fs.readFileSync(
    `${file.parentPath}/${file.name}`,
    "utf8"
  );
  if (fileContent) {
    files.push(parseFileData(file.name, `/blog/${yearFolder}`, fileContent));
  }
}
```

### Index objects to Algolia

Install the package `algoliasearch`, I'm using version `^5.20.3`.
We'll call our `getConfig` function to fetch Algolia configuration values from
parameters when `index.js` file is called.

Then loop through your files and `addOrUpdateObject` each object with to the
chosen index and with its generated objectID and data.

I've added a few `console.log` to output a bit of information in the Github Action.

```js
async function indexFiles() {
  const records = await getFiles();
  const config = getConfig();
  const indexName = config.index;
  try {
    const client = algolia.algoliasearch(config.appId, config.appKey);
    console.log(`Indexing records, num files found ${records?.length}`);
    records?.forEach((record) => {
      if (!record.objectID) {
        record.objectID =
          record.meta.objectID ?? record.path.replaceAll("/", ":");
      }
      console.log(`Indexing record ${record.objectID}`);
      client.addOrUpdateObject({
        indexName,
        objectID: record.objectID,
        body: record,
      });
    });
  } catch (err) {
    console.error(err);
  }
}

indexFiles();
```

## Github

### Add secrets for your Algolia index to Github

Add the following secrets to your Github repository secrets with the values from Algolia.

- ALGOLIAAPPID
- ALGOLIAAPPKEY
- ALGOLIAINDEX (name of your index)

![Github secrets](https://i.ibb.co/X9TKCq5/Add-Secrets.png)

### Create your Github Action workflow file

Create a yml file in `.github/workflows`, dont forget the dot, name it what ever you want but I've named mine `index-files.yml`

Start with a basic content, I've added the trigger on: push: branches for main branch to always trigger indexing when new content has been pushed to main branch.

```yaml
name: Index files

on:
  push:
    branches: ["main"]

jobs:
  build:
    name: Index
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3

      - name: Cache npm dependencies
        uses: actions/cache@v2
        with:
          path: ~/.npm
          key: ${{ runner.os }}-npm-${{ hashFiles('**/package-lock.json') }}
          restore-keys: |
            ${{ runner.os }}-npm-

      - name: Install dependencies
        run: npm install
```

### Add node call to index.js

Now lets add the step to use our `index.js` file together with our Github repository secrets.

```yaml
- name: Index files
  run: node ./index.js -appId ${{ secrets.ALGOLIAAPPID }} -appKey ${{ secrets.ALGOLIAAPPKEY }} -index ${{ secrets.ALGOLIAINDEX }}
```

Now push and watch your Github Action run

![Github Action](https://i.ibb.co/5WjxV2ML/Github-Action.png)
