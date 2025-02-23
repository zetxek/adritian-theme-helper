# adritian-theme-helper
npm package to help automate some tasks (https://www.npmjs.com/package/@zetxek/adritian-theme-helper) for the Adrian Hugo theme [adritian](https://github.com/zetxek/adritian-free-hugo-theme).

It downloads the content from the [adritian-demo repository](https://github.com/zetxek/adritian-demo) and copies it to the current directory. 

✨ Theme theme is entirely free and open source. We welcome your ideas, feedback, and contributions! If you find it useful, please [give it a GitHub star](https://github.com/zetxek/adritian-free-hugo-theme) to show your support.

## Usage

Most likely you will want to follow the theme installation instructions (https://github.com/zetxek/adritian-free-hugo-theme?tab=readme-ov-file#as-a-hugo-module-recommended), where this script will be installed as part of 

```
hugo mod npm pack
npm I
```

If for some reason (such as using the theme not as a hugo module), you can still install and run the script, by running:

```bash
npm install @zetxek/adritian-theme-helper
npm run download-content
```

## Options

The script can download specific directories. The default is to download all of them.

```bash
npm run download-content -- i18n data content assets static config
```

## Getting help

The project is offered "as is", and it's a side project that powers my personal website. Support is given whenever life allows, and it's not offered in private e-mails: please use the public issue trackers in GitHub so others benefit from the conversation.

- 🐛 For bugs or errors (either in the code or documentation): create an issue [create an issue](https://github.com/zetxek/adritian-free-hugo-theme/issues).
- 💡 For ideas, discussion or open conversations: create a topic in the [discussion board for the theme](https://github.com/zetxek/adritian-free-hugo-theme/discussions).

  
