import { Factory } from '../src/factory';
import { IOStreams } from '../src/iostreams';
import { ChromeCookieExtractor } from '../src/extractor';

jest.mock('../src/iostreams');
jest.mock('../src/extractor');

describe('Factory', () => {
  beforeEach(() => {
    (IOStreams as jest.MockedClass<typeof IOStreams>).mockClear();
    (ChromeCookieExtractor as jest.MockedClass<typeof ChromeCookieExtractor>).mockClear();
    (IOStreams as jest.MockedClass<typeof IOStreams>).prototype.canPrompt.mockReturnValue(true);
  });

  it('reuses singleton instances', () => {
    const factory = new Factory();
    const a = factory.getIOStreams();
    const b = factory.getIOStreams();
    expect(a).toBe(b);
    expect(IOStreams).toHaveBeenCalledTimes(1);

    const x = factory.getExtractor();
    const y = factory.getExtractor();
    expect(x).toBe(y);
    expect(ChromeCookieExtractor).toHaveBeenCalledTimes(1);
  });

  it('canPrompt delegates to IOStreams', () => {
    const factory = new Factory();
    const result = factory.canPrompt();
    expect(result).toBe(true);
    expect(IOStreams.prototype.canPrompt).toHaveBeenCalled();
  });
});
