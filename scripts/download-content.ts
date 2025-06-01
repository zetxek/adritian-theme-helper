#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

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

interface DownloadOptions {
  branch?: string;
  repo?: string;
}

function parseArgs(): { dirs: string[], options: DownloadOptions } {
  const args = process.argv.slice(2);
  const options: DownloadOptions = {};
  const dirs: string[] = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--branch' || args[i] === '-b') {
      i++;
      if (i < args.length) {
        options.branch = args[i];
      } else {
        console.error('Error: Branch name is required after --branch/-b flag');
        process.exit(1);
      }
    } else if (args[i] === '--repo' || args[i] === '-r') {
      i++;
      if (i < args.length) {
        options.repo = args[i];
      } else {
        console.error('Error: Repository URL is required after --repo/-r flag');
        process.exit(1);
      }
    } else {
      dirs.push(args[i]);
    }
  }

  if (dirs.length === 0) {
    return { dirs: ALL_DIRS, options };
  }

  const invalidDirs = dirs.filter(dir => !ALL_DIRS.includes(dir));
  if (invalidDirs.length > 0) {
    console.error('Error: Invalid directories specified:', invalidDirs.join(', '));
    console.error('Available options:', ALL_DIRS.join(', '));
    process.exit(1);
  }

  return { dirs, options };
}

function copyFiles(files: string[]): void {
  files.forEach((file: string) => {
    const sourcePath: string = path.join(TEMP_DIR, file);
    const targetPath: string = path.join('.', file);

    if (fs.existsSync(sourcePath)) {
      console.log(`Copying ${file}...`);
      execFileSync('cp', [sourcePath, targetPath]);
    } else {
      console.warn(`Warning: File ${file} not found in repository`);
    }
  });
}

function adritianDownloadContent(dirsToDownload: string[] = ALL_DIRS, options: DownloadOptions = {}): void {
  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }

    // Use the provided repo URL or fall back to the default
    const repoUrl = options.repo || REPO_URL;

    // Clone the repository with specified branch
    console.log('Cloning repository...');
    const cloneArgs = ['clone', '--depth', '1'];
    if (options.branch) {
      cloneArgs.push('-b', options.branch);
    }
    cloneArgs.push(repoUrl, TEMP_DIR);
    execFileSync('git', cloneArgs);

    // Copy each directory (except config which is handled separately)
    dirsToDownload
      .filter(dir => dir !== 'config')
      .forEach((dir: string) => {
        const sourcePath: string = path.join(TEMP_DIR, dir);
        const targetPath: string = path.join('.', dir);

        if (fs.existsSync(sourcePath)) {
          // Remove existing directory if it exists
          if (fs.existsSync(targetPath)) {
            execFileSync('rm', ['-rf', targetPath]);
          }
          
          // Copy directory
          console.log(`Copying ${dir}...`);
          execFileSync('cp', ['-r', sourcePath, targetPath]);
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
    execFileSync('rm', ['-rf', TEMP_DIR]);

    console.log('Content downloaded successfully!');
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error));
    // Cleanup on error
    if (fs.existsSync(TEMP_DIR)) {
      execFileSync('rm', ['-rf', TEMP_DIR]);
    }
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  const { dirs, options } = parseArgs();
  adritianDownloadContent(dirs, options);
}

export { adritianDownloadContent, parseArgs };