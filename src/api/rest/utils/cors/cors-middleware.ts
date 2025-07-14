import cors, { CorsOptions } from 'cors';
import { Express } from 'express';
import { availableDomains } from 'src/common/domain-list';

const allowedHostnames = availableDomains
  .filter((domain) => domain.corsEnabled)
  .map((domain) => domain.hostname);

const serviceHostname = process.env['SERVICE_HOSTNAME'];
if (serviceHostname) {
  allowedHostnames.push(serviceHostname);
}

export function isAllowedCorsOrigin(args: {
  origin: string | undefined;
  allowedHostnames: Array<string>;
}) {
  // Allow requests with no origin (like mobile apps or curl requests)
  if (!args.origin) {
    return true;
  }

  // For websites, only allow requests from whitelisted domains
  const hostname = new URL(args.origin).hostname;
  return args.allowedHostnames.some((domain) => {
    return (
      hostname === domain || // Exact match
      hostname.endsWith(`.${domain}`) // Subdomain match
    );
  });
}

function getCorsOptions(): CorsOptions {
  if (process.env['USE_CORS'] === 'true') {
    return {
      origin: (origin, callback) => {
        if (isAllowedCorsOrigin({ origin, allowedHostnames })) {
          callback(null, true);
        } else {
          callback(new Error(`Domain not allowed by CORS: ${origin}`));
        }
      },
      credentials: true,
    };
  } else {
    return {};
  }
}

export function useCorsMiddleware(app: Express) {
  app.use(cors(getCorsOptions()));
}
