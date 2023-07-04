# Oro Sftp

Class OSftp is a wrapper of ssh2-sftp-client to simplify their use.

[ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client) is a SFTP client for node.js, a wrapper around SSH2 which provides a high level convenience abstraction as well as a Promise based API.

If you need the same wrapper using FTP, then use [OroFtp](https://www.npmjs.com/package/oro-ftp)

```shell
npm install oro-sftp
```

Example:

```js
const OSftp = require( 'oro-sftp' );

// ts
import OSFtp from 'oro-sftp';

const sftpClient = new OSftp( {
    host: 'custom-server.com', 
    port: 22, 
    user: 'custom-user', 
    password: 'custom-password' 
} );

const sftpUpload = await sftpClient.uploadOne( `./folder-from/filename`, 'folder-to/filename' );

console.log( sftpUpload );
// -> { status: true, ... }
```

## Methods

* [Error Code List](#error-code-list)
* [new OSFtp()](#new-osftp)
* [.getClient()](#getclient)
* [await .connect()](#await-connect)
* [await .disconnect()](#await-disconnect)
* [await .upload()](#await-upload)
* [await .uploadOne()](#await-uploadone)
* [await .download()](#await-download)
* [await .list()](#await-list)
* [await .move()](#await-move)
* [await .delete()](#await-delete)
* [await .exists()](#await-exists)
* [await .mkdir()](#await-mkdir)
* [await .rmdir()](#await-rmdir)
* [Testing](#testing)

### Error Code List

When an error happens, instead to throw an error, it's returned a managed _responseKO_.

_responseKO_ is an object with 3 fields:

````ts
interface responseKO {
    status: false;
    error: {
        msg: string;         // explaining the error
        code: OSFtpErrorCode; // string
        // ...               // other data, it depends on method error
    },
    tryAgain: boolean;
}

type OSFtpErrorCode =
    | 'UNCONNECTED'
    | 'ENOTFOUND'
    | 'ENTIMEOUT'
    | 'ENOENT'
    | 'EEXIST'
    | 'ENOTEMPTY';
````

### new OSftp()
```ts
new OSFtp( config?: OSFtpConfig );

type OSFtpConfig = SftpClient.ConnectOptions &  {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    readyTimeout?: number;          // def: 3000
    disconnectWhenError?: boolean;  // def: true
}
```

As parameters, you can pass the server config data (or you can also do it in `.connect()`).

In addition, `config` has param `disconnectWhenError` (default `true`), so when an error happens, connection closes automatically.

```js
const OSftp = require( 'oro-sftp' );
const config = {
    host: 'custom-server.com',
    port: 22,
    user: 'custom-user',
    password: 'custom-password',
    readyTimeout: 3000,
    disconnectWhenError: true
}

const sftpClient = new OSftp( config );
```

### .getClient()
```ts
sftpClient.getClient(): SftpClient;
```

If you want to use the library `ssh2-sftp-client`, you can get the object.

```js
const sftpClient = new OSftp( config );

const ssh2SftpClient = await sftpClient.getClient();
```

### await .connect()
```ts
await sftpClient.connect( config?: OSFtpConfig ) => Promise<OSFtpConnectResponse>;

type OSFtpConfig = PromiseFtp.Options &  {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    readyTimeout?: number;          // def: 3000
    disconnectWhenError?: boolean;  // def: true
}

export type OSFtpConnectResponse = SResponse<
    SResponseOK,     
    OSFtpConnectError // as SResponseKO
>;

interface SResponseOK { 
    status: true;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        code: OSFtpErrorCode;
        config: OSFtpConfig;
    }
}

interface OSFtpConnectError {
    msg: string;
    code: OSFtpErrorCode;
    config: OSFtpConfig;
}
```

When you create a connection, it's expected that you will disconnect it later.

This method return a _response_, which is an object with `status: true | false`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
console.log( connected );
// -> { status: true }
```

### await .disconnect()
```ts
await sftpClient.disconnect() => Promise<OSFtpDisconnectResponse>;

export type OSFtpDisconnectResponse = SResponse<
    SResponseOK,
    SResponseKO
>;

interface SResponseOK { 
    status: true;
}

interface SResponseKO { 
    status: false;
}
```

**Note**: If you don't `.disconnect()` when finished, the script still running.

**Note2**: There is a param in _config_ `disconnectWhenError` by default `true`.
This means that if a method (like `upload` or `move`) return `status: false`, the _ftpClient_ will be disconnected automatically.

This method return a _response_, which is an object with `status: true | false`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();

// ...

const disconnected = await sftpClient.disconnect();
console.log( disconnected );
// -> { status: true }

```

### await .upload()
```ts
await sftpClient.upload( filepathFrom: string, filepathTo?: string ) 
    => Promise<OSFtpFileResponse>;

export type OSFtpFileResponse = SResponse<
    OSFtpFileObject, // as SResponseOK
    OSFtpFileError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    filename: string;
    filepath: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filepathFrom: string;
        filepathTo?: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpFileObject {
    filename: string;
    filepath: string;
}

interface OSFtpFileError {
    msg: string;
    filepathFrom: string;
    filepathTo?: string;
    code?: OSFtpErrorCode;
}
```

`upload` is the action to copy from _local_ to _ftp folder_.

If `filepathTo` is not declared, it takes the filename of `filepathFrom` and save it on _ftp_ main folder.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const uploaded = await sftpClient.upload( './files/custom-file.pdf' );
console.log( uploaded );
// -> { status: true, filename: 'custom-file.pdf', ... }

sftpClient.disconnect();
```

### await .uploadOne()
```ts
await sftpClient.upload( filepathFrom: string, filepathTo?: string ) 
    => Promise<OSFtpUploadOneResponse>;

export type OSFtpUploadOneResponse = SResponse<
    OSFtpFileObject,                  // as SResponseOK
    OSFtpFileError | OSFtpConnectError // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    filename: string;
    filepath: string;
}

type SResponseKO =
    | { 
        status: false;
        error: {
          msg: string;
          filepathFrom: string;
          filepathTo?: string;
          code?: OSFtpErrorCode;
        }
      }
    | {
        status: false;
        error: {
          msg: string;
          code: OSFtpErrorCode;
          config: OSFtpConfig;
        }
      }

interface OSFtpFileObject {
    filename: string;
    filepath: string;
}

interface OSFtpFileError {
    msg: string;
    filepathFrom: string;
    filepathTo?: string;
    code?: OSFtpErrorCode;
}

interface OSFtpConnectError {
    msg: string;
    code: OSFtpErrorCode;
    config: OSFtpConfig;
}
```

If you want to upload just one file, you can use this method and inside:
1. it's connected,
2. file is uploaded,
3. it's disconnected.

```js
const sftpClient = new OSftp( config );

const uploaded = await sftpClient.uploadOne( './files/custom-file.pdf' );
console.log( uploaded );
// -> { status: true, filename: 'custom-file.pdf', ... }
```

### await .download()
```ts
await sftpClient.download( filepathFrom: string, filepathTo?: string ) 
    => Promise<OSFtpFileResponse>;

export type OSFtpFileResponse = SResponse<
    OSFtpFileObject, // as SResponseOK
    OSFtpFileError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    filename: string;
    filepath: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filepathFrom: string;
        filepathTo?: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpFileObject {
    filename: string;
    filepath: string;
}

interface OSFtpFileError {
    msg: string;
    filepathFrom: string;
    filepathTo?: string;
    code?: OSFtpErrorCode;
}
```

`download` is the action to copy from _ftp folder_ to _local_.

If `filepathTo` is not declared, it takes the filename of `filepathFrom` and save it on _local_ main folder.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const downloaded = await sftpClient.download( 'custom-file.pdf' );
console.log( downloaded );
// -> { status: true, filename: 'custom-file.pdf', ... }

sftpClient.disconnect();
```

### await .list()
```ts
await sftpClient.list( folder?: string, filters?: OSFtpListFilters ) 
    => Promise<OSFtpListResponse>;

interface OSFtpListFilters {
    onlyFiles?: boolean | undefined;        // def: false
    onlyFolders?: boolean | undefined;      // def: false
    pattern?: string | RegExp | undefined;
}

export type OSFtpListResponse = SResponse<
    OSFtpListObject, // as SResponseOK
    OSFtpListError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    count: number; // list.length
    list: OSFtpListFile[];
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        folder: string;
        filters: OSFtpListFilters;
        code?: OSFtpErrorCode;
    }
}

export interface OSFtpListFile {
    path: string;
    name: string;
    type: OSFtpListFileType;
    date: Date;
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

type OSFtpListFileType = '-' | 'd' | 'l'; 
// 'file' | 'folder' | 'symlink'

export interface OSFtpListObject {
    count: number; // list.length
    list: OSFtpListFile[];
}

export interface OSFtpListError {
    msg: string;
    folder: string;
    filters: OSFtpListFilters;
    code?: OSFtpErrorCode;
}
```

`list` is the action to take a look at what is in _ftp folder_.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const files = await sftpClient.list();
console.log( files );
// -> { status: true, count: 7, list: [ ... ] }

sftpClient.disconnect();
```

* Filter: `pattern`

`pattern` filter can be a regular expression (most powerful option) or
a simple glob-like string where `*` will match any number of characters, e.g.
```js
foo* => foo, foobar, foobaz
*bar => bar, foobar, tabbar
*oo* => foo, foobar, look, book
```

response example
```js
{
    status: true,
    count: // list.length
    list: [
        {
            type: // file type(-, d, l)
            name: // file name
            longname: // file name as linux promp
            path: // file path
            date: // file date of modified time
            modifyDate: // file date of modified time
            accessDate: // file date of access time
            size: // file size
            rights: { user: 'rwx', group: 'rwx', other: 'rwx' }
            owner: // user number ID
            group: // group number ID
        },
        ...
    ]
}
```

### await .move()
```ts
await sftpClient.move( filepathFrom: string, filepathTo?: string ) 
    => Promise<OSFtpFileResponse>;

export type OSFtpFileResponse = SResponse<
    OSFtpFileObject, // as SResponseOK
    OSFtpFileError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    filename: string;
    filepath: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filepathFrom: string;
        filepathTo?: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpFileObject {
    filename: string;
    filepath: string;
}

interface OSFtpFileError {
    msg: string;
    filepathFrom: string;
    filepathTo?: string;
    code?: OSFtpErrorCode;
}
```

`move` is the action to move from _ftp folder_ to _ftp folder_ (or event _rename_).

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const moved = await sftpClient.move( 'custom-file.pdf', 'backup/custom-file.pdf' );
console.log( moved );
// -> { status: true, filename: 'custom-file.pdf', ... }

sftpClient.disconnect();
```

### await .delete()
```ts
await sftpClient.delete( filepathFrom: string, strict?: boolean ) 
    => Promise<OSFtpFileResponse>;

export type OSFtpFileResponse = SResponse<
    OSFtpFileObject, // as SResponseOK
    OSFtpFileError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    filename: string;
    filepath: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filepathFrom: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpFileObject {
    filename: string;
    filepath: string;
}

interface OSFtpFileError {
    msg: string;
    filepathFrom: string;
    code?: OSFtpErrorCode;
}
```

`delete` is the action to remove a file from _ftp folder_.

When `strict = false` and not found the file, it returns `{ status: true }`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const deleted = await sftpClient.delete( 'custom-file.pdf' );
console.log( deleted );
// -> { status: true, filename: 'custom-file.pdf', ... }

sftpClient.disconnect();
```

### await .exists()
```ts
await sftpClient.exists( filepathFrom: string, disconnectWhenError?: boolean ) 
    => Promise<OSFtpExistResponse>;

export type OSFtpExistResponse = SResponse<
    OSFtpExistObject, // as SResponseOK
    OSFtpExistError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    filename: string;
    filepath: string;
    type: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filename: string;
        filepath: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpExistObject {
    filename: string;
    filepath: string;
    type: string;
}

interface OSFtpExistError {
    msg: string;
    filename: string;
    filepath: string;
    code?: OSFtpErrorCode;
}
```

`exists` is the action to check if a file or folder exists in _ftp folder_.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const exists = await sftpClient.exists( 'custom-file.pdf' );
console.log( exists );
// -> { status: true, filename: 'custom-file.pdf', type: 'd' ... }

sftpClient.disconnect();
```

### await .mkdir()
```ts
await sftpClient.mkdir( folder, recursive?: boolean, strict?: boolean ) 
    => Promise<OSFtpFolderResponse>;

export type OSFtpFolderResponse = SResponse<
    OSFtpFolderObject, // as SResponseOK
    OSFtpFolderError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    foldername: string;
    folderpath: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filepathFrom: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpFolderObject {
    foldername: string;
    folderpath: string;
}

interface OSFtpFolderError {
    msg: string;
    folder: string;
    code?: OSFtpErrorCode;
}
```

`mkdir` is the action to create folders in _ftp folder_.

When `recursive = true` it allows to create the subfolders too.

When `strict = false` and folder already exist, it returns `{ status: true }`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const created = await sftpClient.mkdir( 'custom-folder/custom-subfolder' );
console.log( created );
// -> { status: true, foldername: 'custom-subfolder', ... }

sftpClient.disconnect();
```

### await .rmdir()
```ts
await sftpClient.rmdir( folder, recursive?: boolean, strict?: boolean ) 
    => Promise<OSFtpFolderResponse>;

export type OSFtpFolderResponse = SResponse<
    OSFtpFolderObject, // as SResponseOK
    OSFtpFolderError   // as SResponseKO
>;

interface SResponseOK { 
    status: true;
    foldername: string;
    folderpath: string;
}

interface SResponseKO { 
    status: false;
    error: {
        msg: string;
        filepathFrom: string;
        code?: OSFtpErrorCode;
    }
}

interface OSFtpFolderObject {
    foldername: string;
    folderpath: string;
}

interface OSFtpFolderError {
    msg: string;
    folder: string;
    code?: OSFtpErrorCode;
}
```

`rmdir` is the action to remove folders in _ftp folder_.

When `recursive = true` it allows to remove the folder-content too.

When `strict = false` and not found the folder, it returns `{ status: true }`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const removed = await sftpClient.rmdir( 'custom-folder', true );
console.log( removed );
// -> { status: true, foldername: 'custom-folder', ... }

sftpClient.disconnect();
```

## Testing

If you want to run `npm run test`, it's required to declare your own `./test/config.json` 
(you can _copypaste_ it from `./test/config-default.json`)

```json
{
  "host": "IPADDRESS",
  "port": 22,
  "user": "user",
  "password": "password"
}
```

__NOTICE:__ When tests are running, in the _server ftp_ it's created (and removed when it has finished) the next folders:
* `test-exists`, 
* `test-mkdir`, 
* `test-rmdir`,
* `test-list`, 
* `test-delete`, 
* `test-move`, 
* `test-upload`,
* `test-download`;
* `test-exists-ts`,
* `test-mkdir-ts`,
* `test-rmdir-ts`,
* `test-list-ts`,
* `test-delete-ts`,
* `test-move-ts`,
* `test-upload-ts`,
* `test-download-ts`;
and the files `./zpython.pdf`, `./zpython2.pdf`.

So, 
* `rw` permissions should be allowed, 
* and if in your _sftp server_ already exist them and there are required for you, avoid to `run test`.