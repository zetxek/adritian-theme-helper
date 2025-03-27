# adritian-theme-helper
npm package to help automate some tasks (https://www.npmjs.com/package/@zetxek/adritian-theme-helper) for the Adrian Hugo theme [adritian](https://github.com/zetxek/adritian-free-hugo-theme).

It downloads the content from the [adritian-demo repository](https://github.com/zetxek/adritian-demo) and copies it to the current directory. 

✨ Theme theme is entirely free and open source. We welcome your ideas, feedback, and contributions! If you find it useful, please [give it a GitHub star](https://github.com/zetxek/adritian-free-hugo-theme) to show your support.

## Content downloaded usage

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

### Options

### Specific Directories
The script can download specific directories. The default is to download all of them.

```bash
npm run download-content -- i18n data content assets static config
```

#### Specific Branch
You can specify a branch to download from using the `--branch` or `-b` flag:

```bash
npm run download-content --branch develop
# Or with specific directories
npm run download-content --branch develop content i18n
```


## Update Font Script

The `update-font` script helps you update font files in your theme. It copies font files, CSS, and configuration from a source directory to your Hugo site's appropriate directories.

In order to generate the font files, you can check the PR [here](https://github.com/zetxek/adritian-free-hugo-theme/pull/169).


Once you have the font files downloaded, you can run the script to update your font files in the theme:
### Usage

```bash
ts-node scripts/update-font.ts <source> <destination>
```

### Example

```bash
ts-node scripts/update-font.ts ./my-font-source ./my-hugo-site
```

### What it does

1. Verifies that both source and destination directories exist
2. Checks for required subdirectories in the destination:
   - `static/fonts`
   - `assets/css`
3. Copies files from source to destination:
   - `css/*` → `assets/css/`
   - `config.json` → `static/fonts/config.json`
   - `font/*` → `static/fonts/`
4. Skips specific files:
   - `adritian-icons-ie7-codes.css`
   - `adritian-icons-ie7.css`
5. Replaces `/font/` with `/fonts/` in all CSS files and config.json
6. Asks for confirmation before overwriting existing files

### Source Directory Structure

Your source directory should have this structure:
```
source/
├── css/
│   └── (CSS files)
├── font/
│   └── (font files)
└── config.json
```

### Notes

- The script will prompt for confirmation before overwriting any existing files
- You can choose to skip specific files during the update process
- The script automatically handles nested directories
- All file operations are logged for transparency

```bash
npm run download-content
```
