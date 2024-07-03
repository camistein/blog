---
title: Sanity Open AI image property
description: I will show you how you how to create an image property with the option to generate AI Images.
image: https://i.ibb.co/ChX8C0R/AI-robot-Blog.png
author: Camilla Nyberg
category: blog
categories: Sanity, React, Typescript, OpenAI
createdAt: 2024-07-04
---

![AI robot](https://i.ibb.co/ChX8C0R/AI-robot-Blog.png)

# Generate AI Images in Sanity image property

Sometimes you might not have the energy or resources to create images.

Lets face it, not all of us are creative geniuses all the time and we just want to gt on with publishing our content.
In this post I will show you how to create an image property in Sanity with the option to generate & upload an AI Image instead.

This is intended for Sanity CMS so I assume you'll already have some basic undestanding of Santiy

With this property you'll be able to upload an choose an image just like the basic image property in Sanity but editors can also choose to generate an Open AI image and use it.

![Sanity generate AI Image](https://i.ibb.co/RCyVJHt/Generate-AIImage.png)

## 1. Create an Open AI account

First set up your [Open AI account](https://platform.openai.com/settings). It's easy and you can signup with your basic Google Account

You'll need the following keys from your account:

- Project ID
- Organization ID
- Api key

Save this in a notepad or something for now.

![OpenAI](https://i.ibb.co/4pqQQWV/OpenAI.png)

## 2. Add fields to .env

If you got .env files you should add the keys/ids to your environment files.

```
SANITY_OPENAI_PROJECT_ID = yourKey
SANITY_OPENAI_ORGANIZATION_ID = yourKey
SANITY_OPENAI_API_KEY = yourKey
```

## 3. Install OpenAI Nuget

Were going to use [OpenAI nuget package](https://www.npmjs.com/package/openai)

so run `npm install openai` or `yarn add openai`

## 4. Create custom input component

Create **AIImageIinput.tsx** in **/components/**

This is the starting base for our image editor.

```js
import { ComponentType } from "react";
import { ImageValue, ObjectSchemaType, ObjectInputProps } from "sanity";

export const AIImageInput: ComponentType<
  ObjectInputProps<ImageValue, ObjectSchemaType>
> = (props: ObjectInputProps<ImageValue>) => {
  return <div></div>;
};
```

## 4. Imports

We are going to need some basic imports for Sanity UI components, Icons, Open AI, Sanity Client, set & unset (for setting value).

Add the following to the top of your input component:

```js
import {
  TextInput,
  Button,
  Flex,
  Card,
  Text,
  Spinner,
  useToast,
} from "@sanity/ui"; //this is for UI elements
import {
  GenerateIcon,
  RefreshIcon,
  UploadIcon,
  CloseIcon,
} from "@sanity/icons"; //These are the icons we're going to use
import { useCallback, useState, ComponentType } from "react"; // we'll need React to handle state
import OpenAI from "openai"; // OpenAI of course !
import {
  useClient,
  ImageValue,
  ObjectSchemaType,
  ObjectInputProps,
} from "sanity"; //Input types for typescript
import { set, unset } from "sanity"; //So we can change the property value
```

Feel free to add other icons if you're not using sanity/icons. React icons works just as well.

## 5. Add Client and Toast

We are going to use toast and the Sanity client. So we can show feedback for errors or success messages to our editors and Sanity client to upload our AI Image to the CMS. '

Add these lines to the start of your component:

```js
const client = useClient({ apiVersion: "v2022-06-30" });
const toast = useToast();
```

It will look like this

```js
...
export const AIImageInput: ComponentType<
  ObjectInputProps<ImageValue, ObjectSchemaType>
> = (props: ObjectInputProps<ImageValue>) => {
  const client = useClient({ apiVersion: "v2022-06-30" });
  const toast = useToast();

....
```

## 6. Add functionality to generate AI Image

![Sanity generate AI Image](https://i.ibb.co/RCyVJHt/Generate-AIImage.png)

Now lets actually add functionality to generate our AI Image!

### First add state props

State properties:

```js
const [aIImage, setAIImage] = useState("");
const [prompt, setPrompt] = useState("");
const [loading, setLoading] = useState(false);
const [saving, setSaving] = useState(false);
const [fileName, setFileName] = useState("");
```

You can of course add these to a state object instead if you want, like such `const [state, setAIImage] = useState<AIImageInputState>({})`

Then render a text input and button to connect your view to inputs.

```js
return (
  <div>
    {props.renderDefault(props)}
    <Flex paddingY={3}>
      <TextInput
        placeholder="Describe image"
        value={prompt}
        onChange={(event) => setPrompt(event.currentTarget.value)}
      />

      <Button
        icon={aIImage ? RefreshIcon : GenerateIcon}
        text={loading ? "Loading" : "Generate AI Image"}
        disabled={loading || (!loading && !prompt)}
        onClick={generateAiImage}
      ></Button>

      {loading && (
        <Flex paddingX={4} justify="center" align="center">
          <Spinner muted />
        </Flex>
      )}
    </Flex>
  </div>
);
```

Now you might notice the onClick call to `generateAiImage` nad be like, what the hell is that???

Well we'll create that next!

This is the function to call and generate an image with the help of Open AI. Notice the `process.env`, we'll use the environment variables added from Open AI settings here, and unless you want to create your own backend api endpoint you'll have to add the setting **dangerouslyAllowBrowser: true**.

Usually I would say big NO NO to exposing API keys but your Sanity CMS will already be behing a basic auth login or perhaps even an custom SSO.

This function will generate an Open AI Image from your text input describing the image. Note the format will come in base64.

And we'll use toast to send feedback to our editor. So they'll know if they missed something or perhaps Open AI returned an error.

```js
const generateAiImage = useCallback(
  async (event: any) => {
    setAIImage("");

    if (!loading && prompt && prompt.trim().length > 0) {
      setLoading(true);

      const openai = new OpenAI({
        dangerouslyAllowBrowser: true,
        organization: process.env.SANITY_OPENAI_ORGANIZATION_ID ?? "",
        project: process.env.SANITY_OPENAI_PROJECT_ID ?? "",
        apiKey: process.env.SANITY_OPENAI_API_KEY ?? "",
      });

      try {
        setFileName(prompt.replaceAll(" ", "_"));
        openai.images
          .generate({
            prompt: prompt ?? "",
            n: 1,
            size: "1024x1024",
            response_format: "b64_json",
          })
          .then((response) => {
            if (response.data) {
              const image = response.data[0].b64_json;
              setLoading(false);
              setAIImage(image ?? "");
              toast.push({
                status: "success",
                title: `Success!`,
                description: `AI Image generated for ${prompt}`,
              });
            }
          });
      } catch (error) {
        setLoading(false);
        console.error(error);
        toast.push({
          status: "error",
          title: `Error when generating AI image!`,
          description: `${error}`,
        });
      }
    } else if (!prompt || (prompt && prompt.trim().length == 0)) {
      toast.push({
        status: "error",
        title: `You have to enter a text to generate image`,
      });
    }
  },
  [prompt, loading, toast]
);
```

To be able to render this image you can add an image tag to your React input component like such:

```js
<img
  style={{ width: "124px", height: "124px" }}
  src={`data:image/png;base64,${aIImage}`}
  width={72}
  height={72}
  alt="AI generated"
/>
```

## 7. Save image

We wont automatically upload every image to the CMS. Because let's face it not all AI images comes out perfect and we dont want to use up unnecessary space. So to begin with we only saved the image to our state, `const [aIImage, setAIImage] = useState('')`

Now what if the editor is happy with the image and want to use it!?

Then we'll need to upload it and set it to our property.

Let's get to it!

![Save generated AI Image](https://i.ibb.co/ChNZxjx/Generated-Image.png)

First we'll have to take our base64 string and create a Block from it so we'll add this function:

```js
const getAIBlob = useCallback(() => {
  const byteCharacters = atob(aIImage);
  const byteNumbers = new Array(byteCharacters.length);

  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }

  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: "image/png" });
}, [aIImage]);
```

Let's use this function to upload our blob to Sanity CMS.
We will again use toast to send feedback to our editor, since feedback is good, no matter good or bad.

We'll call `client.assets.upload` to actually upload the blob to the CMS. You don't need to add dataset or any webhook api key here. Remember we are in the sanity CMS context so all we added earlier was `const client = useClient({ apiVersion: "v2022-06-30" });`, Sanity will handle the rest.

We will use the onChange, set and unSet values from props to change the actual image in the property:
`props.onChange(image ? set(newValue) : unset())`

Full code:

```js
const saveImage = useCallback(
  async (event: any) => {
    if (fileName) {
      setSaving(true);
      setPrompt("");

      try {
        const blob = getAIBlob();
        const imageFileName = `${fileName}_${generateGUID()}`;
        client.assets
          .upload("image", blob, { filename: imageFileName })
          .then((image) => {
            setAIImage("");
            try {
              const newValue = {
                ...props.value,
                ...image,
                asset: {
                  _ref: image._id,
                  _type: "reference",
                },
              };
              props.onChange(image ? set(newValue) : unset());
              setFileName("");
            } catch (err) {
              toast.push({
                status: "error",
                title: `Error when saving AI image!`,
                description: `${err}`,
              });
            }
            setSaving(false);
          });
      } catch (error) {
        setSaving(false);
        console.error(error);
        toast.push({
          status: "error",
          title: `Error when generating AI image!`,
          description: `${error}`,
        });
      }
    }
  },
  [toast, client, fileName, getAIBlob, props, generateGUID]
);
```

Now an editor might write the same promt/text multiple times but we want an unique filename so we'll some auto generated random text & numbers to the end of each filename with this function

```js
const generateGUID = useCallback(() => {
  return "xxxxx-xxxx-yxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}, []);
```

We need to use the functions to actually make somethink happen so lets

Add this to your return:

```js
{
  aIImage && (
    <Card radius={2} shadow={1}>
      <Flex>
        <div>
          <img
            style={{ width: "124px", height: "124px" }}
            src={`data:image/png;base64,${aIImage}`}
            width={72}
            height={72}
            alt="AI generated"
          />
        </div>
        <div>
          <Flex paddingLeft={4} direction={"column"}>
            <Card paddingTop={4}>
              <Text>
                This image was generated from: {fileName.replaceAll("_", " ")}
              </Text>
            </Card>
            <Card paddingTop={4}>
              {fileName && (
                <Button
                  icon={UploadIcon}
                  text={saving ? "Saving" : "Use this image"}
                  disabled={saving}
                  onClick={saveImage}
                ></Button>
              )}
            </Card>
          </Flex>
        </div>
        <div>
          <Flex paddingLeft={4} justify={"flex-end"} align={"center"}>
            <CloseIcon
              style={{ fontSize: 37 }}
              onClick={() => clearAIImage()}
            />
          </Flex>
        </div>
      </Flex>
    </Card>
  );
}
```

so it will look like this in its complete form:

```js
  return  (<div>
               {props.renderDefault(props)}
               <Flex paddingY={3}>
                <TextInput placeholder='Describe image' value={prompt} onChange={(event) =>setPrompt(event.currentTarget.value)}
                } />
                <Button icon={aIImage ? RefreshIcon : GenerateIcon} text={loading ? 'Loading' : 'Generate AI Image'} disabled={loading || (!loading && !prompt)} onClick={generateAiImage}></Button>
                {loading && ( <Flex paddingX={4} justify="center" align="center"><Spinner muted /></Flex>)}
                </Flex>
                {aIImage && (<Card radius={2} shadow={1}>
                  <Flex>
                    <div>
                    <img style={{width: '124px', height: '124px'}} src={`data:image/png;base64,${aIImage}`} width={72} height={72} alt="AI generated" />
                    </div>
                    <div>
                      <Flex paddingLeft={4} direction={'column'}>
                        <Card paddingTop={4}>
                          <Text>This image was generated from: {fileName.replaceAll('_',' ')}</Text>
                        </Card>
                        <Card paddingTop={4}>
                        {fileName && (<Button icon={UploadIcon} text={saving ? 'Saving' : 'Use this image'} disabled={saving} onClick={saveImage}></Button>)}
                        </Card>
                      </Flex>
                    </div>
                    <div>
                        <Flex paddingLeft={4} justify={'flex-end'} align={'center'}>
                          <CloseIcon style={{fontSize: 37}} onClick={() => clearAIImage()} />
                        </Flex>
                    </div>
                  </Flex>
                  </Card>)}
</div>)}
```

## 8. Create Sanity Field

Now you can use your custom Sanity AI Image Input component for any image field.
Here I've added it to a Sanity document

```js
        defineField({
            name: 'image',
            title: 'Image',
            components: {
                input: AIImageInput
              },
            type: 'image'
        }),
```

## Complete code

In case I've forgotten to describe anything you can see the entirety of the code from my custom image input component below:

```js
import { TextInput, Button, Flex, Card, Text, Spinner, useToast} from '@sanity/ui'
import { GenerateIcon, RefreshIcon, UploadIcon, CloseIcon } from '@sanity/icons'
import { useCallback, useState, ComponentType } from 'react'
import OpenAI from 'openai'
import { useClient, ImageValue, ObjectSchemaType,ObjectInputProps } from 'sanity'
import {set, unset} from 'sanity'


export const AIImageInput:  ComponentType<ObjectInputProps<ImageValue, ObjectSchemaType>> = (props: ObjectInputProps<ImageValue>) => {
  const [aIImage, setAIImage] = useState('')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [fileName, setFileName] = useState('')

  const client = useClient( { apiVersion: 'v2022-06-30'})
  const toast = useToast()

  const generateAiImage = useCallback(async (event: any) => {
    setAIImage('')

    if(!loading && prompt && prompt.trim().length > 0) {
      setLoading(true)

      const openai = new OpenAI({
        dangerouslyAllowBrowser: true,
        organization: process.env.SANITY_OPENAI_ORGANIZATION_ID ?? "",
        project: process.env.SANITY_OPENAI_PROJECT_ID ?? "",
        apiKey: process.env.SANITY_OPENAI_API_KEY ?? "",
      });

      try {
        setFileName(prompt.replaceAll(' ', '_'))
        openai.images.generate({
            prompt: prompt ?? '',
            n: 1,
            size: '1024x1024',
            response_format: 'b64_json',
        }).then((response) => {
          if(response.data) {
            const image = response.data[0].b64_json;
            setLoading(false)
            setAIImage(image ?? '')
            toast.push({
              status: 'success',
              title: `Success!`,
              description: `AI Image generated for ${prompt}`,
            })
          }
        })
    } catch (error) {
        setLoading(false)
        console.error(error);
        toast.push({
          status: 'error',
          title: `Error when generating AI image!`,
          description: `${error}`,
        })
    }
    }
    else if(!prompt || (prompt && prompt.trim().length == 0)) {
      toast.push({
        status: 'error',
        title: `You have to enter a text to generate image`,
      })
    }
  }, [prompt, loading, toast])

  const generateGUID = useCallback(() => {
    return 'xxxxx-xxxx-yxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0,
    v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
    });
  }, [])

  const getAIBlob = useCallback( () => {
      const byteCharacters = atob(aIImage);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], {type: 'image/png'});
  }, [aIImage])

  const saveImage = useCallback(async (event: any) => {
    if(fileName) {
      setSaving(true)
      setPrompt('')

      try {
        const blob = getAIBlob()
        const imageFileName =  `${fileName}_${generateGUID()}`
        client.assets.upload('image', blob, { filename: imageFileName }).then((image) => {
          setAIImage('')
          try {
            const newValue = {
              ...props.value,
              ...image,
              asset: {
                _ref: image._id,
                _type: 'reference'
              }
            }
            props.onChange(image ? set(newValue) : unset())
            setFileName('')
        }
          catch(err) {
            toast.push({
              status: 'error',
              title: `Error when saving AI image!`,
              description: `${err}`,
            })
          }
          setSaving(false)
        })
      }
      catch(error) {
        setSaving(false)
        console.error(error);
        toast.push({
          status: 'error',
          title: `Error when generating AI image!`,
          description: `${error}`,
        })
      }
    }

  },[toast, client, fileName, getAIBlob, props, generateGUID])

  const clearAIImage = useCallback(() => {
    setAIImage('')
    setFileName('')
    setPrompt('')
    setLoading(false)
    setSaving(false)
  }, [])

  return  (<div>
               {props.renderDefault(props)}
               <Flex paddingY={3}>
                <TextInput placeholder='Describe image' value={prompt} onChange={(event) =>setPrompt(event.currentTarget.value)}
                } />
                <Button icon={aIImage ? RefreshIcon : GenerateIcon} text={loading ? 'Loading' : 'Generate AI Image'} disabled={loading || (!loading && !prompt)} onClick={generateAiImage}></Button>
                {loading && ( <Flex paddingX={4} justify="center" align="center"><Spinner muted /></Flex>)}
                </Flex>
                {aIImage && (<Card radius={2} shadow={1}>
                  <Flex>
                    <div>
                    <img style={{width: '124px', height: '124px'}} src={`data:image/png;base64,${aIImage}`} width={72} height={72} alt="AI generated" />
                    </div>
                    <div>
                      <Flex paddingLeft={4} direction={'column'}>
                        <Card paddingTop={4}>
                          <Text>This image was generated from: {fileName.replaceAll('_',' ')}</Text>
                        </Card>
                        <Card paddingTop={4}>
                        {fileName && (<Button icon={UploadIcon} text={saving ? 'Saving' : 'Use this image'} disabled={saving} onClick={saveImage}></Button>)}
                        </Card>
                      </Flex>
                    </div>
                    <div>
                        <Flex paddingLeft={4} justify={'flex-end'} align={'center'}>
                          <CloseIcon style={{fontSize: 37}} onClick={() => clearAIImage()} />
                        </Flex>
                    </div>
                  </Flex>
                  </Card>)}
</div>)}

```

Happy Sanity coding!
