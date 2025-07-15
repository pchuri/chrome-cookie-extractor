import { ChromeCookieExtractor } from '../src/extractor';
import { Cookie } from '../src/types';
import * as fs from 'fs';

jest.mock('../src/profile-detector', () => ({
  ProfileDetector: { detectAllProfiles: jest.fn(() => []) }
}));

describe('ChromeCookieExtractor formatting', () => {
  const extractor = new ChromeCookieExtractor();
  const cookies: Cookie[] = [
    {
      name: 'session',
      value: '123',
      domain: '.example.com',
      path: '/',
      expires: 13253760000000000,
      secure: true,
      httponly: false,
      creationTime: 0
    },
    {
      name: 'enc',
      value: '[ENCRYPTED]',
      domain: 'example.com',
      path: '/',
      expires: 0,
      secure: false,
      httponly: false,
      creationTime: 0
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('formats Netscape file correctly', () => {
    const out = extractor.formatAsNetscape(cookies);
    const lines = out.split('\n');
    expect(lines[0]).toContain('Netscape HTTP Cookie File');
    expect(lines).toHaveLength(2);
    expect(lines[1]).toContain('.example.com');
    expect(lines[1]).toContain('session');
    expect(lines[1]).toContain('123');
  });

  it('formats curl header correctly', () => {
    expect(extractor.formatAsCurl(cookies)).toBe('-H "Cookie: session=123"');
    expect(extractor.formatAsCurl([cookies[1]])).toBe('');
  });

  it('formats JSON correctly', () => {
    const json = extractor.formatAsJson([cookies[0]]);
    const arr = JSON.parse(json);
    expect(arr[0].name).toBe('session');
    expect(arr).toHaveLength(1);
  });

  it('saves Netscape file to disk', () => {
    const tmp = '/tmp/test.txt';
    extractor.saveCookiesFile([cookies[0]], tmp);
    const actualFs = jest.requireActual('fs') as typeof fs;
    const data = actualFs.readFileSync(tmp, 'utf8');
    expect(data).toContain('Netscape HTTP Cookie File');
    actualFs.unlinkSync(tmp);
  });
});
