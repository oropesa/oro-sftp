import path from 'node:path';
import fsExtra from 'fs-extra';
import Ofn from 'oro-functions';
import SftpClient from 'ssh2-sftp-client';
import type { ListFilterFunction } from 'ssh2-sftp-client';
import type {
  SResponseOKBasic,
  SResponseKOObjectAgain,
  SResponseKOBasic,
  SResponseOKObject,
  SResponseKOObject,
} from 'oro-functions';

export type OSFtpConfig = SftpClient.ConnectOptions & {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  readyTimeout?: number;
  disconnectWhenError?: boolean;
};

type OSFtpErrorCode =
  | 'UNCONNECTED'
  | 'ECONNREFUSED'
  | 'ENOTFOUND'
  | 'ENTIMEOUT'
  | 'ENOENT'
  | 'EEXIST'
  | 'ENOTEMPTY';

export interface OSFtpConnectError {
  msg: string;
  code: OSFtpErrorCode;
  config: OSFtpConfig;
}

export interface OSFtpFileObject {
  filename: string;
  filepath: string;
}

export interface OSFtpFileError {
  msg: string;
  filepathFrom: string;
  filepathTo?: string;
  code?: OSFtpErrorCode;
}

export interface OSFtpFolderObject {
  msg?: string;
  foldername: string;
  folderpath: string;
}

export interface OSFtpFolderError {
  msg: string;
  folder: string;
  code?: OSFtpErrorCode;
}

export interface OSFtpExistObject {
  filename: string;
  filepath: string;
  type: string;
}

export interface OSFtpExistError {
  msg: string;
  filename: string;
  filepath: string;
  code?: OSFtpErrorCode;
}

export interface OSFtpListFilters {
  onlyFiles?: boolean | undefined;
  onlyFolders?: boolean | undefined;
  pattern?: ListFilterFunction | undefined;
}

export type OSFtpListFileType = '-' | 'd' | 'l';

export interface OSFtpListFile {
  path: string;
  name: string;
  longname: string;
  type: OSFtpListFileType;
  date: Date;
  modifyDate: Date;
  accessDate: Date;
  size: number;
  owner: string;
  group: string;
  target: string | undefined;
  rights: {
    user: string;
    group: string;
    other: string;
  };
}

export interface OSFtpListObject {
  count: number;
  list: OSFtpListFile[];
}

export interface OSFtpListError {
  msg: string;
  folder: string;
  filters: OSFtpListFilters;
  code?: OSFtpErrorCode;
}

export type OSFtpConnectResponse = SResponseOKBasic | SResponseKOObjectAgain<OSFtpConnectError>;
export type OSFtpDisconnectResponse = SResponseOKBasic | SResponseKOBasic;
export type OSFtpFileResponse =
  | SResponseOKObject<OSFtpFileObject>
  | SResponseKOObject<OSFtpFileError>;
export type OSFtpFolderResponse =
  | SResponseOKObject<OSFtpFolderObject>
  | SResponseKOObject<OSFtpFolderError>;
export type OSFtpExistResponse =
  | SResponseOKObject<OSFtpExistObject>
  | SResponseKOObject<OSFtpExistError>;
export type OSFtpListResponse =
  | SResponseOKObject<OSFtpListObject>
  | SResponseKOObject<OSFtpListError>;
export type OSFtpUploadOneResponse =
  | SResponseOKObject<OSFtpFileObject>
  | SResponseKOObject<OSFtpFileError | OSFtpConnectError>;

type SFTPError = Error & { code: number | string };

export class OSFtp {
  readonly #ftpClient: SftpClient;
  // @ts-ignore
  #config: OSFtpConfig;

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

    if (Ofn.objIsEmpty(this.#config)) {
      const config = Ofn.cloneObject(this.#config);
      if (config.password) {
        config.password = Array.from({ length: config.password.length }).fill('*').join('');
      }

      return Ofn.setResponseKO(
        `SFTP Connect failed: config is empty.`,
        {
          code: 'UNCONNECTED',
          config,
        },
        false,
      );
    }

    return this.#ftpClient
      .connect(this.#config)
      .then((_data) => Ofn.setResponseOK())
      .catch((error: SFTPError) => {
        const config = Ofn.cloneObject(this.#config);
        if (config.password) {
          config.password = Array.from({ length: config.password.length }).fill('*').join('');
        }

        const { msg } = getMsgAndCodeByError(error);
        const code = msg.includes('Timed out while waiting for handshake')
          ? 'ENTIMEOUT'
          : (String(error.code) as OSFtpErrorCode);
        const tryAgain = msg !== 'Invalid username';
        return Ofn.setResponseKO(
          `SFTP Connect failed: ${msg.replace('connect: ', '')}.`,
          { config, code },
          tryAgain,
        );
      });
  }

  public async upload(filepathFrom: string, filepathTo = ''): Promise<OSFtpFileResponse> {
    // eslint-disable-next-line unicorn/prefer-logical-operator-over-ternary
    const filepathDestiny = filepathTo ? filepathTo : Ofn.getFilenameByPath(filepathFrom);
    const filepathOrigin = path.isAbsolute(filepathFrom)
      ? filepathFrom
      : path.resolve(filepathFrom);

    if (!(await fsExtra.exists(filepathOrigin))) {
      this.#config.disconnectWhenError && (await this.disconnect());
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
        this.#config.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(
          `SFTP Upload failed: ${msg.replace('_put: ', '').replace('Write stream error: ', '')}.`,
          { filepathFrom: filepathOrigin, filepathTo: filepathDestiny, code },
        );
      });
  }

  public async download(filepathFrom: string, filepathTo = ''): Promise<OSFtpFileResponse> {
    // eslint-disable-next-line unicorn/prefer-logical-operator-over-ternary
    let filepathDestiny = filepathTo ? filepathTo : Ofn.getFilenameByPath(filepathFrom);
    if (!path.isAbsolute(filepathTo)) {
      filepathDestiny = path.resolve(filepathDestiny);
    }

    if (!(await fsExtra.exists(Ofn.getFolderByPath(filepathDestiny)))) {
      this.#config.disconnectWhenError && (await this.disconnect());
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
        this.#config.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP Download failed: ${msg.replace('get: ', '')}.`, {
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

    // eslint-disable-next-line unicorn/prefer-logical-operator-over-ternary
    let listFolder = folder ? folder : '/';
    listFolder && listFolder[0] === '/' && (listFolder = `.${folder}`);
    listFolder && listFolder.slice(-1) !== '/' && (listFolder += '/');

    const folderPath = listFolder.indexOf('./') === 0 ? listFolder.slice(2) : listFolder;

    return await this.#ftpClient
      .list(listFolder, listFilter.pattern)
      .then((data) => {
        const files: OSFtpListFile[] = [];
        for (const element of data) {
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

          files.push(file);
        }
        return Ofn.setResponseOK({ count: files.length, list: files });
      })
      .catch((error: SFTPError) => {
        this.#config.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP List failed: ${msg}.`, {
          folder: listFolder,
          filters: listFilter,
          code,
        });
      });
  }

