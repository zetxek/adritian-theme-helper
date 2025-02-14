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
}); 