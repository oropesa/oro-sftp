import type {
  SResponseKOBasic,
  SResponseKOObject,
  SResponseKOObjectAgain,
  SResponseOKBasic,
  SResponseOKObject,
} from 'oro-functions';
import SftpClient from 'ssh2-sftp-client';
import type { ListFilterFunction } from 'ssh2-sftp-client';

export type OSFtpConfig = SftpClient.ConnectOptions & {
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  readyTimeout?: number;
  disconnectWhenError?: boolean;
};

export type OSFtpErrorCode =
  | 'UNCONNECTED'
  | 'ECONNREFUSED'
  | 'ENOTFOUND'
  | 'ENTIMEOUT'
  | 'ENOENT'
  | 'EEXIST'
  | 'ENOTEMPTY'
  | 'EISDIR';

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
export type OSFtpFileResponse = SResponseOKObject<OSFtpFileObject> | SResponseKOObject<OSFtpFileError>;
export type OSFtpFolderResponse = SResponseOKObject<OSFtpFolderObject> | SResponseKOObject<OSFtpFolderError>;
export type OSFtpExistResponse = SResponseOKObject<OSFtpExistObject> | SResponseKOObject<OSFtpExistError>;
export type OSFtpListResponse = SResponseOKObject<OSFtpListObject> | SResponseKOObject<OSFtpListError>;
export type OSFtpUploadOneResponse =
  | SResponseOKObject<OSFtpFileObject>
  | SResponseKOObject<OSFtpFileError | OSFtpConnectError>;
