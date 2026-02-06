// Generic no-op function
const noop = () => {};
const asyncNoop = async () => {};

// fs/promises
export const readFile = async () => '';
export const writeFile = async () => {};
export const readdir = async () => [];
export const mkdir = async () => {};
export const stat = async () => ({ isDirectory: () => false, isFile: () => true, size: 0 });
export const access = async () => {};
export const open = async () => ({ close: async () => {}, write: async () => {} });
export const appendFile = async () => {};
export const rm = async () => {};

// fs (sync)
export const readFileSync = () => '';
export const writeFileSync = () => {};
export const existsSync = () => false;
export const createReadStream = () => ({ on: noop, pipe: noop });
export const createWriteStream = () => ({ on: noop, write: noop, end: noop });
export const constants = {};
export const accessSync = () => {};

// path
export const join = (...args) => args.join('/');
export const resolve = (...args) => args.join('/');
export const dirname = () => '';
export const basename = () => '';
export const extname = () => '';

// os
export const platform = () => 'browser';
export const homedir = () => '/';
export const tmpdir = () => '/tmp';

// crypto
export const createHash = () => ({ update: () => ({ digest: () => '' }) });
export const randomBytes = () => new Uint8Array(16);

// readline
export const createInterface = () => ({ on: noop, close: noop });

// timers/promises
export const setTimeout = globalThis.setTimeout;

// buffer
export const Buffer = {
  from: (data) => new Uint8Array(data),
  isBuffer: () => false,
  concat: () => new Uint8Array(0),
};

// events
export class EventEmitter {
    on() {}
    emit() {}
    removeListener() {}
}

// Default export combining everything
export default {
  readFile, writeFile, readdir, mkdir, stat, access, open, appendFile, rm,
  readFileSync, writeFileSync, existsSync, createReadStream, createWriteStream, constants, accessSync,
  join, resolve, dirname, basename, extname,
  platform, homedir, tmpdir,
  createHash, randomBytes,
  createInterface,
  setTimeout,
  Buffer,
  EventEmitter
};

// Additional crypto
export const randomUUID = () => '00000000-0000-0000-0000-000000000000';
export const createHmac = () => ({ update: () => ({ digest: () => '' }) });
export const timingSafeEqual = () => true;

// Re-export in default if needed, but named exports are key for 'import { x } from ...'
