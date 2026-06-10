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

// HTTP2 Mock (required by @grpc/grpc-js which is a dependency of @google-analytics/data)
// The analytics route uses transport: 'rest' so gRPC code paths are never actually executed,
// but the module must exist for webpack to compile the edge bundle.
export class Http2Session {
  on() { return this; }
  once() { return this; }
  destroy() {}
}
export class ClientHttp2Session extends Http2Session {}
export class ServerHttp2Session extends Http2Session {}
export class Http2Stream {}
export const connect = () => new ClientHttp2Session();
export const createServer = () => ({ listen: () => {}, close: () => {} });
export const createSecureServer = () => ({ listen: () => {}, close: () => {} });
export const constants = {
  HTTP2_HEADER_STATUS: ':status',
  HTTP2_HEADER_METHOD: ':method',
  HTTP2_HEADER_PATH: ':path',
  HTTP2_HEADER_SCHEME: ':scheme',
  HTTP2_HEADER_AUTHORITY: ':authority',
  HTTP2_HEADER_CONTENT_TYPE: 'content-type',
  HTTP2_METHOD_GET: 'GET',
  HTTP2_METHOD_POST: 'POST',
  NGHTTP2_NO_ERROR: 0,
};

const nodeMocks = {
  Socket,
  TLSSocket,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
  connect,
  createServer,
  resolveCname,
  resolveSrv,
  resolveTxt,
  lookup,
  readFileSync,
  existsSync,
  promises,
  Http2Session,
  ClientHttp2Session,
  ServerHttp2Session,
  Http2Stream,
  createSecureServer,
  constants,
};

export default nodeMocks;
