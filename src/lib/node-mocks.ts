// Mock implementation of Node.js core modules for Webpack Edge runtime packaging
export class Socket {}
export class TLSSocket extends Socket {}
export class Readable {
  on() { return this; }
  once() { return this; }
  pipe() { return this; }
}
export class Writable {
  write() {}
  end() {}
}
export class Duplex {}
export class Transform {}
export class PassThrough {}

// DNS Mocks
export const resolveCname = (name: any, callback: any) => callback && callback(null, []);
export const resolveSrv = (name: any, callback: any) => callback && callback(null, []);
export const resolveTxt = (name: any, callback: any) => callback && callback(null, []);
export const lookup = (hostname: any, options: any, callback: any) => {
  const cb = typeof options === 'function' ? options : callback;
  if (cb) cb(null, '127.0.0.1', 4);
};

// FS Mocks
export const readFileSync = () => '';
export const existsSync = () => false;
export const promises = {
  readFile: async () => '',
  stat: async () => ({}),
};

const nodeMocks = {
  Socket,
  TLSSocket,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  connect: () => new Socket(),
  createServer: () => ({}),
  resolveCname,
  resolveSrv,
  resolveTxt,
  lookup,
  readFileSync,
  existsSync,
  promises,
};

export default nodeMocks;

