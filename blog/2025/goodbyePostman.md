---
title: Goodbye postman
description: It's been a good run but I've got to say goodbye to my friend Postman
image: https://i.ibb.co/Tqps0dLY/goodbyepostman.png
author: Camilla Nyberg
category: blog
categories: Postman
createdAt: 2025-11-23
updatedAt: 2026-06-05
---

# Goodbye, My Old Friend

:::preamble
It's been a good run. I have no idea how many API requests I've made over the years, but I'll always remember building my first API schema tests in Postman.
:::

## Why I'm Leaving

Postman isn't dead, discontinued, or even a bad product. In many situations, it's still a great tool. It just no longer fits the way I work.

The turning point for me was when local-first workflows started taking a back seat to cloud-based collaboration. Having to sign in to manage collections and relying on cloud storage for what used to be a lightweight desktop experience made me start looking elsewhere.

I understand why this direction appeals to teams and organizations. Shared workspaces, cloud synchronization, and collaboration features solve real problems. But my workflow is different.

A lot of what I use Postman for isn't just sending requests. It's building API schema tests, request collections, and validation suites that are part of a project's deliverables.

To me, those assets belong alongside the code they validate. If an API changes, I want the code, documentation, and tests to evolve together in the same repository and be versioned together.

The cloud-first approach creates a problem for me, especially because I work on both personal projects and client projects.

### Who actually owns those collections?

If I'm working for a client, I believe the client should own the API tests and request collections just as much as they own the source code. Those assets shouldn't be tied to my personal account in a cloud service.

What happens when I leave a project? What happens when another developer joins? What happens years later when the original team is gone?

The project should own the tests, not the individual developer who happened to create them.

That's why I prefer storing collections and tests in Git repositories alongside the code they validate. The repository becomes the source of truth, ownership is clear, onboarding is easier, and no one has to wonder which account contains the latest version.

There's also the personal side of it. If I'm using the same account for both client work and private projects, where is the line between those worlds? Who owns the data for my personal projects if that account is connected to my employer? What happens if I change jobs?

For me, local files stored in project repositories provide a much cleaner answer. API tests, request collections, and documentation are project assets. They should be versioned with the code, owned by the project, and remain independent of any individual developer's cloud account.

Yes, I can still use Postman's CLI without an account, but that's not where I build and organize my collections. My workflow has always lived in the desktop client, and today that experience no longer aligns with how I prefer to work.

And to be clear: this isn't about money. I would happily pay for a license to use a local-first client. What doesn't sit right with me is being required to sign in and automatically push my work into the cloud.

That's the part that gives me the ick.

## Alternative

### Bruno

Since I spend most of my day inside VS Code, I've found Bruno to be a natural replacement.

It offers both a standalone application and a VS Code extension, and for now the extension covers everything I need.

One thing I particularly like is that collections are stored as plain files that can live directly inside your repository. No hidden storage, no proprietary format, and no mandatory cloud account.

If you're curious, Bruno even has its own comparison page:

https://www.usebruno.com/compare/bruno-vs-postman

And I have to admit, the test command makes me smile every time:

```bash
bru run
```

Every single time my brain reads it as:

> Bruh.

## Goodbye

So goodbye, old friend.

You've taught me a lot over the years and helped me learn API development, testing, and automation. For that, I'll always be grateful.

Part of me still hopes you'll listen to the developers who miss the simpler days and bring back a truly local-first experience.

Until then, it's time for me to move on.
