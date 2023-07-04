const path = require( 'path' );
const fsExtra = require( 'fs-extra' );
const Ofn = require( 'oro-functions' );
const SftpClient = require( 'ssh2-sftp-client' );

function getMsgAndCodeByErr( err ) {
    let msg = err.toString().split( '\r\n' )[ 0 ].replace( 'Error: ', '' );
    let code = err.code;

    if( msg.includes( 'No SFTP connection available' ) ) {
        msg = `FtpConnectionError: connection status is not yet connected`;
        code = 'UNCONNECTED';
    }

    switch( true ) {
        case code === 2: code = 'ENOTFOUND'; break;
        case code === 4: code = 'ENOTEMPTY'; break;
    }

    return { msg, code };
}


class OSFtp {

    #ftpClient;
    #config;

    constructor( config = {}  ) {
        ! Ofn.objIsEmpty( config ) && this.#setFtpConfig( config );

        this.#ftpClient = new SftpClient();
    }

    getClient() { return this.#ftpClient; }

    #setFtpConfig( config ) {
        this.#config = Ofn.cloneObject( config );

        if( this.#config.user ) {
            this.#config.username = this.#config.user;
            delete this.#config.user;
        }

        this.#config.readyTimeout === undefined && ( this.#config.readyTimeout = 3000 );
        this.#config.retry_minTimeout === undefined && ( this.#config.retry_minTimeout = this.#config.readyTimeout );
        this.#config.disconnectWhenError === undefined && ( this.#config.disconnectWhenError = true );
    }

