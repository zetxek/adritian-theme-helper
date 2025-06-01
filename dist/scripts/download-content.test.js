"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const download_content_1 = require("./download-content");
// Mock the external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');
describe('adritianDownloadContent', () => {
    const mockExecFileSync = child_process_1.execFileSync;
    const mockExistsSync = fs_1.default.existsSync;
    const mockMkdirSync = fs_1.default.mkdirSync;
    const mockJoin = path_1.default.join;
    const mockConsoleWarn = jest.spyOn(console, 'warn');
    const mockConsoleError = jest.spyOn(console, 'error');
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
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
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1']));
        // Should create temp directory if it doesn't exist
        expect(mockMkdirSync).toHaveBeenCalledTimes(0); // Directory exists in this test
        // Should copy all directories
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['-r']));
        // Should cleanup
        expect(mockExecFileSync).toHaveBeenCalledWith('rm', expect.arrayContaining(['-rf']));
    });
    it('should download only specified directories', () => {
        const dirsToDownload = ['content', 'i18n'];
        (0, download_content_1.adritianDownloadContent)(dirsToDownload);
        // Should only copy specified directories
        dirsToDownload.forEach(dir => {
            expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining([`temp-clone/${dir}`]));
        });
        // Should not copy other directories
        expect(mockExecFileSync).not.toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/data']));
    });
    it('should handle branch names containing forward slashes', () => {
        const options = { branch: 'feature/new-design' };
        (0, download_content_1.adritianDownloadContent)(undefined, options);
        // Verify branch clone works with slashes
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1', '-b', 'feature/new-design']));
        // Verify normal directory copying still works
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', 'temp-clone/content']));
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', 'temp-clone/i18n']));
        // Verify cleanup
        expect(mockExecFileSync).toHaveBeenLastCalledWith('rm', expect.arrayContaining(['-rf', 'temp-clone']));
    });
    it('should handle missing directories gracefully', () => {
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        mockExistsSync.mockReturnValue(false);
        (0, download_content_1.adritianDownloadContent)(['nonexistent']);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Directory nonexistent not found'));
        consoleSpy.mockRestore();
    });
    it('should download config files along with directories', () => {
        (0, download_content_1.adritianDownloadContent)();
        // Should copy hugo config files
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/hugo.toml']));
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/hugo.disablemenu.toml']));
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
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/hugo.toml']));
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/hugo.disablemenu.toml']));
        // Should not copy any directories
        expect(mockExecFileSync).not.toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', 'temp-clone/content']));
        expect(mockExecFileSync).not.toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', 'temp-clone/i18n']));
    });
    it('should not download config files when not specified', () => {
        (0, download_content_1.adritianDownloadContent)(['content']);
        // Should not copy hugo config files
        expect(mockExecFileSync).not.toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/hugo.toml']));
        expect(mockExecFileSync).not.toHaveBeenCalledWith('cp', expect.arrayContaining(['temp-clone/hugo.disablemenu.toml']));
        // Should copy specified directory
        expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', 'temp-clone/content']));
    });
    it('should clone from specific branch when branch option is provided', () => {
        const options = { branch: 'develop' };
        (0, download_content_1.adritianDownloadContent)(undefined, options);
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1', '-b', 'develop']));
    });
    it('should clone from default branch when no branch option is provided', () => {
        (0, download_content_1.adritianDownloadContent)();
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1']));
        expect(mockExecFileSync).not.toHaveBeenCalledWith('git', expect.arrayContaining(['-b']));
    });
    it('should handle branch option with specific directories', () => {
        const dirsToDownload = ['content', 'i18n'];
        const options = { branch: 'feature-branch' };
        (0, download_content_1.adritianDownloadContent)(dirsToDownload, options);
        // Verify branch clone
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1', '-b', 'feature-branch']));
        // Verify only specified directories are copied
        dirsToDownload.forEach(dir => {
            expect(mockExecFileSync).toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', `temp-clone/${dir}`]));
        });
        // Verify other directories are not copied
        expect(mockExecFileSync).not.toHaveBeenCalledWith('cp', expect.arrayContaining(['-r', 'temp-clone/data']));
    });
    it('should handle non-existent directories', () => {
        const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
        const mockExistsSync = jest.spyOn(fs_1.default, 'existsSync')
            .mockImplementation((path) => {
            if (typeof path === 'string' && path.includes('non-existent')) {
                return false;
            }
            return true;
        });
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockReturnValueOnce(Buffer.from('')) // git clone
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        (0, download_content_1.adritianDownloadContent)(['non-existent']);
        expect(mockConsoleWarn).toHaveBeenCalledWith('Warning: Directory non-existent not found in repository');
        mockConsoleWarn.mockRestore();
        mockExistsSync.mockRestore();
        mockExecFileSync.mockRestore();
    });
    it('should handle git clone errors', () => {
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockImplementationOnce(() => {
            throw new Error('Git clone failed');
        })
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        const mockExistsSync = jest.spyOn(fs_1.default, 'existsSync')
            .mockReturnValueOnce(true); // existsSync for temp-clone
        (0, download_content_1.adritianDownloadContent)(['content']);
        expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Git clone failed');
        mockConsoleError.mockRestore();
        mockExecFileSync.mockRestore();
        mockExistsSync.mockRestore();
    });
    it('should handle file copy errors', () => {
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockReturnValueOnce(Buffer.from('')) // git clone
            .mockImplementationOnce(() => {
            throw new Error('Copy failed');
        })
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        const mockExistsSync = jest.spyOn(fs_1.default, 'existsSync')
            .mockReturnValueOnce(true); // existsSync for temp-clone
        (0, download_content_1.adritianDownloadContent)(['content']);
        expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Copy failed');
        mockConsoleError.mockRestore();
        mockExecFileSync.mockRestore();
    });
    it('should use custom branch when specified', () => {
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockReturnValueOnce(Buffer.from('')) // git clone
            .mockReturnValueOnce(Buffer.from('')) // copy
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        (0, download_content_1.adritianDownloadContent)(['content'], { branch: 'custom-branch' });
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1', '-b', 'custom-branch']));
        mockExecFileSync.mockRestore();
    });
    it('should use custom repository when specified', () => {
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockReturnValueOnce(Buffer.from('')) // git clone
            .mockReturnValueOnce(Buffer.from('')) // copy
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        (0, download_content_1.adritianDownloadContent)(['content'], { repo: 'https://custom-repo.git' });
        expect(mockExecFileSync).toHaveBeenCalledWith('git', expect.arrayContaining(['clone', '--depth', '1', 'https://custom-repo.git']));
        mockExecFileSync.mockRestore();
    });
    it('should handle cleanup on error', () => {
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockImplementationOnce(() => {
            throw new Error('Git clone failed');
        })
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        const mockExistsSync = jest.spyOn(fs_1.default, 'existsSync')
            .mockReturnValueOnce(true); // existsSync for temp-clone
        (0, download_content_1.adritianDownloadContent)(['content']);
        expect(mockExecFileSync).toHaveBeenCalledWith('rm', expect.arrayContaining(['-rf', 'temp-clone']));
        mockConsoleError.mockRestore();
        mockExecFileSync.mockRestore();
        mockExistsSync.mockRestore();
    });
    it('should handle missing files during copy', () => {
        const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockReturnValueOnce(Buffer.from('')) // git clone
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        const mockExistsSync = jest.spyOn(fs_1.default, 'existsSync')
            .mockReturnValueOnce(true) // existsSync for temp-clone
            .mockReturnValueOnce(false); // existsSync for hugo.toml
        (0, download_content_1.adritianDownloadContent)(['config']);
        expect(mockConsoleWarn).toHaveBeenCalledWith('Warning: File hugo.toml not found in repository');
        mockConsoleWarn.mockRestore();
        mockExecFileSync.mockRestore();
        mockExistsSync.mockRestore();
    });
    it('should remove existing directories before copying', () => {
        const mockExecFileSync = jest.spyOn({ execFileSync: child_process_1.execFileSync }, 'execFileSync')
            .mockReturnValueOnce(Buffer.from('')) // git clone
            .mockReturnValueOnce(Buffer.from('')) // rm -rf
            .mockReturnValueOnce(Buffer.from('')) // cp -r
            .mockReturnValueOnce(Buffer.from('')); // cleanup
        const mockExistsSync = jest.spyOn(fs_1.default, 'existsSync')
            .mockReturnValueOnce(true) // temp-clone exists
            .mockReturnValueOnce(true); // target directory exists
        (0, download_content_1.adritianDownloadContent)(['content']);
        expect(mockExecFileSync).toHaveBeenCalledWith('rm', expect.arrayContaining(['-rf', './content']));
        mockExecFileSync.mockRestore();
        mockExistsSync.mockRestore();
    });
});
describe('parseArgs', () => {
    let originalArgv;
    beforeEach(() => {
        originalArgv = process.argv;
        process.argv = ['node', 'script.js'];
    });
    afterEach(() => {
        process.argv = originalArgv;
    });
    it('should return all directories by default', () => {
        const { dirs, options } = (0, download_content_1.parseArgs)();
        expect(dirs).toEqual(['i18n', 'data', 'content', 'assets', 'static', 'config']);
        expect(options).toEqual({});
    });
    it('should parse branch option', () => {
        process.argv = ['node', 'script.js', '--branch', 'test-branch'];
        const { dirs, options } = (0, download_content_1.parseArgs)();
        expect(dirs).toEqual(['i18n', 'data', 'content', 'assets', 'static', 'config']);
        expect(options).toEqual({ branch: 'test-branch' });
    });
    it('should parse repo option', () => {
        process.argv = ['node', 'script.js', '--repo', 'https://example.com/repo.git'];
        const { dirs, options } = (0, download_content_1.parseArgs)();
        expect(dirs).toEqual(['i18n', 'data', 'content', 'assets', 'static', 'config']);
        expect(options).toEqual({ repo: 'https://example.com/repo.git' });
    });
    it('should parse specific directories', () => {
        process.argv = ['node', 'script.js', 'content', 'i18n'];
        const { dirs, options } = (0, download_content_1.parseArgs)();
        expect(dirs).toEqual(['content', 'i18n']);
        expect(options).toEqual({});
    });
    it('should handle branch shorthand option', () => {
        process.argv = ['node', 'script.js', '-b', 'test-branch'];
        const { dirs, options } = (0, download_content_1.parseArgs)();
        expect(options).toEqual({ branch: 'test-branch' });
    });
    it('should handle repo shorthand option', () => {
        process.argv = ['node', 'script.js', '-r', 'https://example.com/repo.git'];
        const { dirs, options } = (0, download_content_1.parseArgs)();
        expect(options).toEqual({ repo: 'https://example.com/repo.git' });
    });
    it('should throw error for missing branch name', () => {
        process.argv = ['node', 'script.js', '--branch'];
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        (0, download_content_1.parseArgs)();
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Branch name is required after --branch/-b flag');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should throw error for missing repo URL', () => {
        process.argv = ['node', 'script.js', '--repo'];
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        (0, download_content_1.parseArgs)();
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Repository URL is required after --repo/-r flag');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should throw error for invalid directories', () => {
        process.argv = ['node', 'script.js', 'invalid-dir'];
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => { });
        (0, download_content_1.parseArgs)();
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Invalid directories specified:', 'invalid-dir');
        expect(mockConsoleError).toHaveBeenCalledWith('Available options:', expect.any(String));
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
});
