import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { updateFont, parseArgs } from './update-font';

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
  jest.spyOn(readline, 'createInterface').mockReturnValue(mockReadlineInterface as any);

  beforeEach(() => {
    jest.clearAllMocks();
    mockExistsSync.mockReturnValue(true);
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockReaddirSync.mockReturnValue([
      { name: 'file1.css', isDirectory: () => false, isFile: () => true } as fs.Dirent,
      { name: 'font', isDirectory: () => true, isFile: () => false } as fs.Dirent
    ]);
    mockStatSync.mockImplementation((filePath) => ({
      isDirectory: () => String(filePath).endsWith('font'),
      isFile: () => !String(filePath).endsWith('font')
    } as fs.Stats));
    mockReadFileSync.mockReturnValue('url("/font/example.woff2")');
    mockQuestion.mockImplementation((_, callback) => callback('y'));
  });

  it('should verify directories and copy files', async () => {
    await updateFont(mockOptions);
    expect(mockExistsSync).toHaveBeenCalledWith(mockSourceDir);
    expect(mockExistsSync).toHaveBeenCalledWith(mockDestDir);
    expect(mockCopyFileSync).toHaveBeenCalled();
    expect(mockWriteFileSync).toHaveBeenCalled();
  });

  it('should throw error if source directory does not exist', async () => {
    mockExistsSync.mockImplementation((dir) => dir !== mockSourceDir);
    await expect(updateFont(mockOptions)).rejects.toThrow();
  });

  it('should skip adritian-icons-ie7 files', async () => {
    mockReaddirSync
      .mockReturnValueOnce([
        { name: 'adritian-icons-ie7.css', isDirectory: () => false, isFile: () => true } as fs.Dirent,
        { name: 'file1.css', isDirectory: () => false, isFile: () => true } as fs.Dirent
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
    await updateFont(mockOptions);
    expect(mockCopyFileSync).toHaveBeenCalledTimes(2);
    expect(mockCopyFileSync).not.toHaveBeenCalledWith(expect.stringContaining('adritian-icons-ie7'));
  });

  it('should skip file if user denies overwrite', async () => {
    mockReaddirSync
      .mockReturnValueOnce([
        { name: 'file1.css', isDirectory: () => false, isFile: () => true } as fs.Dirent
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
    await updateFont(mockOptions);
    expect(mockCopyFileSync).not.toHaveBeenCalled();
  });

  it('should handle nested font directories correctly', async () => {
    mockReaddirSync
      .mockReturnValueOnce([
        { name: 'font', isDirectory: () => true, isFile: () => false } as fs.Dirent
      ])
      .mockReturnValueOnce([
        { name: 'font', isDirectory: () => true, isFile: () => false } as fs.Dirent,
        { name: 'style.css', isDirectory: () => false, isFile: () => true } as fs.Dirent
      ]);
    await updateFont(mockOptions);
    expect(mockCopyFileSync).toHaveBeenCalledWith(
      expect.stringContaining('/font/style.css'),
      expect.any(String)
    );
  });

  it('should replace strings in CSS and JSON files', async () => {
    mockReaddirSync.mockReturnValueOnce([
      { name: 'style.css', isDirectory: () => false, isFile: () => true } as fs.Dirent,
      { name: 'config.json', isDirectory: () => false, isFile: () => true } as fs.Dirent
    ]);
    mockReadFileSync.mockReturnValue('url("/font/example.woff2")');
    await updateFont(mockOptions);
    expect(mockWriteFileSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('/fonts/')
    );
  });

  it('should create destination directory if it does not exist', async () => {
    mockExistsSync
      .mockReturnValueOnce(true)  // source exists
      .mockReturnValueOnce(false); // destination doesn't exist
    await updateFont(mockOptions);
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
    const options = parseArgs();
    expect(options).toEqual({
      source: '/test/source',
      destination: '/test/dest'
    });
  });

  it('should throw error if source is missing', () => {
    process.argv = ['node', 'update-font.ts', '--destination', '/test/dest'];
    expect(() => parseArgs()).toThrow('Source directory is required');
  });

  it('should throw error if destination is missing', () => {
    process.argv = ['node', 'update-font.ts', '--source', '/test/source'];
    expect(() => parseArgs()).toThrow('Destination directory is required');
  });
}); 