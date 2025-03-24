#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

interface UpdateFontOptions {
  source: string;
  destination: string;
}

function parseArgs(): UpdateFontOptions {
  const args = process.argv.slice(2);
  
  if (args.length !== 2) {
    console.error('Error: Please provide source and destination directories');
    console.error('Usage: update-font <source> <destination>');
    process.exit(1);
  }

  return {
    source: args[0],
    destination: args[1]
  };
}

function verifyDirectories(options: UpdateFontOptions): void {
  const { source, destination } = options;
  
  // Check if directories exist
  if (!fs.existsSync(source)) {
    console.error(`Error: Source directory '${source}' does not exist`);
    process.exit(1);
  }
  
  if (!fs.existsSync(destination)) {
    console.error(`Error: Destination directory '${destination}' does not exist`);
    process.exit(1);
  }

  // Check required subdirectories in destination
  const requiredDirs = [
    path.join(destination, 'static', 'fonts'),
    path.join(destination, 'assets', 'css')
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.error(`Error: Required directory '${dir}' does not exist in destination`);
      process.exit(1);
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
  if (!fs.existsSync(src)) {
    console.warn(`Warning: Source directory '${src}' does not exist`);
    return;
  }

  const files = fs.readdirSync(src);
  
  for (const file of files) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);

    // Skip specific files
    if (file === 'adritian-icons-ie7-codes.css' || file === 'adritian-icons-ie7.css') {
      console.log(`Skipping ignored file: ${file}`);
      continue;
    }

    if (fs.statSync(srcPath).isDirectory()) {
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

function replaceInFiles(directory: string, searchStr: string, replaceStr: string): void {
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const filePath = path.join(directory, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      replaceInFiles(filePath, searchStr, replaceStr);
    } else if (file.endsWith('.css') || file.endsWith('.json')) {
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
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  const options = parseArgs();
  updateFont(options);
}

export { updateFont }; 