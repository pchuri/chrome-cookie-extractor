import { IOStreams } from '../src/iostreams';
import { Writable } from 'stream';

describe('IOStreams', () => {
  let stdoutData = '';
  let stderrData = '';
  const stdout = new Writable({
    write(chunk, _enc, cb) {
      stdoutData += chunk.toString();
      cb();
    }
  }) as any;
  const stderr = new Writable({
    write(chunk, _enc, cb) {
      stderrData += chunk.toString();
      cb();
    }
  }) as any;
  const stdin: any = { isTTY: true };
  stdout.isTTY = true;

  let streams: IOStreams;

  beforeEach(() => {
    stdoutData = '';
    stderrData = '';
    streams = new IOStreams();
    (streams as any)._stdin = stdin;
    (streams as any)._stdout = stdout;
    (streams as any)._stderr = stderr;
  });

  it('canPrompt returns true when tty', () => {
    expect(streams.canPrompt()).toBe(true);
  });

  it('print helpers output to streams', () => {
    streams.print('hello');
    streams.printError('bad');
    streams.printWarning('warn');
    streams.printSuccess('yay');
    streams.printInfo('info');

    expect(stdoutData).toContain('hello\n');
    expect(stderrData).toContain('Error: bad\n');
    expect(stderrData).toContain('Warning: warn\n');
    expect(stdoutData).toContain('✅ yay\n');
    expect(stdoutData).toContain('ℹ️ info\n');
  });
});
