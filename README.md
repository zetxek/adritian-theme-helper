# adritian-theme-helper
NPM package to help automate some tasks

This script is a helper for the Hugo theme [adritian](https://github.com/zetxek/adritian-free-hugo-theme).

It downloads the content from the [adritian-demo repository](https://github.com/zetxek/adritian-demo) and copy it to the current directory. 

## Content downloaded usage

```bash
npm install adritian-theme-helper
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


Once you have the font files downloaded, you can run the script to update your font files in the them: 

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
