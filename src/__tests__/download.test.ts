import fsExtra from 'fs-extra';
import Ofn from 'oro-functions';

import OSFtp from '../OSftp';
import { DIRNAME, FTPCONFIG_DEFAULT } from './_consts.mocks';

//

const FTP_FOLDER = 'test-download-ts';

beforeAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.mkdir(`${FTP_FOLDER}/test`, true);
  await ftpClient.upload(`${DIRNAME}/zsilence2.pdf`, `${FTP_FOLDER}/silence2.pdf`);
  await ftpClient.upload(`${DIRNAME}/zsilence2.pdf`, `${FTP_FOLDER}/silence2-ts.pdf`);
  await ftpClient.upload(`${DIRNAME}/zsilence2.pdf`, `${FTP_FOLDER}/test/silence2-copy.pdf`);
  await ftpClient.disconnect();
});

afterAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.disconnect();
});

//

describe('download OSFtp', () => {
  test('download without conection-config', async () => {
    const ftpClient = new OSFtp();

    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`, `${DIRNAME}/zsilence-copy-ts.pdf`);

    expect(response.status).toBe(false);
    if (response.status) {
      return;
    }

    expect(response.error.code).toBe('UNCONNECTED');
    expect(response.error.msg).toBe('SFTP Download failed: config is empty.');
  });

  test('download and no connected', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`, `${DIRNAME}/zsilence-copy-ts.pdf`);

    expect(response.status).toBe(false);
    if (response.status) {
      return;
    }

    expect(response.error.code).toBe('UNCONNECTED');
    expect(response.error.msg).toBe(
      'SFTP Download failed: FtpConnectionError: connection status is not yet connected.',
    );
  });

  test('download bad file-from name', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/pthon2.pdf`, `${DIRNAME}/zsilence-copy-ts.pdf`);

    expect(response.status).toBe(false);
    if (response.status) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe(`SFTP Download failed: No such file ${FTP_FOLDER}/pthon2.pdf.`);
  });

  test('download bad folder-to name', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`, `${DIRNAME}/chacho/zsilence-copy-ts.pdf`);

    expect(response.status).toBe(false);
    if (response.status) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe('SFTP Download failed: Folder (From) to download not exist.');
  });

  test('download simple one param', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/silence2-ts.pdf`);
    await ftpClient.disconnect();

    const existsFile = await fsExtra.exists(`${process.cwd()}/silence2-ts.pdf`);
    if (existsFile) {
      await fsExtra.remove(`silence2-ts.pdf`);
    }

    expect(response.status).toBe(true);
    if (!response.status) {
      return;
    }

    expect(response.filename).toBe('silence2-ts.pdf');
    expect(response.filepath).toBe(Ofn.sanitizePath(`${process.cwd()}/silence2-ts.pdf`));
    expect(existsFile).toBe(true);
  });

  test('download absolute', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`, `${DIRNAME}/zsilence-copy-ts.pdf`);
    await ftpClient.disconnect();

    const existsFile = await fsExtra.exists(`${DIRNAME}/zsilence-copy-ts.pdf`);
    if (existsFile) {
      await fsExtra.remove(`${DIRNAME}/zsilence-copy-ts.pdf`);
    }

    expect(response.status).toBe(true);
    if (!response.status) {
      return;
    }

    expect(response.filename).toBe('zsilence-copy-ts.pdf');
    expect(response.filepath).toBe(Ofn.sanitizePath(`${DIRNAME}/zsilence-copy-ts.pdf`));
    expect(existsFile).toBe(true);
  });

  test('download relative', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`, `../zsilence2-copy-ts.pdf`);
    await ftpClient.disconnect();

    const existsFile = await fsExtra.exists(`../zsilence2-copy-ts.pdf`);
    if (existsFile) {
      await fsExtra.remove(`../zsilence2-copy-ts.pdf`);
    }

    expect(response.status).toBe(true);
    if (!response.status) {
      return;
    }

    expect(response.filename).toBe('zsilence2-copy-ts.pdf');
    expect(response.filepath).toBe(Ofn.sanitizePath(`${Ofn.getFolderByPath(process.cwd())}/zsilence2-copy-ts.pdf`));
    expect(existsFile).toBe(true);
  });
});
