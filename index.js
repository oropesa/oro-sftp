const path = require( 'path' );
const fsExtra = require( 'fs-extra' );
const Ofn = require( 'oro-functions' );
const SftpClient = require( 'ssh2-sftp-client' );

class OroSftp {

    #ftpClient
    #ftpConfig

    constructor( config = {}  ) {
        ! Ofn.objIsEmpty( config ) && this.#setFtpConfig( config );

        this.#ftpClient = new SftpClient();
    }

    getClient() { return this.#ftpClient; }

    #setFtpConfig( config ) {
        this.#ftpConfig = Ofn.cloneObject( config );

        if( this.#ftpConfig.user ) {
            this.#ftpConfig.username = this.#ftpConfig.user;
            delete this.#ftpConfig.user;
        }

        this.#ftpConfig.readyTimeout === undefined && ( this.#ftpConfig.readyTimeout = 3000 );
        this.#ftpConfig.disconnectWhenError === undefined && ( this.#ftpConfig.disconnectWhenError = true );
    }

    async connect( config = {} ) {
        ! Ofn.objIsEmpty( config ) && this.#setFtpConfig( config );

        if( Ofn.objIsEmpty( this.#ftpConfig ) ) {
            return Ofn.setResponseKO( `SFTP Connect failed: ftpConfig is empty.` );
        }

        return await this.#ftpClient.connect( this.#ftpConfig )
            .then( data => Ofn.setResponseOK() )
            .catch( err => {
                let cloneConfig = Ofn.cloneObject( this.#ftpConfig );
                cloneConfig.password && (cloneConfig.password = new Array( cloneConfig.password.length ).fill( '*' ).join( '' ));
                let errArray = err.toString().split( '\r\n' );
                let tryAgain = errArray[ 0 ] !== 'Error: Invalid username';
                return Ofn.setResponseKO( `SFTP Connect failed: ${errArray[ 0 ]}.`,
                    { ftpConfig: cloneConfig, ftpError: errArray }, tryAgain )
            } );
    }

    async upload( filepathFrom, filepathTo = '' ) {
        ! filepathTo && ( filepathTo = Ofn.getFilenameByPath( filepathFrom ) );
        ! path.isAbsolute( filepathFrom ) && ( filepathFrom = path.resolve( filepathFrom ) );

        if( ! await fsExtra.exists( filepathFrom ) ) {
            this.#ftpConfig.disconnectWhenError && ( await this.disconnect() );
            return Ofn.setResponseKO( `SFTP Upload failed: File to upload not exist.`, { filepathFrom } );
        }

        return await this.#ftpClient.put(filepathFrom, filepathTo )
            .then( data => {
                return Ofn.setResponseOK( { filename: Ofn.getFilenameByPath( filepathTo ), filepath: filepathTo } );
            } )
            .catch( err => {
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                let errArray = err.toString().split( '\r\n' );
                return Ofn.setResponseKO( `SFTP Upload failed: ${errArray[0]}.`, { ftp: errArray } );
            } );
    }

    async download( filepathFrom, filepathTo = '' ) {
        ! filepathTo && ( filepathTo = Ofn.getFilenameByPath( filepathFrom ) );
        ! path.isAbsolute( filepathTo ) && ( filepathTo = path.resolve( filepathTo ) );

        if( ! await fsExtra.exists( Ofn.getFolderByPath( filepathTo ) ) ) {
            this.#ftpConfig.disconnectWhenError && ( await this.disconnect() );
            return Ofn.setResponseKO( `SFTP Download failed: Folder to download not exist.`, { filepathFrom, filepath: filepathTo } );
        }

        return await this.#ftpClient.get( filepathFrom, filepathTo )
            .then( data =>  {
                return Ofn.setResponseOK( { filename: Ofn.getFilenameByPath( filepathTo ), filepath: Ofn.sanitizePath( filepathTo ) } );
            } )
            .catch( err => {
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                let errArray = err.toString().split( '\r\n' );
                return Ofn.setResponseKO( `SFTP Download failed: ${errArray[0]}.`, { ftp: errArray } )
            } );
    }

    async list( folder = '', filters = {} ) {
        filters = Object.assign( { pattern: undefined, onlyFiles: false, onlyFolders: false }, filters );

        ! folder && ( folder = '/' );
        folder[ 0 ] === '/' && ( folder = `.${folder}` );
        folder && folder.substr( folder.length - 1 ) !== '/' && ( folder += '/' );

        let folderPath = folder.indexOf( './' ) === 0 ? folder.substr( 2 ) : folder;

        return await this.#ftpClient.list( folder, filters.pattern )
             .then( data => {
                 let files = [];
                 for( const elem of data ) {
                     elem.date = new Date( elem.modifyTime );
                     if( filters.onlyFiles && elem.type !== '-' ) { continue; }
                     if( filters.onlyFolders && elem.type !== 'd' ) { continue; }

                     elem.path = `${folderPath}${elem.name}`;

                     files.push( elem );
                 }
                 return Ofn.setResponseOK( { count: files.length, list: files } );
             } )
             .catch( err => {
                 this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                 let errArray = err.toString().split( '\r\n' );
                 return Ofn.setResponseKO( `SFTP List failed: ${errArray[0]}.`, { ftp: errArray } );
             } );
    }

    async move( filepathFrom, filepathTo ) {
        return await this.#ftpClient.rename(filepathFrom, filepathTo )
            .then( data =>  {
                return Ofn.setResponseOK(
                    { filepathFrom, filepath: filepathTo, filename: Ofn.getFilenameByPath( filepathTo ) } );
            } )
            .catch( err => {
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                let errArray = err.toString().split( '\r\n' );
                return Ofn.setResponseKO( `SFTP Move failed: ${errArray[0]}.`,
                    { filepathFrom, filepath: filepathTo, ftp: errArray } );
            } );
    }

    async delete( filepathFrom, strict = false ) {
        return await this.#ftpClient.delete( filepathFrom )
            .then( data =>  {
                return Ofn.setResponseOK( 'deleted successfully',
                    { filepath: filepathFrom, filename: Ofn.getFilenameByPath( filepathFrom ) } );
            } )
            .catch( err => {
                let errArray = err.toString().split( '\r\n' );
                if( ! strict && errArray[ 0 ].match( /(Error: delete: No such file)/ ) ) {
                    return Ofn.setResponseOK( `file not found`,
                        { filepath: filepathFrom, filename: Ofn.getFilenameByPath( filepathFrom ) } );
                }
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                return Ofn.setResponseKO( `SFTP Delete failed: ${errArray[0]}.`,
                    { filepath: filepathFrom, ftp: errArray } )
            } );
    }

    async exists( filepathFrom ) {
        return await this.#ftpClient.exists( filepathFrom )
            .then( data => {
                let response = Ofn.setResponseOK(
                    { filepath: filepathFrom, filename: Ofn.getFilenameByPath( filepathFrom ) } );

                data && ( response.type = data );
                response.status = !! data;
                return response;
            } )
            .catch( err => {
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                let errArray = err.toString().split( '\r\n' );
                return Ofn.setResponseKO(
                    `SFTP Exists failed: ${errArray[0]}.`, { filepath: filepathFrom, ftp: errArray } );
            } );
    }

    async mkdir( folder, recursive = true, strict = false ) {
        if( ! folder ) {
            this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
            return Ofn.setResponseKO( `SFTP Mkdir failed: param folder is required.` );
        }

        folder[ 0 ] === '/' && ( folder = `.${folder}` );
        let folderpath = folder.indexOf( './' ) === 0 ? folder.substr( 2 ) : folder;

        let exists = await this.exists( folder );
        if( exists.status && exists.type === 'd' ) {
            if( strict ) {
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                return Ofn.setResponseKO( `SFTP Mkdir failed: Folder already exists.`,
                    { folderpath, foldername: Ofn.getFilenameByPath( folder ), } );
            }

            return Ofn.setResponseOK( 'Folder already exists.',
                { folderpath, foldername: Ofn.getFilenameByPath( folder ), } );
        }

        return await this.#ftpClient.mkdir( folder, recursive )
            .then( () => Ofn.setResponseOK( { folderpath, foldername: Ofn.getFilenameByPath( folder ) } ) )
            .catch( err => {
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                let errArray = err.toString().split( '\r\n' );
                return Ofn.setResponseKO( `SFTP Mkdir failed: ${errArray[0]}.`, { folder, ftp: errArray } );
            } );
    }

    async rmdir( folder, recursive = false, strict = false ) {
        if( ! folder ) {
            this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
            return Ofn.setResponseKO( `SFTP Rmdir failed: param folder is required.` );
        }

        folder[ 0 ] === '/' && ( folder = `.${folder}` );
        let folderpath = folder.indexOf( './' ) === 0 ? folder.substr( 2 ) : folder;

        return await this.#ftpClient.rmdir( folder, recursive )
            .then( () => Ofn.setResponseOK( { folderpath, foldername: Ofn.getFilenameByPath( folder ) } ) )
            .catch( err => {
                let errArray = err.toString().split( '\r\n' );
                if( ! strict && errArray[ 0 ].match( /(Error: rmdir: Bad path:)/ ) ) {
                    return Ofn.setResponseOK( `Folder not found.`, { folderpath, foldername: Ofn.getFilenameByPath( folder ) } )
                }
                this.#ftpConfig.disconnectWhenError && ( this.disconnect() );
                return Ofn.setResponseKO( `SFTP Rmdir failed: ${errArray[0]}.`, { folder, ftp: errArray } );
            } );
    }

    disconnect() {
        return this.#ftpClient.end()
            .then( () => Ofn.setResponseOK() )
            .catch( err => {
                let errArray = err.toString().split( '\r\n' );
                return Ofn.setResponseKO( `SFTP Disconnect failed: ${errArray[0]}.`, { ftp: errArray } )
            } );
    }

    async uploadOne( filepathFrom, filepathTo = '' ) {
        const sftpConnect = await this.connect();
        if( ! sftpConnect.status ) { return sftpConnect; }

        const sftpUpload = await this.upload( filepathFrom, filepathTo );
        if( ! sftpUpload.status ) { return sftpUpload; }

        this.disconnect();

        return sftpUpload;
    }
}

module.exports = OroSftp;