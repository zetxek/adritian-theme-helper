#!/usr/bin/env node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_URL: string = 'https://github.com/zetxek/adritian-demo';
const DIRS_TO_DOWNLOAD: string[] = ['i18n', 'data', 'content'];
const TEMP_DIR: string = 'temp-clone';

function adrianDownloadContent(): void {
  try {
    // Create temp directory if it doesn't exist
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR);
    }

    // Clone the repository
    console.log('Cloning repository...');
    execSync(`git clone --depth 1 ${REPO_URL} ${TEMP_DIR}`);

    // Copy each directory
    DIRS_TO_DOWNLOAD.forEach((dir: string) => {
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
  adrianDownloadContent();
}

export { adrianDownloadContent }; 