import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { adritianDownloadContent, parseArgs } from './download-content';

// Mock the external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');

describe('adritianDownloadContent', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
  const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
  const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
  const mockJoin = path.join as jest.MockedFunction<typeof path.join>;
  const mockConsoleWarn = jest.spyOn(console, 'warn');
  const mockConsoleError = jest.spyOn(console, 'error');
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Default mock implementations
    mockExistsSync.mockReturnValue(true);
    mockJoin.mockImplementation((...paths) => paths.join('/'));
  });

  it('should download all directories by default', () => {
    adritianDownloadContent();

    // Should clone the repository
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('git clone --depth 1')
    );

    // Should create temp directory if it doesn't exist
    expect(mockMkdirSync).toHaveBeenCalledTimes(0); // Directory exists in this test

    // Should copy all directories
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('cp -r'));
    
    // Should cleanup
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('rm -rf'));
  });

  it('should download only specified directories', () => {
    const dirsToDownload = ['content', 'i18n'];
    adritianDownloadContent(dirsToDownload);

    // Should only copy specified directories
    dirsToDownload.forEach(dir => {
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining(`cp -r temp-clone/${dir}`)
      );
    });

    // Should not copy other directories
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/data')
    );
  });

  it('should handle branch names containing forward slashes', () => {
    const options = { branch: 'feature/new-design' };
    adritianDownloadContent(undefined, options);

    // Verify branch clone works with slashes
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('git clone --depth 1 -b feature/new-design')
    );

    // Verify normal directory copying still works
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/content')
    );
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/i18n') 
    );

    // Verify cleanup
    expect(mockExecSync).toHaveBeenLastCalledWith(
      expect.stringContaining('rm -rf temp-clone')
    );
  });

  it('should handle missing directories gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockExistsSync.mockReturnValue(false);

    adritianDownloadContent(['nonexistent']);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Directory nonexistent not found')
    );
    
    consoleSpy.mockRestore();
  });

  it('should download config files along with directories', () => {
    adritianDownloadContent();

    // Should copy hugo config files
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp temp-clone/hugo.toml')
    );
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp temp-clone/hugo.disablemenu.toml')
    );
  });

  it('should handle missing config files gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockExistsSync
      .mockReturnValueOnce(true)  // temp dir exists
      .mockReturnValue(false);    // config files don't exist

    adritianDownloadContent();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('File hugo.toml not found')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('File hugo.disablemenu.toml not found')
    );
    
    consoleSpy.mockRestore();
  });

  it('should download only config files when specified', () => {
    adritianDownloadContent(['config']);

    // Should copy hugo config files
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp temp-clone/hugo.toml')
    );
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp temp-clone/hugo.disablemenu.toml')
    );

    // Should not copy any directories
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/content')
    );
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/i18n')
    );
  });

  it('should not download config files when not specified', () => {
    adritianDownloadContent(['content']);

    // Should not copy hugo config files
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('cp temp-clone/hugo.toml')
    );
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('cp temp-clone/hugo.disablemenu.toml')
    );

    // Should copy specified directory
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/content')
    );
  });

  it('should clone from specific branch when branch option is provided', () => {
    const options = { branch: 'develop' };
    adritianDownloadContent(undefined, options);

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('git clone --depth 1 -b develop')
    );
  });

  it('should clone from default branch when no branch option is provided', () => {
    adritianDownloadContent();

    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('git clone --depth 1')
    );
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('-b')
    );
  });

  it('should handle branch option with specific directories', () => {
    const dirsToDownload = ['content', 'i18n'];
    const options = { branch: 'feature-branch' };
    adritianDownloadContent(dirsToDownload, options);

    // Verify branch clone
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('git clone --depth 1 -b feature-branch')
    );

    // Verify only specified directories are copied
    dirsToDownload.forEach(dir => {
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining(`cp -r temp-clone/${dir}`)
      );
    });

    // Verify other directories are not copied
    expect(mockExecSync).not.toHaveBeenCalledWith(
      expect.stringContaining('cp -r temp-clone/data')
    );
  });

  it('should handle non-existent directories', () => {
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    const mockExistsSync = jest.spyOn(fs, 'existsSync')
      .mockImplementation((path) => {
        if (typeof path === 'string' && path.includes('non-existent')) {
          return false;
        }
        return true;
      });
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // git clone
    jest.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['content'] as any); // readdirSync for temp-clone
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['non-existent']);
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warning: Directory non-existent not found in repository');
    mockConsoleWarn.mockRestore();
    mockExistsSync.mockRestore();
    mockExecSync.mockRestore();
  });

  it('should handle git clone errors', () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockImplementationOnce(() => {
        throw new Error('Git clone failed');
      });
    const mockExistsSync = jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['content']);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Git clone failed');
    mockConsoleError.mockRestore();
    mockExecSync.mockRestore();
    mockExistsSync.mockRestore();
  });

  it('should handle file copy errors', () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // git clone
    jest.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['content'] as any); // readdirSync for temp-clone
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockImplementationOnce(() => {
        throw new Error('Copy failed');
      });
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['content']);
    expect(mockConsoleError).toHaveBeenCalledWith('Error:', 'Copy failed');
    mockConsoleError.mockRestore();
    mockExecSync.mockRestore();
  });

  it('should use custom branch when specified', () => {
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // git clone
    jest.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['content'] as any); // readdirSync for temp-clone
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['content'], { branch: 'custom-branch' });
    expect(mockExecSync.mock.calls[0][0]).toContain('git clone --depth 1 -b custom-branch');
    mockExecSync.mockRestore();
  });

  it('should use custom repository when specified', () => {
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // git clone
    jest.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['content'] as any); // readdirSync for temp-clone
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['content'], { repo: 'https://custom-repo.git' });
    expect(mockExecSync.mock.calls[0][0]).toContain('https://custom-repo.git');
    mockExecSync.mockRestore();
  });

  it('should handle cleanup on error', () => {
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockImplementationOnce(() => {
        throw new Error('Git clone failed');
      });
    const mockExistsSync = jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['content']);
    expect(mockExecSync.mock.calls[1][0]).toContain('rm -rf temp-clone');
    mockConsoleError.mockRestore();
    mockExecSync.mockRestore();
    mockExistsSync.mockRestore();
  });

  it('should handle missing files during copy', () => {
    const mockConsoleWarn = jest.spyOn(console, 'warn').mockImplementation();
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // git clone
    jest.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['content'] as any); // readdirSync for temp-clone
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true) // existsSync for temp-clone
      .mockReturnValueOnce(false); // existsSync for hugo.toml
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['config']);
    expect(mockConsoleWarn).toHaveBeenCalledWith('Warning: File hugo.toml not found in repository');
    mockConsoleWarn.mockRestore();
    mockExecSync.mockRestore();
  });

  it('should remove existing directories before copying', () => {
    const mockExecSync = jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // git clone
    jest.spyOn(fs, 'readdirSync')
      .mockReturnValueOnce(['content'] as any); // readdirSync for temp-clone
    jest.spyOn(fs, 'existsSync')
      .mockReturnValueOnce(true); // existsSync for temp-clone
    jest.spyOn({ execSync }, 'execSync')
      .mockReturnValueOnce(Buffer.from('')); // cleanup
    adritianDownloadContent(['content']);
    expect(mockExecSync.mock.calls[1][0]).toContain('rm -rf ./content');
    mockExecSync.mockRestore();
  });
});

