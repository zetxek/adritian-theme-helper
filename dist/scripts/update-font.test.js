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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const update_font_1 = require("./update-font");
jest.mock('fs');
jest.mock('path');
jest.mock('readline');
describe('updateFont', () => {
    const mockSourceDir = '/source';
    const mockDestDir = '/destination';
    const mockOptions = { source: mockSourceDir, destination: mockDestDir };
    const mockExistsSync = jest.spyOn(fs, 'existsSync');
    const mockCopyFileSync = jest.spyOn(fs, 'copyFileSync');
    const mockWriteFileSync = jest.spyOn(fs, 'writeFileSync');
    const mockReadFileSync = jest.spyOn(fs, 'readFileSync');
    const mockReaddirSync = jest.spyOn(fs, 'readdirSync');
    const mockStatSync = jest.spyOn(fs, 'statSync');
    const mockMkdirSync = jest.spyOn(fs, 'mkdirSync');
    const mockJoin = jest.spyOn(path, 'join');
    const mockQuestion = jest.fn();
    const mockReadlineInterface = {
        question: mockQuestion,
        close: jest.fn()
    };
    jest.spyOn(readline, 'createInterface').mockReturnValue(mockReadlineInterface);
    beforeEach(() => {
        jest.clearAllMocks();
        mockExistsSync.mockReturnValue(true);
        mockJoin.mockImplementation((...args) => args.join('/'));
        mockReaddirSync.mockReturnValue([
            { name: 'file1.css', isDirectory: () => false, isFile: () => true },
            { name: 'font', isDirectory: () => true, isFile: () => false }
        ]);
        mockStatSync.mockImplementation((filePath) => ({
            isDirectory: () => String(filePath).endsWith('font'),
            isFile: () => !String(filePath).endsWith('font')
        }));
        mockReadFileSync.mockReturnValue('url("/font/example.woff2")');
        mockQuestion.mockImplementation((_, callback) => callback('y'));
    });
    it('should verify directories and copy files', async () => {
        await (0, update_font_1.updateFont)(mockOptions);
        expect(mockExistsSync).toHaveBeenCalledWith(mockSourceDir);
        expect(mockExistsSync).toHaveBeenCalledWith(mockDestDir);
        expect(mockCopyFileSync).toHaveBeenCalled();
        expect(mockWriteFileSync).toHaveBeenCalled();
    });
    it('should throw error if source directory does not exist', async () => {
        mockExistsSync.mockImplementation((dir) => dir !== mockSourceDir);
        await expect((0, update_font_1.updateFont)(mockOptions)).rejects.toThrow();
    });
    it('should skip adritian-icons-ie7 files', async () => {
        mockReaddirSync
            .mockReturnValueOnce([
            { name: 'adritian-icons-ie7.css', isDirectory: () => false, isFile: () => true },
            { name: 'file1.css', isDirectory: () => false, isFile: () => true }
        ])
            .mockReturnValueOnce([])
            .mockReturnValueOnce([]);
        mockExistsSync.mockImplementation((path) => {
            if (String(path).includes('config.json')) {
                return false;
            }
            if (String(path).includes('source')) {
                return true;
            }
            if (String(path).includes('destination')) {
                return true;
            }
            return false;
        });
        await (0, update_font_1.updateFont)(mockOptions);
        expect(mockCopyFileSync).toHaveBeenCalledTimes(2);
        expect(mockCopyFileSync).not.toHaveBeenCalledWith(expect.stringContaining('adritian-icons-ie7'));
    });
    it('should skip file if user denies overwrite', async () => {
        mockReaddirSync
            .mockReturnValueOnce([
            { name: 'file1.css', isDirectory: () => false, isFile: () => true }
        ])
            .mockReturnValueOnce([])
            .mockReturnValueOnce([]);
        mockExistsSync.mockImplementation((path) => {
            if (String(path).includes('config.json')) {
                return true;
            }
            if (String(path).includes('source')) {
                return true;
            }
            if (String(path).includes('destination')) {
                return true;
            }
            return false;
        });
        mockQuestion.mockImplementation((_, callback) => callback('n'));
        await (0, update_font_1.updateFont)(mockOptions);
        expect(mockCopyFileSync).not.toHaveBeenCalled();
    });
    it('should handle nested font directories correctly', async () => {
        mockReaddirSync
            .mockReturnValueOnce([
            { name: 'font', isDirectory: () => true, isFile: () => false }
        ])
            .mockReturnValueOnce([
            { name: 'font', isDirectory: () => true, isFile: () => false },
            { name: 'style.css', isDirectory: () => false, isFile: () => true }
        ]);
        await (0, update_font_1.updateFont)(mockOptions);
        expect(mockCopyFileSync).toHaveBeenCalledWith(expect.stringContaining('/font/style.css'), expect.any(String));
    });
    it('should replace strings in CSS and JSON files', async () => {
        mockReaddirSync.mockReturnValueOnce([
            { name: 'style.css', isDirectory: () => false, isFile: () => true },
            { name: 'config.json', isDirectory: () => false, isFile: () => true }
        ]);
        mockReadFileSync.mockReturnValue('url("/font/example.woff2")');
        await (0, update_font_1.updateFont)(mockOptions);
        expect(mockWriteFileSync).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('/fonts/'));
    });
    it('should create destination directory if it does not exist', async () => {
        mockExistsSync
            .mockReturnValueOnce(true) // source exists
            .mockReturnValueOnce(false); // destination doesn't exist
        await (0, update_font_1.updateFont)(mockOptions);
        expect(mockMkdirSync).toHaveBeenCalledWith(mockDestDir, { recursive: true });
    });
});
describe('parseArgs', () => {
    const originalArgv = process.argv;
    beforeEach(() => {
        process.argv = [...originalArgv];
    });
    afterEach(() => {
        process.argv = originalArgv;
    });
    it('should parse source and destination arguments', () => {
        process.argv = ['node', 'update-font.ts', '--source', '/test/source', '--destination', '/test/dest'];
        const options = (0, update_font_1.parseArgs)();
        expect(options).toEqual({
            source: '/test/source',
            destination: '/test/dest'
        });
    });
    it('should throw error if source is missing', () => {
        process.argv = ['node', 'update-font.ts', '--destination', '/test/dest'];
        expect(() => (0, update_font_1.parseArgs)()).toThrow('Source directory is required');
    });
    it('should throw error if destination is missing', () => {
        process.argv = ['node', 'update-font.ts', '--source', '/test/source'];
        expect(() => (0, update_font_1.parseArgs)()).toThrow('Destination directory is required');
    });
});
