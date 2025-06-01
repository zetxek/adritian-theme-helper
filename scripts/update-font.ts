#!/usr/bin/env node

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

interface UpdateFontOptions {
  source: string;
  destination: string;
}

function parseArgs(): UpdateFontOptions {
  const args = process.argv.slice(2);
  const options: UpdateFontOptions = { source: '', destination: '' };

  // Check if help is requested
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--source' && i + 1 < args.length) {
      options.source = args[i + 1];
      i++;
    } else if (args[i] === '--destination' && i + 1 < args.length) {
      options.destination = args[i + 1];
      i++;
    }
  }

  if (!options.source || !options.destination) {
    console.error('❌ Error: Both source and destination directories are required.\n');
    showHelp();
    process.exit(1);
  }

  return options;
}

function showHelp(): void {
  console.log(`
🎨 Adritian Font Updater

Updates font files in your Hugo theme from a fontello download.

Usage:
  npm run update-font -- --source <source> --destination <destination>
  ts-node scripts/update-font.ts --source <source> --destination <destination>

Options:
  --source <path>        Path to the fontello download directory
  --destination <path>   Path to your Hugo site directory
  --help, -h            Show this help message

Examples:
  npm run update-font -- --source ../Downloads/fontello-123456 --destination ../my-hugo-site
  ts-node scripts/update-font.ts --source ./fontello-download --destination ./my-theme

The source directory should contain:
  - css/ folder with CSS files
  - font/ folder with font files  
  - config.json file

The destination directory should be your Hugo site root.
`);
}

function verifyDirectories(options: UpdateFontOptions): void {
  const { source, destination } = options;

  // Check source directory
  if (!fs.existsSync(source)) {
    throw new Error(`Source directory '${source}' does not exist`);
  }

  // Create destination directory if it doesn't exist
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  // Create required directories if they don't exist
  const requiredDirs = [
    path.join(destination, 'static', 'fonts'),
    path.join(destination, 'assets', 'css')
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

async function askForConfirmation(message: string): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

async function copyDirectory(src: string, dest: string, options: UpdateFontOptions): Promise<void> {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src, { withFileTypes: true });
  for (const file of files) {
    const srcPath = path.join(src, file.name);
    const destPath = path.join(dest, file.name);

    // Skip ignored files
    if (file.name.match(/adritian-icons-ie7/)) {
      console.log(`Skipping ignored file: ${file.name}`);
      continue;
    }

    if (file.isDirectory()) {
      // Skip nested font directories by checking if the source path already contains /font/
      if (file.name === 'font' && src.includes('/font/')) {
        console.log(`Skipping nested font directory: ${srcPath}`);
        continue;
      }
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      await copyDirectory(srcPath, destPath, options);
    } else {
      if (fs.existsSync(destPath)) {
        const shouldOverwrite = await askForConfirmation(`File ${destPath} already exists. Overwrite?`);
        if (!shouldOverwrite) {
          console.log(`Skipping: ${destPath}`);
          continue;
        }
      }
      console.log(`Copying: ${srcPath} -> ${destPath}`);
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function replaceInFiles(dir: string, searchStr: string, replaceStr: string): void {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    const filePath = path.join(dir, file.name);
    if (file.isFile() && (file.name.endsWith('.css') || file.name.endsWith('.json'))) {
      console.log(`Replacing in file: ${filePath}`);
      let content = fs.readFileSync(filePath, 'utf8');
      // Escape special regex characters in the search string
      const escapedSearchStr = searchStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(escapedSearchStr, 'g'), replaceStr);
      fs.writeFileSync(filePath, content);
    }
  }
}

async function updateFont(options: UpdateFontOptions): Promise<void> {
  try {
    console.log('Verifying directories...');
    verifyDirectories(options);

    const { source, destination } = options;

    // Copy CSS files
    console.log('\nCopying CSS files...');
    const cssSource = path.join(source, 'css');
    const cssDest = path.join(destination, 'assets', 'css');
    await copyDirectory(cssSource, cssDest, options);

    // Copy config.json
    console.log('\nCopying config.json...');
    const configSource = path.join(source, 'config.json');
    const configDest = path.join(destination, 'static', 'fonts', 'config.json');
    if (fs.existsSync(configDest)) {
      const shouldOverwrite = await askForConfirmation(`File ${configDest} already exists. Overwrite?`);
      if (!shouldOverwrite) {
        console.log('Skipping config.json');
      } else {
        console.log(`Copying: ${configSource} -> ${configDest}`);
        fs.copyFileSync(configSource, configDest);
      }
    } else {
      console.log(`Copying: ${configSource} -> ${configDest}`);
      fs.copyFileSync(configSource, configDest);
    }

    // Copy font files
    console.log('\nCopying font files...');
    const fontSource = path.join(source, 'font');
    const fontDest = path.join(destination, 'static', 'fonts');
    await copyDirectory(fontSource, fontDest, options);

    // Replace strings in CSS files
    console.log('\nReplacing strings in CSS files...');
    replaceInFiles(path.join(destination, 'assets', 'css'), '/font/', '/fonts/');

    // Replace strings in config.json
    console.log('\nReplacing strings in config.json...');
    const configPath = path.join(destination, 'static', 'fonts', 'config.json');
    if (fs.existsSync(configPath)) {
      let content = fs.readFileSync(configPath, 'utf8');
      content = content.replace(/\/font\//g, '/fonts/');
      fs.writeFileSync(configPath, content);
    }

    console.log('\nFont update completed successfully!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  const options = parseArgs();
  updateFont(options).catch((error) => {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { updateFont, parseArgs }; 