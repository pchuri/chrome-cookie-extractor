import { IOStreams } from './iostreams';
import { ChromeCookieExtractor } from './extractor';

export class Factory {
  private _ioStreams: IOStreams | null = null;
  private _extractor: ChromeCookieExtractor | null = null;

  getIOStreams(): IOStreams {
    if (!this._ioStreams) {
      this._ioStreams = new IOStreams();
    }
    return this._ioStreams;
  }

  getExtractor(): ChromeCookieExtractor {
    if (!this._extractor) {
      this._extractor = new ChromeCookieExtractor();
    }
    return this._extractor;
  }

  canPrompt(): boolean {
    return this.getIOStreams().canPrompt();
  }
}