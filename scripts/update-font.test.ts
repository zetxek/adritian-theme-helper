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
}); 