    async connect( config = {} ) {
        ! Ofn.objIsEmpty( config ) && this.#setFtpConfig( config );

        if( Ofn.objIsEmpty( this.#config ) ) {
            return Ofn.setResponseKO(
                `SFTP Connect failed: config is empty.`,
                { code: 'UNCONNECTED', config: {} }
            );
        }

        return await this.#ftpClient.connect( this.#config )
            .then( data => Ofn.setResponseOK() )
            .catch( err => {
                const config = Ofn.cloneObject( this.#config );
                if( config.password ) {
                    config.password = new Array( config.password.length ).fill( '*' ).join( '' );
                }

                const { msg } = getMsgAndCodeByErr( err );
                const code = msg.includes( 'Timed out while waiting for handshake' ) ? 'ENTIMEOUT' : err.code +'';
                const tryAgain = msg !== 'Invalid username';
                return Ofn.setResponseKO( `SFTP Connect failed: ${msg.replace( 'connect: ', '' )}.`,
                    { config, code }, tryAgain )
            } );
    }

    async upload( filepathFrom, filepathTo = '' ) {
        ! filepathTo && ( filepathTo = Ofn.getFilenameByPath( filepathFrom ) );
        ! path.isAbsolute( filepathFrom ) && ( filepathFrom = path.resolve( filepathFrom ) );

        if( ! await fsExtra.exists( filepathFrom ) ) {
            this.#config.disconnectWhenError && ( await this.disconnect() );
            return Ofn.setResponseKO(
                `SFTP Upload failed: File (From) to upload not exist.`,
                { filepathFrom, filepathTo, code: 'ENOTFOUND' }
            );
        }

        return await this.#ftpClient.put(filepathFrom, filepathTo )
            .then( data => {
                return Ofn.setResponseOK( {
                    filename: Ofn.getFilenameByPath( filepathTo ),
                    filepath: filepathTo
                } );
            } )
            .catch( err => {
                this.#config.disconnectWhenError && ( this.disconnect() );
                const { msg, code } = getMsgAndCodeByErr( err );
                return Ofn.setResponseKO(
                    `SFTP Upload failed: ${msg.replace( '_put: ', '' ).replace( 'Write stream error: ', '' )}.`,
                    { filepathFrom, filepathTo, code }
                );
            } );
    }

    async download( filepathFrom, filepathTo = '' ) {
        ! filepathTo && ( filepathTo = Ofn.getFilenameByPath( filepathFrom ) );
        ! path.isAbsolute( filepathTo ) && ( filepathTo = path.resolve( filepathTo ) );

        if( ! await fsExtra.exists( Ofn.getFolderByPath( filepathTo ) ) ) {
            this.#config.disconnectWhenError && ( await this.disconnect() );
            return Ofn.setResponseKO(
                `SFTP Download failed: Folder (From) to download not exist.`,
                { filepathFrom, filepathTo, code: 'ENOTFOUND' }
            );
        }

        return await this.#ftpClient.get( filepathFrom, filepathTo )
            .then( data =>  {
                return Ofn.setResponseOK( {
                    filename: Ofn.getFilenameByPath( filepathTo ),
                    filepath: Ofn.sanitizePath( filepathTo )
                } );
            } )
            .catch( err => {
                this.#config.disconnectWhenError && ( this.disconnect() );
                const { msg, code } = getMsgAndCodeByErr( err );
                return Ofn.setResponseKO(
                    `SFTP Download failed: ${msg.replace( 'get: ', '' )}.`,
                    { filepathFrom, filepathTo, code }
                )
            } );
    }

    async list( folder = '', filters = {} ) {
        filters = Object.assign( { pattern: undefined, onlyFiles: false, onlyFolders: false }, filters );

        ! folder && ( folder = '/' );
        folder[ 0 ] === '/' && ( folder = `.${folder}` );
        folder && folder.slice( folder.length - 1 ) !== '/' && ( folder += '/' );

        const folderPath = folder.indexOf( './' ) === 0 ? folder.slice( 2 ) : folder;

        return await this.#ftpClient.list( folder, filters.pattern )
             .then( data => {
                 const files = [];
                 for( const elem of data ) {
                     elem.date = new Date( elem.modifyTime );
                     if( filters.onlyFiles && elem.type !== '-' ) { continue; }
                     if( filters.onlyFolders && elem.type !== 'd' ) { continue; }

                     elem.modifyDate = elem.modifyTime && new Date(elem.modifyTime);
                     delete elem.modifyTime;

                     elem.accessDate = elem.accessTime && new Date(elem.accessTime);
                     delete elem.modifyTime;

                     elem.owner = (elem.owner || '')+'';
                     elem.group = (elem.group || '')+'';
                     elem.path = `${folderPath}${elem.name}`;

                     files.push( elem );
                 }
                 return Ofn.setResponseOK( { count: files.length, list: files } );
             } )
             .catch( err => {
                 this.#config.disconnectWhenError && ( this.disconnect() );
                 const { msg, code } = getMsgAndCodeByErr( err );
                 return Ofn.setResponseKO( `SFTP List failed: ${msg}.`, {  folder, filters, code  } );
             } );
    }

    async move( filepathFrom, filepathTo ) {
        return await this.#ftpClient.rename(filepathFrom, filepathTo )
            .then( data =>  {
                return Ofn.setResponseOK( {
                    filename: Ofn.getFilenameByPath( filepathTo ),
                    filepath: filepathTo
                } );
            } )
            .catch( err => {
                this.#config.disconnectWhenError && ( this.disconnect() );
                const { msg, code } = getMsgAndCodeByErr( err );
                return Ofn.setResponseKO(
                    `SFTP Move failed: ${msg.replace( '_rename: ', '' )}.`,
                    { filepathFrom, filepathTo, code }
                );
            } );
    }

    async delete( filepathFrom, strict = false ) {
        return await this.#ftpClient.delete( filepathFrom )
            .then( data =>  {
                return Ofn.setResponseOK( 'deleted successfully', {
                    filepath: filepathFrom,
                    filename: Ofn.getFilenameByPath( filepathFrom )
                } );
            } )
            .catch( async (err) => {
                let { msg, code } = getMsgAndCodeByErr( err );

                if( ! strict && msg.match( /(delete: No such file)|(delete: Failure)/ ) ) {
                    const exists = await this.exists( filepathFrom );
                    if( ! exists.status || exists.type !== 'd') {
                        return Ofn.setResponseOK( `file not found`, {
                            filepath: filepathFrom,
                            filename: Ofn.getFilenameByPath( filepathFrom )
                        } );
                    }

                    const rmdir = await this.rmdir( filepathFrom, false, true );
                    return rmdir.status
                           ? Ofn.setResponseOK( rmdir.msg,
                            {
                                filepath: rmdir.folderpath,
                                filename: rmdir.foldername
                            } )
                            : Ofn.setResponseKO( rmdir.error.msg.replace( 'Rmdir', 'Delete' ),
                            {
                                filepathFrom: rmdir.error.folder,
                                code: rmdir.error.code
                            } );
                }

                this.#config.disconnectWhenError && ( this.disconnect() );

                if( msg === "TypeCannot read properties of undefined (reading 'unlink')" ) {
                    msg = `FtpConnectionError: connection status is not yet connected`;
                    code = 'UNCONNECTED';
                }

                return Ofn.setResponseKO(
                    `SFTP Delete failed: ${msg.replace('delete: ', '')}.`,
                    { filepathFrom, code }
                )
            } );
    }

    async exists( filepathFrom ) {
        return await this.#ftpClient.exists( filepathFrom )
            .then( data => {
                const response = Ofn.setResponseOK( {
                    filepath: filepathFrom,
                    filename: Ofn.getFilenameByPath( filepathFrom )
                } );

                data && ( response.type = data );
                response.status = !! data;
                return response;
            } )
            .catch( err => {
                this.#config.disconnectWhenError && ( this.disconnect() );
                const { msg, code } = getMsgAndCodeByErr( err );
                return Ofn.setResponseKO(
                    `SFTP Exists failed: ${msg}.`,
                    {
                        filepath: filepathFrom,
                        filename: Ofn.getFilenameByPath( filepathFrom ),
                        code
                    }
                );
            } );
    }

    async mkdir( folder, recursive = true, strict = false ) {
        if( ! folder ) {
            this.#config.disconnectWhenError && ( this.disconnect() );
            return Ofn.setResponseKO( `SFTP Mkdir failed: param folder is required.` );
        }

        folder[ 0 ] === '/' && ( folder = `.${folder}` );
        const folderpath = folder.indexOf( './' ) === 0 ? folder.slice( 2 ) : folder;

        const exists = await this.exists( folder );
        if( exists.status && exists.type === 'd' ) {
            if( strict ) {
                this.#config.disconnectWhenError && ( this.disconnect() );
                return Ofn.setResponseKO(
                    `SFTP Mkdir failed: Folder already exists.`,
                    { folderpath, foldername: Ofn.getFilenameByPath( folder ) }
                );
            }

            return Ofn.setResponseOK( 'Folder already exists.',
                { folderpath, foldername: Ofn.getFilenameByPath( folder ), } );
        }

        return await this.#ftpClient.mkdir( folder, recursive )
            .then( () => Ofn.setResponseOK( { folderpath, foldername: Ofn.getFilenameByPath( folder ) } ) )
            .catch( err => {
                this.#config.disconnectWhenError && ( this.disconnect() );
                let { msg, code } = getMsgAndCodeByErr( err );

                if( code === 'ERR_BAD_PATH' ) {
                    code = 'ENOTFOUND';
                }

                msg = msg.replace('mkdir: ', '').replace('_doMkdir: ', '')

                return Ofn.setResponseKO(
                    `SFTP Mkdir failed: ${msg}.`,
                    { folder, code }
                );
            } );
    }

    async rmdir( folder, recursive = false, strict = false ) {
        if( ! folder ) {
            this.#config.disconnectWhenError && ( this.disconnect() );
            return Ofn.setResponseKO( `SFTP Rmdir failed: param folder is required.` );
        }

        folder[ 0 ] === '/' && ( folder = `.${folder}` );
        const folderpath = folder.indexOf( './' ) === 0 ? folder.slice( 2 ) : folder;

        return await this.#ftpClient.rmdir( folder, recursive )
            .then( () => Ofn.setResponseOK( {
                folderpath, foldername:
                    Ofn.getFilenameByPath( folder )
            } ) )
            .catch( err => {
                let { msg, code } = getMsgAndCodeByErr( err );
                if( ! strict && msg.match( /(Bad Path:)/ ) ) {
                    return Ofn.setResponseOK( `Folder not found.`, {
                        folderpath,
                        foldername: Ofn.getFilenameByPath( folder )
                    } )
                }
                this.#config.disconnectWhenError && ( this.disconnect() );

                if( code === 'ERR_BAD_PATH' ) {
                    code = 'ENOTFOUND';
                }

                return Ofn.setResponseKO(
                    `SFTP Rmdir failed: ${msg.replace('rmdir: ', '')}.`,
                    { folder, code }
                );
            } );
    }

    disconnect() {
        return this.#ftpClient.end()
            .then( () => Ofn.setResponseOK() )
            .catch( err => {
                const { msg } = getMsgAndCodeByErr( err );
                return Ofn.setResponseKO(
                    `SFTP Disconnect failed: ${msg}.`,
                    undefined,
                    true
                )
            } );
    }

    async uploadOne( filepathFrom, filepathTo = '' ) {
        const sftpConnect = await this.connect();
        if( ! sftpConnect.status ) { return sftpConnect; }

        const sftpUpload = await this.upload( filepathFrom, filepathTo );
        if( ! sftpUpload.status ) { return sftpUpload; }

        await this.disconnect();

        return sftpUpload;
    }
}

module.exports = OSFtp;