describe('parseArgs', () => {
  let originalArgv: string[];

  beforeEach(() => {
    originalArgv = process.argv;
    process.argv = ['node', 'script.js'];
  });

  afterEach(() => {
    process.argv = originalArgv;
  });

  it('should return all directories by default', () => {
    const { dirs, options } = parseArgs();
    expect(dirs).toEqual(['i18n', 'data', 'content', 'assets', 'static', 'config']);
    expect(options).toEqual({});
  });

  it('should parse branch option', () => {
    process.argv = ['node', 'script.js', '--branch', 'test-branch'];
    const { dirs, options } = parseArgs();
    expect(dirs).toEqual(['i18n', 'data', 'content', 'assets', 'static', 'config']);
    expect(options).toEqual({ branch: 'test-branch' });
  });

  it('should parse repo option', () => {
    process.argv = ['node', 'script.js', '--repo', 'https://example.com/repo.git'];
    const { dirs, options } = parseArgs();
    expect(dirs).toEqual(['i18n', 'data', 'content', 'assets', 'static', 'config']);
    expect(options).toEqual({ repo: 'https://example.com/repo.git' });
  });

  it('should parse specific directories', () => {
    process.argv = ['node', 'script.js', 'content', 'i18n'];
    const { dirs, options } = parseArgs();
    expect(dirs).toEqual(['content', 'i18n']);
    expect(options).toEqual({});
  });

  it('should handle branch shorthand option', () => {
    process.argv = ['node', 'script.js', '-b', 'test-branch'];
    const { dirs, options } = parseArgs();
    expect(options).toEqual({ branch: 'test-branch' });
  });

  it('should handle repo shorthand option', () => {
    process.argv = ['node', 'script.js', '-r', 'https://example.com/repo.git'];
    const { dirs, options } = parseArgs();
    expect(options).toEqual({ repo: 'https://example.com/repo.git' });
  });

  it('should throw error for missing branch name', () => {
    process.argv = ['node', 'script.js', '--branch'];
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    parseArgs();
    
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Branch name is required after --branch/-b flag');
    expect(mockExit).toHaveBeenCalledWith(1);
    
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should throw error for missing repo URL', () => {
    process.argv = ['node', 'script.js', '--repo'];
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    parseArgs();
    
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Repository URL is required after --repo/-r flag');
    expect(mockExit).toHaveBeenCalledWith(1);
    
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should throw error for invalid directories', () => {
    process.argv = ['node', 'script.js', 'invalid-dir'];
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    parseArgs();
    
    expect(mockConsoleError).toHaveBeenCalledWith('Error: Invalid directories specified:', 'invalid-dir');
    expect(mockConsoleError).toHaveBeenCalledWith('Available options:', expect.any(String));
    expect(mockExit).toHaveBeenCalledWith(1);
    
    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });
});