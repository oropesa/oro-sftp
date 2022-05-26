# Oro Sftp

Class OroSftp is a wrapper of ssh2-sftp-client to simplify their use.

[ssh2-sftp-client](https://www.npmjs.com/package/ssh2-sftp-client) is a SFTP client for node.js, a wrapper around SSH2 which provides a high level convenience abstraction as well as a Promise based API.

```shell
npm install oro-sftp
```

Example:

```js
const OSftp = require( 'oro-sftp' );

const sftpClient = new OSftp( {
    host: 'custom-server.com', 
    port: 22, 
    user: 'custom-user', 
    password: 'custom-password' 
} );

const sftpUpload = await sftpClient.uploadOne( `./folder-from/filename`, 'folder-to/filename' );
console.log( sftpUpload );
// { status: true, ... }
```

## Methods

* [new OSFtp()](#new-osftp-config---)
* [.getClient()](#getclient)
* [await .connect( config = {} )](#await-connect-config---)
* [await .disconnect()](#await-disconnect)
* [await .upload( filepathFrom, filepathTo = '' )](#await-upload-filepathfrom-filepathto---)
* [await .uploadOne( filepathFrom, filepathTo = '' )](#await-uploadone-filepathfrom-filepathto---)
* [await .download( filepathFrom, filepathTo = '' )](#await-download-filepathfrom-filepathto---)
* [await .list( folder = '', filters = {} )](#await-list-folder---filters---)
* [await .move( filepathFrom, filepathTo )](#await-move-filepathfrom-filepathto-)
* [await .delete( filepathFrom, strict = false )](#await-delete-filepathfrom-strict--false-)
* [await .exists( filepathFrom, disconnectWhenError = undefined )](#await-exists-filepathfrom-)
* [await .mkdir( folder, recursive = true, strict = false )](#await-mkdir-folder-recursive--true-strict--false-)
* [await .rmdir( folder, strict = false )](#await-rmdir-folder-recursive--false-strict--false-)


### new OSftp( config = {} )

On the construct, you can pass the server config data.  You can also do it in `.connect()`.

In addition, `config` has a new param `disconnectWhenError` default `true`, so when an error happens the connection close automatically.

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

If you want to use the library ssh2-sftp-client, you can get the object.

```js
const sftpClient = new OSftp( config );

const ssh2SftpClient = await sftpClient.getClient();
```

### await .connect( config = {} )

When you create a connection, it's expected that you will disconnect it later.

The action return a response, which is an object with `status: true` or `status: false`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
console.log( connected );
```

### await .disconnect()

Note: It's not necessary to use `await` in `.disconnect()`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();

// ...

const disconnected = await sftpClient.disconnect();
console.log( disconnected );

```

### await .upload( filepathFrom, filepathTo = '' )

If `filepathTo` is not declared, it takes the filename of `filepathFrom` and save it on the main folder.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const uploaded = await sftpClient.upload( './files/custom-file.pdf' );
console.log( uploaded );

sftpClient.disconnect();
```

### await .download( filepathFrom, filepathTo = '' )

If `filepathTo` is not declared, it takes the filename of `filepathFrom` and save it on the main folder.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const downloaded = await sftpClient.download( 'custom-file.pdf' );
console.log( downloaded );

sftpClient.disconnect();
```

### await .uploadOne( filepathFrom, filepathTo = '' )

If you want to upload just one file, you can use sftpClient method and inside it creates the connection/disconnection flow.

```js
const sftpClient = new OSftp( config );

const uploaded = await sftpClient.uploadOne( './files/custom-file.pdf' );
console.log( uploaded );
```

### await .list( folder = '', filters = {} )

```js
// Default filters:
{
    pattern: undefined,
    onlyFiles: false,
    onlyFolders: false,
}

// The filter options can be a regular expression (most powerful option) or
// a simple glob-like string where * will match any number of characters, e.g.

foo* => foo, foobar, foobaz
*bar => bar, foobar, tabbar
*oo* => foo, foobar, look, book

// Response
{
    status: true,
    count: // list.length
    list:: [
        {
            type: // file type(-, d, l)
            name: // file name
            date: // file date of modified time
            size: // file size
            rights: { user: group: other: } // rwx

            modifyTime: // file timestamp of modified time
            accessTime: // file timestamp of access time
            owner: // user number ID
            group: // group number ID
        },
        ...
    ]
}
```

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const files = await sftpClient.list();
console.log( files );

sftpClient.disconnect();
```

### await .move( filepathFrom, filepathTo )

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const moved = await sftpClient.move( 'custom-file.pdf', 'backup/custom-file.pdf' );
console.log( moved );

sftpClient.disconnect();
```

### await .delete( filepathFrom, strict = false )

When `strict = false` and not found the file, it returns `{ status: true }`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const deleted = await sftpClient.delete( 'custom-file.pdf' );
console.log( deleted );

sftpClient.disconnect();
```

### await .exists( filepathFrom )

It returns `{ status: Boolean, filepath: filepathFrom, [ type: <- only when file exists ] }`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const exists = await sftpClient.exists( 'custom-file.pdf' );
console.log( exists );

sftpClient.disconnect();
```

### await .mkdir( folder, recursive = true, strict = false )

It allows to create folders recursively.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const created = await sftpClient.mkdir( 'custom-folder/custom-subfolder' );
console.log( created );

sftpClient.disconnect();
```

### await .rmdir( folder, recursive = false, strict = false )

When `recursive = true` it allows to remove the folder-content too.
When `strict = false` and not found the folder, it returns `{ status: true }`.

```js
const sftpClient = new OSftp( config );

const connected = await sftpClient.connect();
if( ! connected.status ) { return connected; }

const removed = await sftpClient.rmdir( 'custom-folder', true );
console.log( removed );

sftpClient.disconnect();
```

## Testing

If you want to run `npm run test`, it's required to declare your own `./test/config.json` 
(you can copypaste it from `./test/config-default.json`)

```json
{
  "host": "IPADDRESS",
  "port": 22,
  "user": "user",
  "password": "password"
}
```

__ADVISE:__ When run the testing, in the server it's created and removed the next folders:
`test-exists`, `test-mkdir`, `test-rmdir`, `test-list`, `test-delete`, `test-move`, `test-upload`, `test-download`;
and the files `./zpython.pdf`, `./zpython2.pdf`.

So, if in your _sftp server_ already exist them and there are required for you, avoid to `run test`.