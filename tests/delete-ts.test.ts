import OSFtp from '../index';
import Ofn from 'oro-functions';

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

const FTP_FOLDER = 'test-delete-ts';

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.mkdir( FTP_FOLDER, true );
    await ftpClient.mkdir( `${FTP_FOLDER}/chacho`, true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, `${FTP_FOLDER}/python2.pdf` );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, `${FTP_FOLDER}/chacho/python2-copy.pdf` );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.disconnect();
});

//

describe('delete OSFtp', () => {
    test( 'delete and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const response = await ftpClient.delete( undefined );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'UNCONNECTED' );
        expect( response.error.msg ).toBe(
            'SFTP Delete failed: FtpConnectionError: connection status is not yet connected.'
        );
    } );

    test( 'delete bad file strict', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.delete(
            `${FTP_FOLDER}/pthon2.pdf`,
            true
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe( `SFTP Delete failed: No such file ${FTP_FOLDER}/pthon2.pdf.` );
    } );

    test( 'delete bad file', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.delete(
            `${FTP_FOLDER}/pthon2.pdf`
        );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'pthon2.pdf' );
        expect( response.filepath ).toBe( `${FTP_FOLDER}/pthon2.pdf` );
    } );

    test( 'delete bad folder with file', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.delete(
            `${FTP_FOLDER}/chacho`
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTEMPTY' );
        expect( response.error.msg ).toBe( `SFTP Delete failed: Failure ${FTP_FOLDER}/chacho.` );
    } );

    test( 'delete file', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.delete( `${FTP_FOLDER}/python2.pdf` );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/` );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'python2.pdf' );
        expect( response.filepath ).toBe( `${FTP_FOLDER}/python2.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        expect( responseList.count ).toBe( 1 );
        expect( responseList.list[ 0 ].name ).toBe( 'chacho' );
        expect( responseList.list[ 0 ].path ).toBe( `${FTP_FOLDER}/chacho` );
        expect( responseList.list[ 0 ].type ).toBe( 'd' );
    } );

    test( 'delete file of folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.delete( `${FTP_FOLDER}/chacho/python2-copy.pdf` );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/chacho` );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'python2-copy.pdf' );
        expect( response.filepath ).toBe( `${FTP_FOLDER}/chacho/python2-copy.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        expect( responseList.count ).toBe( 0 );
    } );

    test( 'delete folder empty', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.delete( `${FTP_FOLDER}/chacho` );
        const responseList = await ftpClient.list( `${FTP_FOLDER}` );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return
        }

        expect( response.filename ).toBe( 'chacho' );
        expect( response.filepath ).toBe( `${FTP_FOLDER}/chacho` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return
        }

        expect( responseList.count ).toBe( 0 );
    } );
});
