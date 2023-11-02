const { OSFtp } = require('../dist');
const { FTPCONFIG_DEFAULT } = require('./utils');

//

const FTP_FOLDER = 'test-mkdir';

beforeAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.disconnect();
});

afterAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.disconnect();
});

//

describe('mkdir OSFtp', () => {
  test('mkdir and no connected', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    const response = await ftpClient.mkdir(FTP_FOLDER);

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('UNCONNECTED');
    expect(response.error.msg).toBe(
      'SFTP Mkdir failed: FtpConnectionError: connection status is not yet connected.',
    );
  });

  test('mkdir folder null', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(null);

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.msg).toBe('SFTP Mkdir failed: param folder is required.');
  });

  test('mkdir folder', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(FTP_FOLDER);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.foldername).toBe(FTP_FOLDER);
    expect(response.folderpath).toBe(FTP_FOLDER);
  });

  test('mkdir folder already exists', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(FTP_FOLDER);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.msg).toBe('Folder already exists.');
    expect(response.foldername).toBe(FTP_FOLDER);
    expect(response.folderpath).toBe(FTP_FOLDER);
  });

  test('mkdir folder already exists strict', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(FTP_FOLDER, true, true);

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.msg).toBe('SFTP Mkdir failed: Folder already exists.');
  });

  test('mkdir folder not recursive', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(`${FTP_FOLDER}/chacho/loco/tio`, false);

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe(
      `SFTP Mkdir failed: Bad path: ${FTP_FOLDER}/chacho/loco/tio parent not a directory or not exist.`,
    );
  });

  test('mkdir folder recursive', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(`${FTP_FOLDER}/chacho/loco/tio`);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.foldername).toBe('tio');
    expect(response.folderpath).toBe(`${FTP_FOLDER}/chacho/loco/tio`);
  });

  test('mkdir subfolder', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(`${FTP_FOLDER}/loco`);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.foldername).toBe('loco');
    expect(response.folderpath).toBe(`${FTP_FOLDER}/loco`);
  });

  test('mkdir subfolder dot', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.mkdir(`./${FTP_FOLDER}/tio`);
    await ftpClient.disconnect();

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.foldername).toBe('tio');
    expect(response.folderpath).toBe(`${FTP_FOLDER}/tio`);
  });
});