  public async move(filepathFrom: string, filepathTo: string): Promise<OSFtpFileResponse> {
    return await this.#ftpClient
      .rename(filepathFrom, filepathTo)
      .then(() => {
        return Ofn.setResponseOK({
          filename: Ofn.getFilenameByPath(filepathTo),
          filepath: filepathTo,
        });
      })
      .catch((error: SFTPError) => {
        this.#config.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP Move failed: ${msg.replace('_rename: ', '')}.`, {
          filepathFrom,
          filepathTo,
          code,
        });
      });
  }

  public async delete(filepathFrom: string, strict = false): Promise<OSFtpFileResponse> {
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

        this.#config.disconnectWhenError && (await this.disconnect());

        if (msg === "TypeCannot read properties of undefined (reading 'unlink')") {
          msg = `FtpConnectionError: connection status is not yet connected`;
          code = 'UNCONNECTED';
        }

        return Ofn.setResponseKO(`SFTP Delete failed: ${msg.replace('delete: ', '')}.`, {
          filepathFrom,
          code,
        });
      });
  }

  public async exists(filepathFrom: string): Promise<OSFtpExistResponse> {
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
        this.#config.disconnectWhenError && this.disconnect();
        const { msg, code } = getMsgAndCodeByError(error);
        return Ofn.setResponseKO(`SFTP Exists failed: ${msg}.`, {
          filepath: filepathFrom,
          filename: Ofn.getFilenameByPath(filepathFrom),
          code,
        });
      });
  }

  public async mkdir(
    folder: string,
    recursive = true,
    strict = false,
  ): Promise<OSFtpFolderResponse> {
    if (!folder) {
      this.#config.disconnectWhenError && (await this.disconnect());
      return Ofn.setResponseKO(`SFTP Mkdir failed: param folder is required.`, { folder });
    }

    const dirFolder = folder[0] === '/' ? `.${folder}` : folder;
    const folderpath = dirFolder.indexOf('./') === 0 ? dirFolder.slice(2) : dirFolder;

    const exists = await this.exists(dirFolder);
    if (exists.status && exists.type === 'd') {
      if (strict) {
        this.#config.disconnectWhenError && (await this.disconnect());
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
        this.#config.disconnectWhenError && this.disconnect();
        let { msg, code } = getMsgAndCodeByError(error);

        msg = msg.replace('mkdir: ', '').replace('_doMkdir: ', '');

        return Ofn.setResponseKO(`SFTP Mkdir failed: ${msg}.`, { folder: dirFolder, code });
      });
  }

  public async rmdir(
    folder: string,
    recursive = false,
    strict = false,
  ): Promise<OSFtpFolderResponse> {
    if (!folder) {
      this.#config.disconnectWhenError && (await this.disconnect());
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
        let { msg, code } = getMsgAndCodeByError(error);
        if (!strict && /(Bad Path:)/.test(msg)) {
          return Ofn.setResponseOK(`Folder not found.`, {
            folderpath,
            foldername: Ofn.getFilenameByPath(dirFolder),
          });
        }
        this.#config.disconnectWhenError && this.disconnect();

        return Ofn.setResponseKO(`SFTP Rmdir failed: ${msg.replace('rmdir: ', '')}.`, {
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

  #setFtpConfig(config?: OSFtpConfig) {
    this.#config = Ofn.cloneObject(config);

    if (this.#config.user) {
      this.#config.username = this.#config.user;
      delete this.#config.user;
    }

    this.#config.readyTimeout === undefined && (this.#config.readyTimeout = 3000);
    this.#config.retry_minTimeout === undefined &&
      (this.#config.retry_minTimeout = this.#config.readyTimeout);
    this.#config.disconnectWhenError === undefined && (this.#config.disconnectWhenError = true);
  }
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

export default OSFtp;
