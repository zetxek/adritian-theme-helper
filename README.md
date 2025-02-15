# adritian-theme-helper
npm package to help automate some tasks (https://www.npmjs.com/package/@zetxek/adritian-theme-helper).

This script is a helper for the Hugo theme [adritian](https://github.com/zetxek/adritian-free-hugo-theme).

It downloads the content from the [adritian-demo repository](https://github.com/zetxek/adritian-demo) and copies it to the current directory. 

## Usage

```bash
npm install adritian-theme-helper
npm run download-content
```

## Options

The script can download specific directories. The default is to download all of them.

```bash
npm run download-content -- i18n data content assets static config
```


