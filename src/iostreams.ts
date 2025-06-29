export class IOStreams {
  private _stdin = process.stdin;
  private _stdout = process.stdout;
  private _stderr = process.stderr;

  get stdin() {
    return this._stdin;
  }

  get stdout() {
    return this._stdout;
  }

  get stderr() {
    return this._stderr;
  }

  canPrompt(): boolean {
    return this.stdin.isTTY && this.stdout.isTTY;
  }

  print(message: string) {
    this.stdout.write(message + '\n');
  }

  printError(message: string) {
    this.stderr.write(`Error: ${message}\n`);
  }

  printWarning(message: string) {
    this.stderr.write(`Warning: ${message}\n`);
  }

  printSuccess(message: string) {
    this.stdout.write(`✅ ${message}\n`);
  }

  printInfo(message: string) {
    this.stdout.write(`ℹ️ ${message}\n`);
  }
}