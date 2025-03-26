#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.adritianDownloadContent = adritianDownloadContent;
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const REPO_URL = 'https://github.com/zetxek/adritian-demo';
const ALL_DIRS = [
    'i18n',
    'data',
    'content',
    'assets',
    'static',
    'config'
];
const CONFIG_FILES = [
    'hugo.toml',
    'hugo.disablemenu.toml'
];
const TEMP_DIR = 'temp-clone';
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {};
    const dirs = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--branch' || args[i] === '-b') {
            i++;
            if (i < args.length) {
                options.branch = args[i];
            }
            else {
                console.error('Error: Branch name is required after --branch/-b flag');
                process.exit(1);
            }
        }
        else {
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
function copyFiles(files) {
    for (const file of files) {
        const sourcePath = path.join(TEMP_DIR, file);
        const targetPath = path.join('.', file);
        if (fs.existsSync(sourcePath)) {
            console.log(`Copying ${file}...`);
            child_process_1.execSync(`cp ${sourcePath} ${targetPath}`);
        }
        else {
            console.warn(`Warning: File ${file} not found in repository`);
        }
    }
}
function adritianDownloadContent(dirsToDownload = ALL_DIRS, options = {}) {
    try {
        // Create temp directory if it doesn't exist
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR);
        }
        // Clone the repository with specified branch
        console.log(`Cloning repository from ${REPO_URL}...`);
        const branchInfo = options.branch ? `-b ${options.branch}` : 'default branch';
        console.log(`Using ${branchInfo}`);
        const cloneCommand = `git clone --depth 1 ${options.branch ? `-b ${options.branch}` : ''} ${REPO_URL} ${TEMP_DIR}`;
        child_process_1.execSync(cloneCommand);
        // Copy each directory (except config which is handled separately)
        const filteredDirs = dirsToDownload.filter(dir => dir !== 'config');
        for (const dir of filteredDirs) {
            const sourcePath = path.join(TEMP_DIR, dir);
            const targetPath = path.join('.', dir);
            if (fs.existsSync(sourcePath)) {
                // Remove existing directory if it exists
                if (fs.existsSync(targetPath)) {
                    child_process_1.execSync(`rm -rf ${targetPath}`);
                }
                // Copy directory
                console.log(`Copying ${dir}...`);
                child_process_1.execSync(`cp -r ${sourcePath} ${targetPath}`);
            }
            else {
                console.warn(`Warning: Directory ${dir} not found in repository`);
            }
        }
        // Copy config files if 'config' is in dirsToDownload or if downloading everything
        if (dirsToDownload.includes('config') || (dirsToDownload.length === ALL_DIRS.length && dirsToDownload.every(dir => ALL_DIRS.includes(dir)))) {
            copyFiles(CONFIG_FILES);
        }
        // Cleanup
        console.log('Cleaning up...');
        child_process_1.execSync(`rm -rf ${TEMP_DIR}`);
        console.log('Content downloaded successfully!');
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        // Cleanup on error
        if (fs.existsSync(TEMP_DIR)) {
            child_process_1.execSync(`rm -rf ${TEMP_DIR}`);
        }
        process.exit(1);
    }
}
// Execute if run directly
if (require.main === module) {
    const { dirs, options } = parseArgs();
    adritianDownloadContent(dirs, options);
}
