import { ChromeCookieExtractor } from '../src/extractor';
import { ProfileDetector } from '../src/profile-detector';
import { Cookie } from '../src/types';

jest.mock('../src/profile-detector', () => ({
  ProfileDetector: { detectAllProfiles: jest.fn() }
}));

describe('ChromeCookieExtractor.extractCookies', () => {
  const sample: Cookie = {
    name: 'a',
    value: '1',
    domain: 'example.com',
    path: '/',
    expires: 0,
    secure: false,
    httponly: false,
    creationTime: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when no profiles found', async () => {
    (ProfileDetector.detectAllProfiles as jest.Mock).mockReturnValue([]);
    const ex = new ChromeCookieExtractor();
    await expect(ex.extractCookies()).rejects.toThrow('No Chrome/Brave profiles found');
  });

  it('aggregates cookies from all profiles', async () => {
    (ProfileDetector.detectAllProfiles as jest.Mock).mockReturnValue([
      { name: 'Default', path: '/p1', cookiesPath: '/p1/c' },
      { name: 'Profile1', path: '/p2', cookiesPath: '/p2/c' }
    ]);
    const spy = jest
      .spyOn(ChromeCookieExtractor.prototype as any, 'extractFromDatabase')
      .mockResolvedValue([sample]);
    const ex = new ChromeCookieExtractor();
    const cookies = await ex.extractCookies();
    expect(spy).toHaveBeenCalledTimes(2);
    expect(cookies.length).toBe(2);
    spy.mockRestore();
  });

  it('filters by profile name', async () => {
    (ProfileDetector.detectAllProfiles as jest.Mock).mockReturnValue([
      { name: 'Default', path: '/p1', cookiesPath: '/p1/c' },
      { name: 'Profile1', path: '/p2', cookiesPath: '/p2/c' }
    ]);
    const spy = jest
      .spyOn(ChromeCookieExtractor.prototype as any, 'extractFromDatabase')
      .mockResolvedValue([sample]);
    const ex = new ChromeCookieExtractor();
    const cookies = await ex.extractCookies({ profiles: ['Profile1'] });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(cookies.length).toBe(1);
    spy.mockRestore();
  });
});
