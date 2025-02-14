#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_URL: string = 'https://github.com/zetxek/adritian-demo';
const ALL_DIRS: string[] = [
  'i18n',
  'data',
  'content',
  'assets',
  'static',
  'config'
];
const CONFIG_FILES: string[] = [
  'hugo.toml',
  'hugo.disablemenu.toml'
];
const TEMP_DIR: string = 'temp-clone';

function parseArgs(): string[] {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    return ALL_DIRS;
  }

  const invalidDirs = args.filter(dir => !ALL_DIRS.includes(dir));
  if (invalidDirs.length > 0) {
    console.error('Error: Invalid directories specified:', invalidDirs.join(', '));
    console.error('Available options:', ALL_DIRS.join(', '));
    process.exit(1);
  }

  return args;
}

function copyFiles(files: string[]): void {
  files.forEach((file: string) => {
    const sourcePath: string = path.join(TEMP_DIR, file);
    const targetPath: string = path.join('.', file);

    if (fs.existsSync(sourcePath)) {
      console.log(`Copying ${file}...`);
      execSync(`cp ${sourcePath} ${targetPath}`);
    } else {
      console.warn(`Warning: File ${file} not found in repository`);
    }
  });
}

function adrianDownloadContent(dirsToDownload: string[] = ALL_DIRS): void {
  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }

    // Clone the repository
    console.log('Cloning repository...');
    execSync(`git clone --depth 1 ${REPO_URL} ${TEMP_DIR}`);

    // Copy each directory (except config which is handled separately)
    dirsToDownload
      .filter(dir => dir !== 'config')
      .forEach((dir: string) => {
        const sourcePath: string = path.join(TEMP_DIR, dir);
        const targetPath: string = path.join('.', dir);

        if (fs.existsSync(sourcePath)) {
          // Remove existing directory if it exists
          if (fs.existsSync(targetPath)) {
            execSync(`rm -rf ${targetPath}`);
          }
          
          // Copy directory
          console.log(`Copying ${dir}...`);
          execSync(`cp -r ${sourcePath} ${targetPath}`);
        } else {
          console.warn(`Warning: Directory ${dir} not found in repository`);
        }
      });

    // Copy config files if 'config' is in dirsToDownload or if downloading everything
    if (dirsToDownload.includes('config') || dirsToDownload === ALL_DIRS) {
      copyFiles(CONFIG_FILES);
    }

    // Cleanup
    console.log('Cleaning up...');
    execSync(`rm -rf ${TEMP_DIR}`);

    console.log('Content downloaded successfully!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    // Cleanup on error
    if (fs.existsSync(TEMP_DIR)) {
      execSync(`rm -rf ${TEMP_DIR}`);
    }
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  const dirsToDownload = parseArgs();
  adrianDownloadContent(dirsToDownload);
}

export { adrianDownloadContent }; 