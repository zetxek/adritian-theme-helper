# adritian-theme-helper
npm package to help automate some tasks (https://www.npmjs.com/package/@zetxek/adritian-theme-helper) for the Adrian Hugo theme [adritian](https://github.com/zetxek/adritian-free-hugo-theme).

It downloads the content from the [adritian-demo repository](https://github.com/zetxek/adritian-demo) and copies it to the current directory. 

✨ Theme theme is entirely free and open source. We welcome your ideas, feedback, and contributions! If you find it useful, please [give it a GitHub star](https://github.com/zetxek/adritian-free-hugo-theme) to show your support.

## Content downloaded usage

Most likely you will want to follow the theme installation instructions (https://github.com/zetxek/adritian-free-hugo-theme?tab=readme-ov-file#as-a-hugo-module-recommended), where this script will be installed as part of 

```
hugo mod npm pack
npm i
```

If for some reason (such as using the theme not as a hugo module), you can still install and run the script, by running:

```bash
npm install @zetxek/adritian-theme-helper
npm run download-content
```

You can also run the scripts directly with ts-node if you have the repository cloned:

```bash
ts-node scripts/download-content.ts
ts-node scripts/update-font.ts --source <source> --destination <destination>
```

### Options

#### Download specific content directories
The script can download specific directories. The default is to download all of them, which is equivalent to the following:

**Using npm:**
```bash
npm run download-content i18n data content assets static config
```

**Using ts-node directly:**
```bash
ts-node scripts/download-content.ts i18n data content assets static config
```

But you can also download only some specific directories, such as:

**Using npm:**
```bash
npm run download-content content
```

**Using ts-node directly:**
```bash
ts-node scripts/download-content.ts content
```

#### Download specific branch
You can specify a branch to download from using the `--branch` or `-b` flag:

**Using npm:**
```bash
npm run download-content -- --branch develop
# Or with specific directories
npm run download-content -- --branch develop content i18n
```

**Using ts-node directly:**
```bash
ts-node scripts/download-content.ts --branch develop
# Or with specific directories
ts-node scripts/download-content.ts --branch develop content i18n
```


## Update Font Script

The `update-font` script helps you update font files in your theme. It copies font files, CSS, and configuration from a source directory to your Hugo site's appropriate directories.

In order to generate the font files, you can check the PR [here](https://github.com/zetxek/adritian-free-hugo-theme/pull/169).


Once you have the font files downloaded, you can run the script to update your font files in the theme:

### Usage

**Using npm:**
```bash
npm run update-font -- --source <source> --destination <destination>
```

**Using ts-node directly:**
```bash
ts-node scripts/update-font.ts --source <source> --destination <destination>
```

### Examples

**Using npm:**
```bash
npm run update-font -- --source ../Downloads/fontello-1234 --destination ../my-hugo-site
```

**Using ts-node directly:**
```bash
ts-node scripts/update-font.ts --source ../Downloads/fontello-1234 --destination ../my-hugo-site
```

#### Example output

```
➜  adritian-theme-helper git:(main) ts-node scripts/update-font.ts --source ../../Downloads/fontello-71722736 --destination ../adritian-free-hugo-theme 
Verifying directories...

Copying CSS files...
File ../adritian-free-hugo-theme/assets/css/adritian-icons-codes.css already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/css/adritian-icons-codes.css -> ../adritian-free-hugo-theme/assets/css/adritian-icons-codes.css
File ../adritian-free-hugo-theme/assets/css/adritian-icons-embedded.css already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/css/adritian-icons-embedded.css -> ../adritian-free-hugo-theme/assets/css/adritian-icons-embedded.css
Skipping ignored file: adritian-icons-ie7-codes.css
Skipping ignored file: adritian-icons-ie7.css
File ../adritian-free-hugo-theme/assets/css/adritian-icons.css already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/css/adritian-icons.css -> ../adritian-free-hugo-theme/assets/css/adritian-icons.css
File ../adritian-free-hugo-theme/assets/css/animation.css already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/css/animation.css -> ../adritian-free-hugo-theme/assets/css/animation.css

Copying config.json...
File ../adritian-free-hugo-theme/static/fonts/config.json already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/config.json -> ../adritian-free-hugo-theme/static/fonts/config.json

Copying font files...
File ../adritian-free-hugo-theme/static/fonts/adritian-icons.eot already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/font/adritian-icons.eot -> ../adritian-free-hugo-theme/static/fonts/adritian-icons.eot
File ../adritian-free-hugo-theme/static/fonts/adritian-icons.svg already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/font/adritian-icons.svg -> ../adritian-free-hugo-theme/static/fonts/adritian-icons.svg
File ../adritian-free-hugo-theme/static/fonts/adritian-icons.ttf already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/font/adritian-icons.ttf -> ../adritian-free-hugo-theme/static/fonts/adritian-icons.ttf
File ../adritian-free-hugo-theme/static/fonts/adritian-icons.woff already exists. Overwrite? (y/N): y 
Copying: ../../Downloads/fontello-71722736/font/adritian-icons.woff -> ../adritian-free-hugo-theme/static/fonts/adritian-icons.woff
File ../adritian-free-hugo-theme/static/fonts/adritian-icons.woff2 already exists. Overwrite? (y/N): y
Copying: ../../Downloads/fontello-71722736/font/adritian-icons.woff2 -> ../adritian-free-hugo-theme/static/fonts/adritian-icons.woff2

Replacing strings in CSS files...
Replacing in file: ../adritian-free-hugo-theme/assets/css/adritian-icons-codes.css
Replacing in file: ../adritian-free-hugo-theme/assets/css/adritian-icons-embedded.css
Replacing in file: ../adritian-free-hugo-theme/assets/css/adritian-icons.css
Replacing in file: ../adritian-free-hugo-theme/assets/css/animation.css
Replacing in file: ../adritian-free-hugo-theme/assets/css/bundle.css
Replacing in file: ../adritian-free-hugo-theme/assets/css/critical.css
Replacing in file: ../adritian-free-hugo-theme/assets/css/custom.css

Replacing strings in config.json...

Font update completed successfully!
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


## Getting help

The project is offered "as is", and it's a side project that powers my personal website. Support is given whenever life allows, and it's not offered in private e-mails: please use the public issue trackers in GitHub so others benefit from the conversation.

- 🐛 For bugs or errors (either in the code or documentation): create an issue [create an issue](https://github.com/zetxek/adritian-free-hugo-theme/issues).
- 💡 For ideas, discussion or open conversations: create a topic in the [discussion board for the theme](https://github.com/zetxek/adritian-free-hugo-theme/discussions).
