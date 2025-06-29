export interface Cookie {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  secure: boolean;
  httponly: boolean;
  creationTime: number;
}

export interface ChromeProfile {
  name: string;
  path: string;
  cookiesPath: string;
}

export interface ExtractorOptions {
  domain?: string;
  profiles?: string[];
  includeEncrypted?: boolean;
}

export interface OutputOptions {
  format: 'netscape' | 'curl' | 'json';
  outputPath?: string;
}

export enum Platform {
  DARWIN = 'darwin',
  WIN32 = 'win32',
  LINUX = 'linux'
}
