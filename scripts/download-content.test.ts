import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { adritianDownloadContent } from './download-content';

// Mock the external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');

describe('adritianDownloadContent', () => {
  const mockExecSync = execSync as jest.MockedFunction<typeof execSync>;
  const mockExistsSync = fs.existsSync as jest.MockedFunction<typeof fs.existsSync>;
  const mockMkdirSync = fs.mkdirSync as jest.MockedFunction<typeof fs.mkdirSync>;
  const mockJoin = path.join as jest.MockedFunction<typeof path.join>;

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
});