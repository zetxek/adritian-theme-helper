import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { adrianDownloadContent } from './download-content';

// Mock the external dependencies
jest.mock('child_process');
jest.mock('fs');
jest.mock('path');

describe('adrianDownloadContent', () => {
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
    adrianDownloadContent();

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
    adrianDownloadContent(dirsToDownload);

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

  it('should create temp directory if it does not exist', () => {
    mockExistsSync.mockReturnValueOnce(false);
    
    adrianDownloadContent();

    expect(mockMkdirSync).toHaveBeenCalledWith('temp-clone');
  });

  it('should handle missing directories gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    mockExistsSync
      .mockReturnValueOnce(true)  // temp dir exists
      .mockReturnValueOnce(false); // content dir doesn't exist

    adrianDownloadContent(['content']);

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Directory content not found')
    );
    
    consoleSpy.mockRestore();
  });

  it('should download config files along with directories', () => {
    adrianDownloadContent();

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

    adrianDownloadContent();

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('File hugo.toml not found')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('File hugo.disablemenu.toml not found')
    );
    
    consoleSpy.mockRestore();
  });

  it('should download only config files when specified', () => {
    adrianDownloadContent(['config']);

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
    adrianDownloadContent(['content']);

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
}); 