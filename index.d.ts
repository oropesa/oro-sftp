import * as SftpClient from 'ssh2-sftp-client';
import { SResponse, SResponseOK, SResponseKO } from 'oro-functions/src';

export type OSFtpConfig = SftpClient.ConnectOptions &  {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    readyTimeout?: number;
    disconnectWhenError?: boolean;
}

type OSFtpErrorCode =
    | 'UNCONNECTED'
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
    filename: string;
    filepath: string;
    code?: OSFtpErrorCode;
}

export interface OSFtpListFilters {
    onlyFiles?: boolean | undefined;
    onlyFolders?: boolean | undefined;
    pattern?: string | RegExp | undefined;
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
    }
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

export type OSFtpConnectResponse = SResponse<SResponseOK, OSFtpConnectError>;

export type OSFtpDisconnectResponse = SResponse<SResponseOK, SResponseKO>;

export type OSFtpFileResponse = SResponse<OSFtpFileObject, OSFtpFileError>;

export type OSFtpFolderResponse = SResponse<OSFtpFolderObject, OSFtpFolderError>;

export type OSFtpExistResponse = SResponse<OSFtpExistObject, OSFtpExistError>;

export type OSFtpListResponse = SResponse<OSFtpListObject, OSFtpListError>;

export type OSFtpUploadOneResponse = SResponse<OSFtpFileObject, OSFtpFileError | OSFtpConnectError>;

declare class OSFtp {
    constructor( config?: OSFtpConfig );

    getClient(): SftpClient;

    connect( config?: OSFtpConfig ): Promise<OSFtpConnectResponse>;

    disconnect(): Promise<OSFtpDisconnectResponse>;

    upload( filepathFrom: string, filepathTo?: string ): Promise<OSFtpFileResponse>;

    uploadOne( filepathFrom: string, filepathTo?: string ): Promise<OSFtpUploadOneResponse>;

    download( filepathFrom: string, filepathTo?: string ): Promise<OSFtpFileResponse>;

    list( folder?: string, filters?: OSFtpListFilters ): Promise<OSFtpListResponse>;

    move( filepathFrom: string, filepathTo: string ): Promise<OSFtpFileResponse>;

    delete( filepathFrom: string, strict?: boolean ): Promise<OSFtpFileResponse>;

    exists( filepathFrom: string, disconnectWhenError?: boolean ): Promise<OSFtpExistResponse>;

    mkdir( folder, recursive?: boolean, strict?: boolean ): Promise<OSFtpFolderResponse>;

    rmdir( folder, recursive?: boolean, strict?: boolean ): Promise<OSFtpFolderResponse>;

}

export default OSFtp;