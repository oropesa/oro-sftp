import type { OSFtpConfig } from '../dist';
import Ofn from 'oro-functions';

// eslint-disable-next-line unicorn/prefer-module
export const DIRNAME = __dirname;

export const FTPCONFIG_BAD: OSFtpConfig = {
  host: 'http://ftp-fake.oropensando.com',
  port: 22,
  user: 'chacho',
  password: 'loco',
} as const;

export const FTPCONFIG_DEFAULT: OSFtpConfig = Ofn.getFileJsonRecursivelySync<OSFtpConfig>(
  `${DIRNAME}/config.json`,
);
