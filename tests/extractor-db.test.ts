const mockDb = {
  close: jest.fn(),
  all: jest.fn(),
  run: jest.fn()
};

jest.mock('sqlite3', () => ({
  Database: jest.fn((path: string, mode: any, cb: any) => {
    const db = mockDb;
    if (cb) {
      setImmediate(() => cb(null));
    }
    return db;
  }),
  OPEN_READONLY: 0
}));

import { ChromeCookieExtractor } from '../src/extractor';
import { CookieDecryptor } from '../src/decryptor';
import { ProfileDetector } from '../src/profile-detector';
import * as sqlite3 from 'sqlite3';
const fsMock = require('fs');

jest.mock('../src/profile-detector', () => ({
  ProfileDetector: { detectAllProfiles: jest.fn(() => [{ name: 'Default', path: '/p', cookiesPath: '/p/Cookies' }]) }
}));

describe('ChromeCookieExtractor database operations', () => {
  const tableInfoRows = [
    { name: 'name' },
    { name: 'value' },
    { name: 'encrypted_value' },
    { name: 'host_key' },
    { name: 'path' },
    { name: 'expires_utc' },
    { name: 'is_secure' },
    { name: 'is_httponly' },
    { name: 'creation_utc' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb.all.mockReset();
    mockDb.run.mockReset();
    mockDb.close.mockReset();
  });

  it('extractFromDatabase returns decrypted cookies', async () => {
    const encryptedBuffer = Buffer.from('encrypted');
    mockDb.run.mockImplementation((q, cb) => cb(null));
    mockDb.all.mockImplementationOnce((q, cb) => cb(null, tableInfoRows));
    mockDb.all.mockImplementationOnce((q, params, cb) => cb(null, [{
      name: 'sid',
      value: '',
      encrypted_value: encryptedBuffer,
      host_key: 'example.com',
      path: '/',
      expires_utc: 0,
      is_secure: 0,
      is_httponly: 1,
      creation_utc: 0
    }]));
    jest.spyOn(CookieDecryptor, 'decryptValue').mockReturnValue('decrypted');
    const ex = new ChromeCookieExtractor();
    const res = await (ex as any).extractFromDatabase('/p/Cookies', 'example');
    expect(res[0].value).toBe('decrypted');
  });

  it('extractFromDatabase handles plain values', async () => {
    mockDb.run.mockImplementation((q, cb) => cb(null));
    mockDb.all.mockImplementationOnce((q, cb) => cb(null, tableInfoRows.filter(r => r.name !== 'encrypted_value')));
    mockDb.all.mockImplementationOnce((q, params, cb) => cb(null, [{
      name: 'sid',
      value: 'plain',
      host_key: 'example.com',
      path: '/',
      expires_utc: 0,
      is_secure: 0,
      is_httponly: 1,
      creation_utc: 0
    }]));
    const ex = new ChromeCookieExtractor();
    const res = await (ex as any).extractFromDatabase('/p/Cookies');
    expect(res[0].value).toBe('plain');
  });

  it('uses fallback value when decryption fails', async () => {
    const encryptedBuffer = Buffer.from('enc');
    mockDb.run.mockImplementation((q, cb) => cb(null));
    mockDb.all.mockImplementationOnce((q, cb) => cb(null, tableInfoRows));
    mockDb.all.mockImplementationOnce((q, params, cb) => cb(null, [{
      name: 'sid',
      value: 'abc',
      encrypted_value: encryptedBuffer,
      host_key: 'example.com',
      path: '/',
      expires_utc: 0,
      is_secure: 0,
      is_httponly: 0,
      creation_utc: 0
    }]));
    jest.spyOn(CookieDecryptor, 'decryptValue').mockReturnValue('[ENCRYPTED]');
    const ex = new ChromeCookieExtractor();
    const res = await (ex as any).extractFromDatabase('/p/Cookies');
    expect(res[0].value).toBe('abc');
  });

  it('falls back to copy when open fails', async () => {
    (sqlite3 as any).Database.mockImplementationOnce((p: string, m: any, cb: any) => { setImmediate(() => cb(new Error('fail'))); return mockDb; });
    const ex = new ChromeCookieExtractor();
    const spy = jest.spyOn(ex as any, 'extractFromDatabaseWithCopy').mockResolvedValue([]);
    await (ex as any).extractFromDatabase('/p/Cookies');
    expect(spy).toHaveBeenCalled();
  });

  it('extractFromDatabase rejects on schema error', async () => {
    mockDb.run.mockImplementation((q, cb) => cb(null));
    mockDb.all.mockImplementationOnce((q, cb) => cb(new Error('fail')));
    const ex = new ChromeCookieExtractor();
    await expect((ex as any).extractFromDatabase('/p/Cookies')).rejects.toBeTruthy();
  });

  it('extractFromDatabaseWithCopy uses temp copy', async () => {
    (fsMock as any).copyFileSync = jest.fn();
    (fsMock as any).unlinkSync = jest.fn();
    (fsMock as any).existsSync = jest.fn(() => true);

    mockDb.run.mockImplementation((q, cb) => cb(null));
    mockDb.all.mockImplementationOnce((q, cb) => cb(null, tableInfoRows));
    mockDb.all.mockImplementationOnce((q, params, cb) => cb(null, []));
    (sqlite3 as any).Database.mockImplementationOnce((p: string, m: any, cb: any) => { setImmediate(() => cb(null)); return mockDb; });

    const ex = new ChromeCookieExtractor();
    await (ex as any).extractFromDatabaseWithCopy('/p/Cookies');
    expect((fsMock as any).copyFileSync).toHaveBeenCalled();
    expect((fsMock as any).unlinkSync).toHaveBeenCalled();
  });

  it('extractFromDatabaseWithCopy handles open error', async () => {
    (fsMock as any).copyFileSync = jest.fn();
    (fsMock as any).unlinkSync = jest.fn();
    (fsMock as any).existsSync = jest.fn(() => false);

    (sqlite3 as any).Database.mockImplementationOnce((p: string, m: any, cb: any) => { setImmediate(() => cb(new Error('fail'))); return mockDb; });

    const ex = new ChromeCookieExtractor();
    await expect((ex as any).extractFromDatabaseWithCopy('/p/Cookies')).rejects.toBeTruthy();
    expect((fsMock as any).unlinkSync).not.toHaveBeenCalled();
  });

  it('extractFromDatabaseWithCopy with domain filter', async () => {
    (fsMock as any).copyFileSync = jest.fn();
    (fsMock as any).unlinkSync = jest.fn();
    (fsMock as any).existsSync = jest.fn(() => true);

    mockDb.run.mockImplementation((q, cb) => cb(null));
    mockDb.all.mockImplementationOnce((q, cb) => cb(null, tableInfoRows));
    mockDb.all.mockImplementationOnce((q, params, cb) => cb(null, []));
    (sqlite3 as any).Database.mockImplementationOnce((p: string, m: any, cb: any) => { setImmediate(() => cb(null)); return mockDb; });

    const ex = new ChromeCookieExtractor();
    await (ex as any).extractFromDatabaseWithCopy('/p/Cookies', 'example');
    expect((fsMock as any).copyFileSync).toHaveBeenCalled();
  });
});
