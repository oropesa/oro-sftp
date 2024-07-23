import fsExtra from 'fs-extra';
import path from 'node:path';
import Ofn, { SResponseKOObjectSimple, type SResponseOKBasic } from 'oro-functions';
import SftpClient from 'ssh2-sftp-client';

import {
  OSFtpConfig,
  OSFtpConnectResponse,
  OSFtpDisconnectResponse,
  OSFtpErrorCode,
  OSFtpExistResponse,
  OSFtpFileResponse,
  OSFtpFolderResponse,
  OSFtpListFile,
  OSFtpListFileType,
  OSFtpListFilters,
  OSFtpListResponse,
  OSFtpUploadOneResponse,
} from './OSftp.types';

type SFTPError = Error & { code: number | string };

async function pathExists(path?: string) {
  return path
    ? await fsExtra
        .stat(path)
        .then(() => true)
        .catch(() => false)
    : false;
}

function getMsgAndCodeByError(error: SFTPError): { msg: string; code: OSFtpErrorCode } {
  let msg = error.toString().split('\r\n')[0].replace('Error: ', '');
  let code =
    error.code === 2
      ? 'ENOTFOUND'
      : error.code === 4
        ? 'ENOTEMPTY'
        : String(error.code) === 'ERR_BAD_PATH'
          ? 'ENOTFOUND'
          : (String(error.code) as OSFtpErrorCode);

  if (msg.includes('No SFTP connection available')) {
    msg = `FtpConnectionError: connection status is not yet connected`;
    code = 'UNCONNECTED';
  }

  return { msg, code };
}

//

export class OSFtp {
  readonly #ftpClient: SftpClient;

  #config?: OSFtpConfig;

  public constructor(config: OSFtpConfig = {}) {
    if (Ofn.objIsNotEmpty(config)) {
      this.#setFtpConfig(config);
    }

    this.#ftpClient = new SftpClient();
  }

  public getClient(): SftpClient {
    return this.#ftpClient;
  }

  public async connect(config: OSFtpConfig = {}): Promise<OSFtpConnectResponse> {
    if (Ofn.objIsNotEmpty(config)) {
      this.#setFtpConfig(config);
    }

    const exposedConfig = Ofn.cloneObject(this.#config);
    if (exposedConfig.password) {
      exposedConfig.password = Array.from({ length: exposedConfig.password.length }).fill('*').join('').substring(0, 5);
    }

    const checkResponse = this.#checkFtpConfig('Connect');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(
        checkResponse.error.msg,
        { code: checkResponse.error.code, config: exposedConfig },
        false,
      );
    }

    return this.#ftpClient
      .connect(this.#config!)
      .then((_data) => Ofn.setResponseOK())
      .catch((error: SFTPError) => {
        const { msg, code } = getMsgAndCodeByError(error);
        const message = msg.replace('connect: ', '');
        const sanitizeCode = msg.includes('Timed out while waiting for handshake')
          ? 'ENTIMEOUT'
          : (String(code) as OSFtpErrorCode);
        const tryAgain = msg !== 'Invalid username';

        return Ofn.setResponseKO(
          `SFTP Connect failed: ${message}.`,
          { code: sanitizeCode, config: exposedConfig },
          tryAgain,
        );
      });
  }

