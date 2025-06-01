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
exports.updateFont = updateFont;
exports.parseArgs = parseArgs;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
function parseArgs() {
    const args = process.argv.slice(2);
    const options = { source: '', destination: '' };
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--source' && i + 1 < args.length) {
            options.source = args[i + 1];
            i++;
        }
        else if (args[i] === '--destination' && i + 1 < args.length) {
            options.destination = args[i + 1];
            i++;
        }
    }
    if (!options.source) {
        throw new Error('Source directory is required');
    }
    if (!options.destination) {
        throw new Error('Destination directory is required');
    }
    return options;
}
function verifyDirectories(options) {
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
async function askForConfirmation(message) {
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
async function copyDirectory(src, dest, options) {
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
        }
        else {
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
function replaceInFiles(dir, searchStr, replaceStr) {
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
async function updateFont(options) {
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
            }
            else {
                console.log(`Copying: ${configSource} -> ${configDest}`);
                fs.copyFileSync(configSource, configDest);
            }
        }
        else {
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
    }
    catch (error) {
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
