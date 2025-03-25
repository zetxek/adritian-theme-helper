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
const child_process_1 = require("child_process");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const download_content_1 = require("./download-content");
// Mock the external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');
describe('adritianDownloadContent', () => {
    const mockExecSync = child_process_1.execSync;
    const mockExistsSync = fs.existsSync;
    const mockMkdirSync = fs.mkdirSync;
    const mockJoin = path.join;
    beforeEach(() => {
        // Clear all mocks before each test
        jest.clearAllMocks();
        // Default mock implementations
        mockExistsSync.mockReturnValue(true);
        mockJoin.mockImplementation((...paths) => paths.join('/'));
    });
    it('should download all directories by default', () => {
        (0, download_content_1.adritianDownloadContent)();
        // Should clone the repository
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('git clone --depth 1'));
        // Should create temp directory if it doesn't exist
        expect(mockMkdirSync).toHaveBeenCalledTimes(0); // Directory exists in this test
        // Should copy all directories
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp -r'));
        // Should cleanup
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('rm -rf'));
    });
    it('should download only specified directories', () => {
        const dirsToDownload = ['content', 'i18n'];
        (0, download_content_1.adritianDownloadContent)(dirsToDownload);
        // Should only copy specified directories
        dirsToDownload.forEach(dir => {
            expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`cp -r temp-clone/${dir}`));
        });
        // Should not copy other directories
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('cp -r temp-clone/data'));
    });
    it('should create temp directory if it does not exist', () => {
        mockExistsSync.mockReturnValueOnce(false);
        (0, download_content_1.adritianDownloadContent)();
        expect(mockMkdirSync).toHaveBeenCalledWith('temp-clone');
    });
    it('should handle missing directories gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        mockExistsSync
            .mockReturnValueOnce(true) // temp dir exists
            .mockReturnValueOnce(false); // content dir doesn't exist
        (0, download_content_1.adritianDownloadContent)(['content']);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Directory content not found'));
        consoleSpy.mockRestore();
    });
    it('should download config files along with directories', () => {
        (0, download_content_1.adritianDownloadContent)();
        // Should copy hugo config files
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp temp-clone/hugo.toml'));
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp temp-clone/hugo.disablemenu.toml'));
    });
    it('should handle missing config files gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        mockExistsSync
            .mockReturnValueOnce(true) // temp dir exists
            .mockReturnValue(false); // config files don't exist
        (0, download_content_1.adritianDownloadContent)();
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('File hugo.toml not found'));
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('File hugo.disablemenu.toml not found'));
        consoleSpy.mockRestore();
    });
    it('should download only config files when specified', () => {
        (0, download_content_1.adritianDownloadContent)(['config']);
        // Should copy hugo config files
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp temp-clone/hugo.toml'));
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp temp-clone/hugo.disablemenu.toml'));
        // Should not copy any directories
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('cp -r temp-clone/content'));
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('cp -r temp-clone/i18n'));
    });
    it('should not download config files when not specified', () => {
        (0, download_content_1.adritianDownloadContent)(['content']);
        // Should not copy hugo config files
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('cp temp-clone/hugo.toml'));
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('cp temp-clone/hugo.disablemenu.toml'));
        // Should copy specified directory
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp -r temp-clone/content'));
    });
    it('should clone from specific branch when branch option is provided', () => {
        const options = { branch: 'develop' };
        (0, download_content_1.adritianDownloadContent)(undefined, options);
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('git clone --depth 1 -b develop'));
    });
    it('should clone from default branch when no branch option is provided', () => {
        (0, download_content_1.adritianDownloadContent)();
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('git clone --depth 1'));
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('-b'));
    });
    it('should handle branch option with specific directories', () => {
        const dirsToDownload = ['content', 'i18n'];
        const options = { branch: 'feature-branch' };
        (0, download_content_1.adritianDownloadContent)(dirsToDownload, options);
        // Verify branch clone
        expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('git clone --depth 1 -b feature-branch'));
        // Verify only specified directories are copied
        dirsToDownload.forEach(dir => {
            expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`cp -r temp-clone/${dir}`));
        });
        // Verify other directories are not copied
        expect(mockExecSync).not.toHaveBeenCalledWith(expect.stringContaining('cp -r temp-clone/data'));
    });
});
