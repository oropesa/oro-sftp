const { OSFtp } = require('../dist');
const { FTPCONFIG_DEFAULT } = require('./utils');

//

const FTP_FOLDER = 'test-rmdir';

beforeAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.mkdir(`${FTP_FOLDER}/chacho`, true);
  await ftpClient.upload(`${__dirname}/zsilence2.pdf`, `${FTP_FOLDER}/chacho/silence2.pdf`);
  await ftpClient.mkdir(`${FTP_FOLDER}/test`, true);
  await ftpClient.mkdir(`${FTP_FOLDER}/foo/bar/baz`, true);
  await ftpClient.disconnect();
});

afterAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.disconnect();
});

//

describe('rmdir OSFtp', () => {
  test('rmdir and no connected', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    const response = await ftpClient.rmdir(`${FTP_FOLDER}/chacho`);

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('UNCONNECTED');
    expect(response.error.msg).toBe(
      'SFTP Rmdir failed: FtpConnectionError: connection status is not yet connected.',
    );
  });

  test('rmdir folder null', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.rmdir(null);

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.msg).toBe('SFTP Rmdir failed: param folder is required.');
  });

  test('rmdir folder not exist', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.rmdir(`${FTP_FOLDER}/loco`);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.msg).toBe('Folder not found.');
    expect(response.foldername).toBe('loco');
    expect(response.folderpath).toBe(`${FTP_FOLDER}/loco`);
  });

  test('rmdir folder not exist strict', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.rmdir(`${FTP_FOLDER}/loco`, true, true);
    await ftpClient.disconnect();

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe(
      `SFTP Rmdir failed: Bad Path: ${FTP_FOLDER}/loco: No such directory.`,
    );
  });

  test('rmdir folder with content', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.rmdir(`${FTP_FOLDER}/chacho`);
    await ftpClient.disconnect();

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTEMPTY');
    expect(response.error.msg).toBe(`SFTP Rmdir failed: Failure ${FTP_FOLDER}/chacho.`);
  });

  test('rmdir folder', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.rmdir(`${FTP_FOLDER}/test`);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.foldername).toBe('test');
    expect(response.folderpath).toBe(`${FTP_FOLDER}/test`);
  });

  test('rmdir folder in folder', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.rmdir(`${FTP_FOLDER}/foo/bar/baz`);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.foldername).toBe('baz');
    expect(response.folderpath).toBe(`${FTP_FOLDER}/foo/bar/baz`);
  });
});
