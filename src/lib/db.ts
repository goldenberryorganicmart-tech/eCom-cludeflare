import mongoose from 'mongoose';
import dns from 'dns';

const MONGODB_URI = process.env.MONGODB_URI?.trim();

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

const DNS_SERVERS = ['8.8.8.8', '8.8.4.4'];

try {
  dns.setServers(DNS_SERVERS);
} catch (err) {
  console.warn('Failed to set custom DNS servers:', err);
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cached = (global as any).mongoose;

if (!cached) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cached = (global as any).mongoose = { conn: null, promise: null };
}

// Custom lookup function using the main dns module (which uses custom servers set above)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const customLookup = (hostname: string, options: any, callback: any) => {
  if (typeof options === 'function') {
    callback = options;
    options = {};
  }

  dns.resolve4(hostname, (err, addresses) => {
    if (err || !addresses || addresses.length === 0) {
      dns.resolve6(hostname, (err6, addresses6) => {
        if (err6 || !addresses6 || addresses6.length === 0) {
          dns.lookup(hostname, options, callback);
        } else {
          if (options.all) {
            callback(null, addresses6.map(addr => ({ address: addr, family: 6 })));
          } else {
            callback(null, addresses6[0], 6);
          }
        }
      });
      return;
    }

    if (options.all) {
      callback(null, addresses.map(addr => ({ address: addr, family: 4 })));
    } else {
      callback(null, addresses[0], 4);
    }
  });
};

const isSrvProtocol = (uri: string) => uri.startsWith('mongodb+srv://');
const shouldFallbackFromError = (error: any) => {
  if (!error) return false;
  if (error.code === 'ECONNREFUSED' && error.syscall === 'querySrv') {
    return true;
  }
  if (typeof error.message === 'string' && error.message.includes('querySrv')) {
    return true;
  }
  return false;
};

const encodeAuth = (username: string, password: string) => {
  if (!username) return '';
  const encodedUser = encodeURIComponent(username);
  const encodedPass = password ? `:${encodeURIComponent(password)}` : '';
  return `${encodedUser}${encodedPass}@`;
};

const parseTxtOptions = (records: string[][]) => {
  const options = new Map<string, string>();
  records.flat().forEach((record) => {
    record.split('&').forEach((pair) => {
      const [key, value] = pair.split('=').map((part) => part.trim());
      if (key && value !== undefined) {
        options.set(key, value);
      }
    });
  });
  return options;
};

const buildExplicitMongoUri = async (uri: string) => {
  const parsed = new URL(uri);
  const host = parsed.hostname;
  const auth = encodeAuth(parsed.username, parsed.password);
  const database = parsed.pathname || '';
  const searchParams = new URLSearchParams(parsed.searchParams);

  // Ensure explicit connections use TLS if the original URI was SRV.
  if (!searchParams.has('tls') && !searchParams.has('ssl')) {
    searchParams.set('tls', 'true');
  }

  const explicitHosts: string[] = [];

  try {
    const addresses4 = await dns.promises.resolve4(host);
    addresses4.forEach((address) => explicitHosts.push(`${address}:27017`));
  } catch {
    // ignore; fallback to IPv6 or hostname resolution
  }

  try {
    const addresses6 = await dns.promises.resolve6(host);
    addresses6.forEach((address) => explicitHosts.push(`[${address}]:27017`));
  } catch {
    // ignore; we may still have IPv4 results
  }

  if (explicitHosts.length === 0) {
    const lookupRecords = await dns.promises.lookup(host, { all: true });
    lookupRecords.forEach((record) => {
      const address = record.family === 6 ? `[${record.address}]` : record.address;
      explicitHosts.push(`${address}:27017`);
    });
  }

  if (explicitHosts.length === 0) {
    throw new Error(`Unable to resolve explicit hosts for MongoDB SRV host: ${host}`);
  }

  const txtRecords = await dns.promises.resolveTxt(host).catch(() => []);
  const txtOptions = parseTxtOptions(txtRecords as string[][]);
  for (const [key, value] of txtOptions.entries()) {
    if (!searchParams.has(key)) {
      searchParams.set(key, value);
    }
  }

  return `mongodb://${auth}${explicitHosts.join(',')}${database}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
};

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      lookup: customLookup,
    };

    cached.promise = mongoose.connect(MONGODB_URI as string, opts).catch(async (error) => {
      if (isSrvProtocol(MONGODB_URI as string) && shouldFallbackFromError(error)) {
        console.warn('MongoDB SRV lookup failed; attempting explicit host fallback.');

        const explicitUri = await buildExplicitMongoUri(MONGODB_URI as string);
        return mongoose.connect(explicitUri, opts);
      }

      throw error;
    }).then((mongoose) => {
      console.log('Successfully connected to MongoDB.');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;


