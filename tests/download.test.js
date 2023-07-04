const OSFtp = require( '../index' );
const fsExtra = require( 'fs-extra' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

const FTP_FOLDER = 'test-download';

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.mkdir( `${FTP_FOLDER}/test`, true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, `${FTP_FOLDER}/python2.pdf` );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, `${FTP_FOLDER}/test/python2-copy.pdf` );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.disconnect();
});

//

describe('download OSFtp', () => {
    test( 'download and no connected', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const response = await ftpClient.download(
            `${FTP_FOLDER}/python2.pdf`,
            `${__dirname}/zpython-copy.pdf`
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'UNCONNECTED' );
        expect( response.error.msg ).toBe(
            'SFTP Download failed: FtpConnectionError: connection status is not yet connected.'
        );
    } );

    test( 'download bad file-from name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.download(
            `${FTP_FOLDER}/pthon2.pdf`,
            `${__dirname}/zpython-copy.pdf`
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe( `SFTP Download failed: No such file ${FTP_FOLDER}/pthon2.pdf.` );
    } );

    test( 'download bad folder-to name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.download(
            `${FTP_FOLDER}/python2.pdf`,
            `${__dirname}/chacho/zpython-copy.pdf`
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe( 'SFTP Download failed: Folder (From) to download not exist.' );
    } );

    test( 'download simple one param', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.download(
            `${FTP_FOLDER}/python2.pdf`
        );
        await ftpClient.disconnect();

        const existsFile = await fsExtra.exists( `${process.cwd()}/python2.pdf` );
        if( existsFile ) { await fsExtra.remove( `python2.pdf` ); }

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'python2.pdf' );
        expect( response.filepath ).toBe( Ofn.sanitizePath(
            `${process.cwd()}/python2.pdf`
        ) );
        expect( existsFile ).toBe( true );
    } );

    test( 'download absolute', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.download(
            `${FTP_FOLDER}/python2.pdf`,
            `${__dirname}/zpython-copy.pdf`
        );
        await ftpClient.disconnect();

        const existsFile = await fsExtra.exists( `${__dirname}/zpython-copy.pdf` );
        if( existsFile ) { await fsExtra.remove( `${__dirname}/zpython-copy.pdf` ); }

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'zpython-copy.pdf' );
        expect( response.filepath ).toBe( Ofn.sanitizePath( `${__dirname}/zpython-copy.pdf` ) );
        expect( existsFile ).toBe( true );
    } );

    test( 'download relative', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.download(
            `${FTP_FOLDER}/python2.pdf`,
            `../python2-copy.pdf`
        );
        await ftpClient.disconnect();

        const existsFile = await fsExtra.exists( `../python2-copy.pdf` );
        if( existsFile ) { await fsExtra.remove( `../python2-copy.pdf` ); }

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'python2-copy.pdf' );
        expect( response.filepath ).toBe(
            Ofn.sanitizePath( `${Ofn.getFolderByPath( process.cwd() )}/python2-copy.pdf` )
        );
        expect( existsFile ).toBe( true );
    } );

});

//endregion
