const { OSFtp } = require('../dist');
const fsExtra = require('fs-extra');
const { Ofn } = require('oro-functions');
const { FTPCONFIG_DEFAULT } = require('./utils');

//

const FTP_FOLDER = 'test-download';

beforeAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.mkdir(`${FTP_FOLDER}/test`, true);
  await ftpClient.upload(`${__dirname}/zsilence2.pdf`, `${FTP_FOLDER}/silence2.pdf`);
  await ftpClient.upload(`${__dirname}/zsilence2.pdf`, `${FTP_FOLDER}/test/silence2-copy.pdf`);
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
  test('download and no connected', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    const response = await ftpClient.download(
      `${FTP_FOLDER}/silence2.pdf`,
      `${__dirname}/zsilence-copy.pdf`,
    );

    expect(response.status).toBe(false);
    if (response.status === true) {
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
    const response = await ftpClient.download(
      `${FTP_FOLDER}/pthon2.pdf`,
      `${__dirname}/zsilence-copy.pdf`,
    );

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe(`SFTP Download failed: No such file ${FTP_FOLDER}/pthon2.pdf.`);
  });

  test('download bad folder-to name', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(
      `${FTP_FOLDER}/silence2.pdf`,
      `${__dirname}/chacho/zsilence-copy.pdf`,
    );

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe('SFTP Download failed: Folder (From) to download not exist.');
  });

  test('download simple one param', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`);
    await ftpClient.disconnect();

    const existsFile = await fsExtra.exists(`${process.cwd()}/silence2.pdf`);
    if (existsFile) {
      await fsExtra.remove(`silence2.pdf`);
    }

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.filename).toBe('silence2.pdf');
    expect(response.filepath).toBe(Ofn.sanitizePath(`${process.cwd()}/silence2.pdf`));
    expect(existsFile).toBe(true);
  });

  test('download absolute', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(
      `${FTP_FOLDER}/silence2.pdf`,
      `${__dirname}/zsilence-copy.pdf`,
    );
    await ftpClient.disconnect();

    const existsFile = await fsExtra.exists(`${__dirname}/zsilence-copy.pdf`);
    if (existsFile) {
      await fsExtra.remove(`${__dirname}/zsilence-copy.pdf`);
    }

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.filename).toBe('zsilence-copy.pdf');
    expect(response.filepath).toBe(Ofn.sanitizePath(`${__dirname}/zsilence-copy.pdf`));
    expect(existsFile).toBe(true);
  });

  test('download relative', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.download(`${FTP_FOLDER}/silence2.pdf`, `../silence2-copy.pdf`);
    await ftpClient.disconnect();

    const existsFile = await fsExtra.exists(`../silence2-copy.pdf`);
    if (existsFile) {
      await fsExtra.remove(`../silence2-copy.pdf`);
    }

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.filename).toBe('silence2-copy.pdf');
    expect(response.filepath).toBe(
      Ofn.sanitizePath(`${Ofn.getFolderByPath(process.cwd())}/silence2-copy.pdf`),
    );
    expect(existsFile).toBe(true);
  });
});

//endregion
