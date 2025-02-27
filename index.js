const fs = require('fs');
const algolia = require('algoliasearch');

function calculateReadingTime(content) {
    const wpm = 225
    const words = content.trim().split(/\s+/).length
    return Math.ceil(words / wpm)
}

function convertToTimeStamp(value) {
    const date = new Date(value)
    const timestamp = date.getTime() / 1000
    return timestamp
}

function parseMetadata(data) {
    if (!data) {
      return {
        draft: 'true',
        markdown: data ?? ''
      }
    }
  
    const meta = {
      draft: 'false',
      markdown: data ?? ''
    }
  
    const metaDataSection = new RegExp(/(---(.|\n|\r|\r\n|\/)*?(?=---))(---)/g, 'm')
  
    const matchSection = data.trim().match(metaDataSection)
  
    if (matchSection) {
      const seoMeta = matchSection[0]
      const titles = [
        'title',
        'description',
        'image',
        'author',
        'createdAt',
        'authorImage',
        'category',
        'categories',
        'draft'
      ]
  
      for (const titleIndex in titles) {
        const titleRex = new RegExp(
          `(${titles[titleIndex]}:(.|\n|\r|\r\n|/|-)*?(?=(${titles.join(':|')}|---)))`,
          'gm'
        )
        const titleMatch = seoMeta.match(titleRex)
        if (titleMatch) {
          meta[titles[titleIndex]] = titleMatch[0]
            .replace(`${titles[titleIndex]}:`, '')
            .replace('\r\n', '')
            .replace('\n', '')
            .trim()
        }
      }
      meta.markdown = data.replace(metaDataSection, '')
    }
  
    return meta
}

function parseFileData(filename, rootPath, content) {
    const name = filename.replace(/^.*[\\/]/, '').replace('.md', '')
    const dashedName = name.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())

    const metadata = parseMetadata(content)
    const readingTime = calculateReadingTime(content)

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
            tags: metadata?.categories?.split(','),
            category: metadata?.category,
            categories: metadata?.categories,
            author: metadata?.author,
            image: metadata?.image,
            draft: metadata?.draft?.trim() ?? 'false',
            objectID: `${rootPath}/${dashedName}/`.replaceAll('/', ':')
        }
      }
}

async function getFiles() {
    const files = []
    const folderPath = __dirname + '/blog/'
    const yearFolders = await fs.promises.readdir(folderPath, { recursive: false })

    for(const yearFolder of yearFolders) {
        const directoryContent = await fs.promises.readdir(`${folderPath}/${yearFolder}`, { recursive: true, withFileTypes: true });
        for(const file of directoryContent) {
            if(file.isFile()) {
                const fileContent = await fs.readFileSync(`${file.parentPath}/${file.name}`, 'utf8')
                if(fileContent) {
                    files.push(parseFileData(file.name,`/blog/${yearFolder}`,fileContent))
                }
            }
        }
    }

    return files
}

function getConfig() {
  const appIdIndex = process.argv.indexOf('-appId');
  const appKeyIndex = process.argv.indexOf('-appKey');
  const index = process.argv.indexOf('-index');

  return {
    index: process.argv[index + 1],
    appId: process.argv[appIdIndex + 1],
    appKey: process.argv[appKeyIndex + 1]
  }
}

async function indexFiles() {         
    const records = await getFiles();
    const config = getConfig()
    const indexName = config.index
    try {
      const client = algolia.algoliasearch(config.appId, config.appKey)
      console.log(`Indexing records, num files found ${records?.length}`)
      records?.forEach((record) => {
        if (!record.objectID) {
          record.objectID = record.meta.objectID ?? record.path.replaceAll('/', ':')
        }
        console.log(`Indexing record ${record.objectID}`)
        client.addOrUpdateObject({
          indexName,
          objectID: record.objectID,
          body: record
        })
      })
    } 
    catch (err) {
      console.error(err)
    }
}

indexFiles()