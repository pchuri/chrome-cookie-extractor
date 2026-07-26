import { execSync } from 'child_process';

jest.mock('child_process', () => ({
  execSync: jest.fn()
}));

// Return no cookies so the command builds a curl invocation without touching
// real Chrome data or the network.
jest.mock('../src/extractor', () => ({
  ChromeCookieExtractor: jest.fn().mockImplementation(() => ({
    extractCookies: jest.fn().mockResolvedValue([]),
    formatAsNetscape: jest.fn().mockReturnValue('')
  }))
}));

const mockedExecSync = execSync as jest.Mock;

// Load a fresh copy of the commander program for each test so option state
// does not leak between parses.
function loadProgram() {
  let program: any;
  jest.isolateModules(() => {
    program = require('../src/auth-curl').default;
  });
  program.exitOverride();
  return program;
}

describe('auth-curl timing options', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes --max-time through to curl', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ['https://example.com', '--max-time', '20'],
      { from: 'user' }
    );

    expect(mockedExecSync).toHaveBeenCalledTimes(1);
    const command = mockedExecSync.mock.calls[0][0] as string;
    expect(command).toContain('--max-time 20');
  });

  it('passes --connect-timeout through to curl', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ['https://example.com', '--connect-timeout', '5'],
      { from: 'user' }
    );

    const command = mockedExecSync.mock.calls[0][0] as string;
    expect(command).toContain('--connect-timeout 5');
  });

  it('does not add --max-time when the option is absent', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ['https://example.com'],
      { from: 'user' }
    );

    const command = mockedExecSync.mock.calls[0][0] as string;
    expect(command).not.toContain('--max-time');
  });

  it('rejects an invalid --max-time value with a non-zero exit', async () => {
    const program = loadProgram();
    const exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(((code?: number) => {
        throw new Error(`exit:${code}`);
      }) as never);

    await expect(
      program.parseAsync(
        ['https://example.com', '--max-time', 'notanumber'],
        { from: 'user' }
      )
    ).rejects.toThrow('exit:1');

    expect(mockedExecSync).not.toHaveBeenCalled();
    exitSpy.mockRestore();
  });
});

describe('auth-curl passthrough of unknown curl flags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards an unknown combined short flag (-sL) to curl', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ['-sL', 'https://example.com'],
      { from: 'user' }
    );

    expect(mockedExecSync).toHaveBeenCalledTimes(1);
    const command = mockedExecSync.mock.calls[0][0] as string;
    expect(command).toContain('-sL');
    // URL is still recognized as the request target.
    expect(command).toContain('"https://example.com"');
  });

  it('forwards --max-time together with -sL and preserves the URL', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ['--max-time', '25', '-sL', 'https://example.com'],
      { from: 'user' }
    );

    const command = mockedExecSync.mock.calls[0][0] as string;
    // --max-time is a first-class option; -sL is forwarded.
    expect(command).toContain('--max-time 25');
    expect(command).toContain('-sL');
    expect(command).toContain('"https://example.com"');
  });

  it('forwards an unknown long flag with its value in order', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ['--retry', '3', 'https://example.com'],
      { from: 'user' }
    );

    const command = mockedExecSync.mock.calls[0][0] as string;
    // Flag and value stay together and in order.
    expect(command).toMatch(/--retry'?\s+'?3/);
    expect(command).toContain('"https://example.com"');
  });

  it('does not let a passthrough token break out of curl argv', async () => {
    const program = loadProgram();
    await program.parseAsync(
      ["--evil=$(rm -rf /)", 'https://example.com'],
      { from: 'user' }
    );

    const command = mockedExecSync.mock.calls[0][0] as string;
    // The dangerous token is single-quoted so the shell cannot interpret it.
    expect(command).toContain(`'--evil=$(rm -rf /)'`);
  });

  it('keeps existing first-class option handling unchanged', async () => {
    const program = loadProgram();
    await program.parseAsync(
      [
        '-H', 'Accept: application/json',
        '-X', 'POST',
        '-d', '{"a":1}',
        '--json',
        '-o', 'out.html',
        'https://example.com',
      ],
      { from: 'user' }
    );

    const command = mockedExecSync.mock.calls[0][0] as string;
    expect(command).toContain('-H "Accept: application/json"');
    expect(command).toContain('-X POST');
    expect(command).toContain('-d "{"a":1}"');
    expect(command).toContain('-H "Content-Type: application/json"');
    expect(command).toContain('-o out.html');
    expect(command).toContain('"https://example.com"');
  });
});
