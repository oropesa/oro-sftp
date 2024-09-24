import Ofn from 'oro-functions';

import OSFtp from '../OSftp';
import type { OSFtpConfig } from '../OSftp.types';
import { FTPCONFIG_BAD, FTPCONFIG_DEFAULT } from './_consts.mocks';

//

describe('SOFTP Connection', () => {
  describe('getClient OSFtp', () => {
    test('client is SftpClient', async () => {
      const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

      const clientFTP = ftpClient.getClient();
      expect(Ofn.type(clientFTP, true)).toBe('SftpClient');
    });
  });

  describe('init OSFtp (wrong)', () => {
    test('new OSFtp( undefined )', async () => {
      const ftpClient = new OSFtp();

      const connected = await ftpClient.connect();

      expect(connected.status).toBe(false);
      if (connected.status) {
        return;
      }

      expect(connected.tryAgain).toBe(false);
      expect(connected.error.code).toBe('UNCONNECTED');
      expect(connected.error.msg).toBe('SFTP Connect failed: config is empty.');
    });

    test('new OSFtp( bad-config )', async () => {
      const ftpClient = new OSFtp(FTPCONFIG_BAD);

      const connected = await ftpClient.connect();

      expect(connected.status).toBe(false);
      if (connected.status) {
        return;
      }

      expect(connected.tryAgain).toBe(true);
      expect(connected.error.code).toMatch(/^(ECONNREFUSED|ENOTFOUND)$/);
      expect(connected.error.msg).toMatch(
        /^SFTP Connect failed: (Remote host refused connection|Address lookup failed for host).$/,
      );
    });

    test('new OSFtp( timeout-config )', async () => {
      const customConfig = { readyTimeout: 1, ...FTPCONFIG_DEFAULT };
      const ftpClient = new OSFtp(customConfig);

      const connected = await ftpClient.connect();

      expect(connected.status).toBe(false);
      if (connected.status) {
        return;
      }

      expect(connected.tryAgain).toBe(true);
      expect(connected.error.code).toBe('ENTIMEOUT');
      expect(connected.error.msg).toBe(`SFTP Connect failed: getConnection: Timed out while waiting for handshake.`);
    });
  });

  describe('init OSFtp (good)', () => {
    test('new OSFtp( config )', async () => {
      const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

      const connected = await ftpClient.connect();
      const disconnected = await ftpClient.disconnect();

      expect(connected.status).toBe(true);
      expect(disconnected.status).toBe(true);
    });

    test('new OSFtp() and config in connect', async () => {
      const ftpClient = new OSFtp();

      const connected = await ftpClient.connect(FTPCONFIG_DEFAULT);
      const disconnected = await ftpClient.disconnect();

      expect(connected.status).toBe(true);
      expect(disconnected.status).toBe(true);
    });

    test('init and auto-disconnect', async () => {
      const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

      const connected = await ftpClient.connect();
      await ftpClient.rmdir('connect2', false, true);
      const mkdir = await ftpClient.mkdir('connect2');

      expect(connected.status).toBe(true);
      expect(mkdir.status).toBe(false);
    });

    test('init and avoid auto-disconnect', async () => {
      const config: OSFtpConfig = Ofn.cloneObject(FTPCONFIG_DEFAULT);
      config.disconnectWhenError = false;

      const ftpClient = new OSFtp(config);

      const connected = await ftpClient.connect();
      await ftpClient.rmdir('connect1', false, true);
      const mkdir = await ftpClient.mkdir('connect1');
      await ftpClient.rmdir('connect1');
      await ftpClient.disconnect();

      expect(connected.status).toBe(true);
      expect(mkdir.status).toBe(true);
    });
  });
});
