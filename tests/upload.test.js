const { OSFtp } = require('../dist');
const fsExtra = require('fs-extra');
const { Ofn } = require('oro-functions');
const { FTPCONFIG_DEFAULT } = require('./utils');

//

const FTP_FOLDER = 'test-upload';

beforeAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.mkdir(`${FTP_FOLDER}/test`, true);
  await ftpClient.disconnect();
});

afterAll(async () => {
  const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);
  await ftpClient.connect();
  await ftpClient.rmdir(FTP_FOLDER, true);
  await ftpClient.delete('zsilence.pdf');
  await ftpClient.disconnect();
});

//

describe('upload OSFtp', () => {
  test('upload and no connected', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    const response = await ftpClient.upload(
      `${__dirname}/zsilence.pdf`,
      `${FTP_FOLDER}/silence.pdf`,
    );

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('UNCONNECTED');
    expect(response.error.msg).toBe(
      'SFTP Upload failed: FtpConnectionError: connection status is not yet connected.',
    );
  });

  test('upload bad file-from name', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.upload(
      `${__dirname}/zpthon.pdf`,
      `${FTP_FOLDER}/silence-copy.pdf`,
    );

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe('SFTP Upload failed: File (From) to upload not exist.');
  });

  test('upload bad folder-to name', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const response = await ftpClient.upload(
      `${__dirname}/zsilence.pdf`,
      `${FTP_FOLDER}/chacho/silence-copy.pdf`,
    );

    expect(response.status).toBe(false);
    if (response.status === true) {
      return;
    }

    expect(response.error.code).toBe('ENOTFOUND');
    expect(response.error.msg).toBe(
      `SFTP Upload failed: No such file ${FTP_FOLDER}/chacho/silence-copy.pdf.`,
    );
  });

  test('upload simple one param', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const responseUpload = await ftpClient.upload(`${__dirname}/zsilence.pdf`);
    const responseList = await ftpClient.list();
    await ftpClient.disconnect();

    expect(responseUpload.status).toBe(true);
    if (responseUpload.status === false) {
      return;
    }

    expect(responseUpload.filename).toBe('zsilence.pdf');
    expect(responseUpload.filepath).toBe('zsilence.pdf');

    expect(responseList.status).toBe(true);
    if (responseList.status === false) {
      return;
    }

    const names = Ofn.arrayValuesByKey(responseList.list, 'name');
    expect(names.includes('zsilence.pdf')).toBe(true);
  });

  test('upload absolute', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const responseUpload = await ftpClient.upload(
      `${__dirname}/zsilence.pdf`,
      `${FTP_FOLDER}/silence-copy.pdf`,
    );
    const responseList = await ftpClient.list(`${FTP_FOLDER}/`);
    await ftpClient.disconnect();

    expect(responseUpload.status).toBe(true);
    if (responseUpload.status === false) {
      return;
    }

    expect(responseUpload.filename).toBe('silence-copy.pdf');
    expect(responseUpload.filepath).toBe(`${FTP_FOLDER}/silence-copy.pdf`);

    expect(responseList.status).toBe(true);
    if (responseList.status === false) {
      return;
    }

    const names = Ofn.arrayValuesByKey(responseList.list, 'name');
    expect(names.includes('silence-copy.pdf')).toBe(true);
  });

  test('upload to folder', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await ftpClient.connect();
    const responseUpload = await ftpClient.upload(
      `${__dirname}/zsilence.pdf`,
      `${FTP_FOLDER}/test/silence-cc.pdf`,
    );
    const responseList = await ftpClient.list(`${FTP_FOLDER}/test`);
    await ftpClient.disconnect();

    expect(responseUpload.status).toBe(true);
    if (responseUpload.status === false) {
      return;
    }

    expect(responseUpload.filename).toBe('silence-cc.pdf');
    expect(responseUpload.filepath).toBe(`${FTP_FOLDER}/test/silence-cc.pdf`);

    expect(responseList.status).toBe(true);
    if (responseList.status === false) {
      return;
    }

    expect(responseList.count).toBe(1);
    expect(responseList.list[0].name).toBe('silence-cc.pdf');
    expect(responseList.list[0].path).toBe(`${FTP_FOLDER}/test/silence-cc.pdf`);
  });

  test('upload relative', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    await fsExtra.copy(`${__dirname}/zsilence2.pdf`, `../silence2.pdf`);

    await ftpClient.connect();
    const responseUpload = await ftpClient.upload(`../silence2.pdf`, `${FTP_FOLDER}/silence2.pdf`);
    const responseList = await ftpClient.list(`${FTP_FOLDER}/`);
    await ftpClient.disconnect();

    await fsExtra.remove(`../silence2.pdf`);

    expect(responseUpload.status).toBe(true);
    if (responseUpload.status === false) {
      return;
    }

    expect(responseUpload.filename).toBe('silence2.pdf');
    expect(responseUpload.filepath).toBe(`${FTP_FOLDER}/silence2.pdf`);

    expect(responseList.status).toBe(true);
    if (responseList.status === false) {
      return;
    }

    const names = Ofn.arrayValuesByKey(responseList.list, 'name');
    expect(names.includes('silence2.pdf')).toBe(true);
  });

  test('upload one', async () => {
    const ftpClient = new OSFtp(FTPCONFIG_DEFAULT);

    const response = await ftpClient.uploadOne(
      `${__dirname}/zsilence.pdf`,
      `${FTP_FOLDER}/silence-one.pdf`,
    );

    expect(response.status).toBe(true);
    if (response.status === false) {
      return;
    }

    expect(response.filename).toBe('silence-one.pdf');
    expect(response.filepath).toBe(`${FTP_FOLDER}/silence-one.pdf`);
  });
});

//endregion