  public async upload(filepathFrom: string, filepathTo = ''): Promise<OSFtpFileResponse> {
    const filepathDestiny = filepathTo ? filepathTo : Ofn.getFilenameByPath(filepathFrom);
    const filepathOrigin = path.isAbsolute(filepathFrom) ? filepathFrom : path.resolve(filepathFrom);

    const checkResponse = this.#checkFtpConfig('Upload');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        filepathFrom: filepathOrigin,
        filepathTo: filepathDestiny,
        code: checkResponse.error.code,
      });
    }

    if (!(await pathExists(filepathOrigin))) {
      this.#config!.disconnectWhenError && (await this.disconnect());
      return Ofn.setResponseKO(`SFTP Upload failed: File (From) to upload not exist.`, {
        filepathFrom: filepathOrigin,
        filepathTo: filepathDestiny,
        code: 'ENOTFOUND',
      });
    }

    return await this.#ftpClient
      .put(filepathOrigin, filepathDestiny)
      .then(() => {
        return Ofn.setResponseOK({
          filename: Ofn.getFilenameByPath(filepathDestiny),
          filepath: filepathDestiny,
        });
      })
      .catch((error: SFTPError) => {
        this.#config!.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        const message = msg.replace('_put: ', '').replace('Write stream error: ', '');
        return Ofn.setResponseKO(`SFTP Upload failed: ${message}.`, {
          filepathFrom: filepathOrigin,
          filepathTo: filepathDestiny,
          code,
        });
      });
  }

  public async download(filepathFrom: string, filepathTo = ''): Promise<OSFtpFileResponse> {
    let filepathDestiny = filepathTo ? filepathTo : Ofn.getFilenameByPath(filepathFrom);
    if (!path.isAbsolute(filepathTo)) {
      filepathDestiny = path.resolve(filepathDestiny);
    }

    const checkResponse = this.#checkFtpConfig('Download');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        filepathFrom,
        filepathTo: filepathDestiny,
        code: checkResponse.error.code,
      });
    }

    if (!(await pathExists(Ofn.getFolderByPath(filepathDestiny)))) {
      this.#config!.disconnectWhenError && (await this.disconnect());
      return Ofn.setResponseKO(`SFTP Download failed: Folder (From) to download not exist.`, {
        filepathFrom,
        filepathTo: filepathDestiny,
        code: 'ENOTFOUND',
      });
    }

    return await this.#ftpClient
      .get(filepathFrom, filepathDestiny)
      .then(() => {
        return Ofn.setResponseOK({
          filename: Ofn.getFilenameByPath(filepathDestiny),
          filepath: Ofn.sanitizePath(filepathDestiny),
        });
      })
      .catch((error: SFTPError) => {
        this.#config!.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        const message = msg.replace('get: ', '');
        return Ofn.setResponseKO(`SFTP Download failed: ${message}.`, {
          filepathFrom,
          filepathTo: filepathDestiny,
          code,
        });
      });
  }

  public async list(folder = '', filters: OSFtpListFilters = {}): Promise<OSFtpListResponse> {
    const listFilter: OSFtpListFilters = {
      pattern: undefined,
      onlyFiles: false,
      onlyFolders: false,
      ...filters,
    };

    let listFolder = folder ? folder : '/';
    listFolder && listFolder[0] === '/' && (listFolder = `.${folder}`);
    listFolder && listFolder.slice(-1) !== '/' && (listFolder += '/');

    const folderPath = listFolder.indexOf('./') === 0 ? listFolder.slice(2) : listFolder;

    const checkResponse = this.#checkFtpConfig('List');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        folder: listFolder,
        filters: listFilter,
        code: checkResponse.error.code,
      });
    }

    return await this.#ftpClient
      .list(listFolder, listFilter.pattern)
      .then((data) => {
        const listMap = new Map<string, OSFtpListFile>();

        for (let index = 0, length = data.length; index < length; index++) {
          const element = data[index];

          switch (true) {
            case listFilter.onlyFiles && element.type !== '-':
            case listFilter.onlyFolders && element.type !== 'd':
              continue;
          }

          const file: OSFtpListFile = {
            path: `${folderPath}${element.name}`,
            name: element.name,
            longname: 'longname' in element ? (element.longname as string) : element.name,
            type: element.type as OSFtpListFileType,
            date: new Date(element.modifyTime),
            modifyDate: new Date(element.modifyTime),
            accessDate: new Date(element.accessTime),
            size: element.size,
            owner: String(element.owner),
            group: String(element.group),
            target: undefined,
            rights: element.rights,
          };

          // NOTE: fileKey to sort by "name"-"type"-"default order"
          const fileKey = `${file.name}-${element.type === '-' ? 'x' : element.type}-${Ofn.strPad(index, 8, '0')}`;

          listMap.set(fileKey, file);
        }

        const list = [...listMap.entries()].sort(([a], [b]) => String(a).localeCompare(b)).map(([_, file]) => file);
        return Ofn.setResponseOK({ count: list.length, list });
      })
      .catch((error: SFTPError) => {
        this.#config!.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP List failed: ${msg}.`, {
          folder: listFolder,
          filters: listFilter,
          code,
        });
      });
  }

  public async move(filepathFrom: string, filepathTo: string): Promise<OSFtpFileResponse> {
    const checkResponse = this.#checkFtpConfig('Move');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        filepathFrom,
        filepathTo,
        code: checkResponse.error.code,
      });
    }

    return await this.#ftpClient
      .rename(filepathFrom, filepathTo)
      .then(() => {
        return Ofn.setResponseOK({
          filename: Ofn.getFilenameByPath(filepathTo),
          filepath: filepathTo,
        });
      })
      .catch((error: SFTPError) => {
        this.#config!.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP Move failed: ${msg.replace('_rename: ', '')}.`, {
          filepathFrom,
          filepathTo,
          code,
        });
      });
  }

  public async delete(filepathFrom: string, strict = false): Promise<OSFtpFileResponse> {
    const checkResponse = this.#checkFtpConfig('Delete');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        filepathFrom,
        code: checkResponse.error.code,
      });
    }

    return await this.#ftpClient
      .delete(filepathFrom)
      .then(() => {
        return Ofn.setResponseOK('deleted successfully', {
          filepath: filepathFrom,
          filename: Ofn.getFilenameByPath(filepathFrom),
        });
      })
      .catch(async (error: SFTPError) => {
        let { msg, code } = getMsgAndCodeByError(error);

        if (!strict && /(delete: No such file)|(delete: Failure)/.test(msg)) {
          const exists = await this.exists(filepathFrom);
          if (!exists.status || exists.type !== 'd') {
            return Ofn.setResponseOK(`file not found`, {
              filepath: filepathFrom,
              filename: Ofn.getFilenameByPath(filepathFrom),
            });
          }

          const rmdir = await this.rmdir(filepathFrom, false, true);
          return rmdir.status
            ? Ofn.setResponseOK({
                msg: rmdir.msg,
                filepath: rmdir.folderpath,
                filename: rmdir.foldername,
              })
            : Ofn.setResponseKO(rmdir.error.msg.replace('Rmdir', 'Delete'), {
                filepathFrom: rmdir.error.folder,
                code: rmdir.error.code,
              });
        }

        this.#config!.disconnectWhenError && (await this.disconnect());

        if (msg === "TypeCannot read properties of undefined (reading 'unlink')") {
          msg = `FtpConnectionError: connection status is not yet connected`;
          code = 'UNCONNECTED';
        }

        const message = msg.replace('delete: ', '');
        return Ofn.setResponseKO(`SFTP Delete failed: ${message}.`, {
          filepathFrom,
          code,
        });
      });
  }

  public async exists(filepathFrom: string): Promise<OSFtpExistResponse> {
    const checkResponse = this.#checkFtpConfig('Exists');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        filepath: filepathFrom,
        filename: Ofn.getFilenameByPath(filepathFrom),
        code: checkResponse.error.code,
      });
    }

    return await this.#ftpClient
      .exists(filepathFrom)
      .then((data) => {
        return data
          ? Ofn.setResponseOK({
              type: data,
              filepath: filepathFrom,
              filename: Ofn.getFilenameByPath(filepathFrom),
            })
          : Ofn.setResponseKO(`File not exist`, {
              filepath: filepathFrom,
              filename: Ofn.getFilenameByPath(filepathFrom),
              code: 'ENOENT' as OSFtpErrorCode,
            });
      })
      .catch((error: SFTPError) => {
        this.#config!.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP Exists failed: ${msg}.`, {
          filepath: filepathFrom,
          filename: Ofn.getFilenameByPath(filepathFrom),
          code,
        });
      });
  }

  public async mkdir(folder: string, recursive = true, strict = false): Promise<OSFtpFolderResponse> {
    const checkResponse = this.#checkFtpConfig('Mkdir');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        folder,
        code: checkResponse.error.code,
      });
    }

    if (!folder) {
      this.#config!.disconnectWhenError && (await this.disconnect());
      return Ofn.setResponseKO(`SFTP Mkdir failed: param folder is required.`, { folder });
    }

    const dirFolder = folder[0] === '/' ? `.${folder}` : folder;
    const folderpath = dirFolder.indexOf('./') === 0 ? dirFolder.slice(2) : dirFolder;

    const exists = await this.exists(dirFolder);
    if (exists.status && exists.type === 'd') {
      if (strict) {
        this.#config!.disconnectWhenError && (await this.disconnect());
        return Ofn.setResponseKO(`SFTP Mkdir failed: Folder already exists.`, {
          folder: dirFolder,
          code: 'EEXIST',
        });
      }

      return Ofn.setResponseOK('Folder already exists.', {
        folderpath,
        foldername: Ofn.getFilenameByPath(dirFolder),
      });
    }

    return await this.#ftpClient
      .mkdir(dirFolder, recursive)
      .then(() => Ofn.setResponseOK({ folderpath, foldername: Ofn.getFilenameByPath(dirFolder) }))
      .catch((error: SFTPError) => {
        this.#config!.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        const message = msg.replace('mkdir: ', '').replace('_doMkdir: ', '');
        return Ofn.setResponseKO(`SFTP Mkdir failed: ${message}.`, { folder: dirFolder, code });
      });
  }

  public async rmdir(folder: string, recursive = false, strict = false): Promise<OSFtpFolderResponse> {
    const checkResponse = this.#checkFtpConfig('Rmdir');
    if (!checkResponse.status) {
      return Ofn.setResponseKO(checkResponse.error.msg, {
        folder,
        code: checkResponse.error.code,
      });
    }

    if (!folder) {
      this.#config!.disconnectWhenError && (await this.disconnect());
      return Ofn.setResponseKO(`SFTP Rmdir failed: param folder is required.`, { folder });
    }

    const dirFolder = folder[0] === '/' ? `.${folder}` : folder;
    const folderpath = dirFolder.indexOf('./') === 0 ? dirFolder.slice(2) : dirFolder;

    return await this.#ftpClient
      .rmdir(dirFolder, recursive)
      .then(() =>
        Ofn.setResponseOK({
          folderpath,
          foldername: Ofn.getFilenameByPath(dirFolder),
        }),
      )
      .catch((error: SFTPError) => {
        const { msg, code } = getMsgAndCodeByError(error);
        if (!strict && /(Bad Path:)/.test(msg)) {
          return Ofn.setResponseOK(`Folder not found.`, {
            folderpath,
            foldername: Ofn.getFilenameByPath(dirFolder),
          });
        }
        this.#config!.disconnectWhenError && this.disconnect();

        const message = msg.replace('rmdir: ', '');
        return Ofn.setResponseKO(`SFTP Rmdir failed: ${message}.`, {
          folder: dirFolder,
          code,
        });
      });
  }

  public async disconnect(): Promise<OSFtpDisconnectResponse> {
    try {
      await this.#ftpClient.end();
      return Ofn.setResponseOK();
    } catch (error) {
      const { msg } = getMsgAndCodeByError(error as SFTPError);
      return Ofn.setResponseKO(`SFTP Disconnect failed: ${msg}.`, undefined, true);
    }
  }

  public async uploadOne(filepathFrom: string, filepathTo = ''): Promise<OSFtpUploadOneResponse> {
    const sftpConnect = await this.connect();
    if (!sftpConnect.status) {
      return sftpConnect;
    }

    const sftpUpload = await this.upload(filepathFrom, filepathTo);
    if (!sftpUpload.status) {
      return sftpUpload;
    }

    await this.disconnect();

    return sftpUpload;
  }

  #checkFtpConfig(action: string): SResponseOKBasic | SResponseKOObjectSimple<{ code: OSFtpErrorCode }> {
    return !this.#config || Ofn.objIsEmpty(this.#config)
      ? Ofn.setResponseKO(`SFTP ${action} failed: config is empty.`, { code: 'UNCONNECTED' })
      : Ofn.setResponseOK();
  }

  #setFtpConfig(config?: OSFtpConfig) {
    this.#config = Ofn.cloneObject(config);

    if (this.#config.user) {
      this.#config.username = this.#config.user;
      delete this.#config.user;
    }

    this.#config.readyTimeout === undefined && (this.#config.readyTimeout = 3000);
    this.#config.retry_minTimeout === undefined && (this.#config.retry_minTimeout = this.#config.readyTimeout);
    this.#config.disconnectWhenError === undefined && (this.#config.disconnectWhenError = true);
  }
}

export default OSFtp;
