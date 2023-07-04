import OSFtp from '../index';
import Ofn from 'oro-functions';

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

const FTP_FOLDER = 'test-move';

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.mkdir( `${FTP_FOLDER}/test`, true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, `${FTP_FOLDER}/python2.pdf` );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.disconnect();
});

//

describe('move OSFtp', () => {
    test( 'move and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const response = await ftpClient.move( undefined, undefined );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'UNCONNECTED' );
        expect( response.error.msg ).toBe(
            'SFTP Move failed: FtpConnectionError: connection status is not yet connected.'
        );
    } );

    test( 'move bad file-from', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.move(
            `${FTP_FOLDER}/pthon2.pdf`,
            `${FTP_FOLDER}/python2-copy.pdf`
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe(
            `SFTP Move failed: No such file From: ${FTP_FOLDER}/pthon2.pdf To: ${FTP_FOLDER}/python2-copy.pdf.`
        );
    } );

    test( 'move bad file-to', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.move(
            `${FTP_FOLDER}/python2.pdf`,
            `${FTP_FOLDER}/chacho/python2-copy.pdf`
        );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe(
            `SFTP Move failed: No such file From: ${FTP_FOLDER}/python2.pdf To: ${FTP_FOLDER}/chacho/python2-copy.pdf.`
        );
    } );

    test( 'move simple', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const responseMove = await ftpClient.move(
            `${FTP_FOLDER}/python2.pdf`,
            `${FTP_FOLDER}/python2-copy.pdf`
        );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/` );
        await ftpClient.disconnect();

        expect( responseMove.status ).toBe( true );
        if( responseMove.status === false ) {
            return;
        }

        expect( responseMove.filename ).toBe( 'python2-copy.pdf' );
        expect( responseMove.filepath ).toBe( `${FTP_FOLDER}/python2-copy.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        expect( responseList.count ).toBe( 2 );

        expect( responseList.list[ 0 ].name ).toBe( 'python2-copy.pdf' );
        expect( responseList.list[ 0 ].path ).toBe( `${FTP_FOLDER}/python2-copy.pdf` );
        expect( responseList.list[ 0 ].type ).toBe( '-' );

        expect( responseList.list[ 1 ].name ).toBe( 'test' );
        expect( responseList.list[ 1 ].path ).toBe( `${FTP_FOLDER}/test` );
        expect( responseList.list[ 1 ].type ).toBe( 'd' );
    } );

    test( 'move to folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const responseMove = await ftpClient.move(
            `${FTP_FOLDER}/python2-copy.pdf`,
            `${FTP_FOLDER}/test/python2-cc.pdf`
        );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/` );
        const responseListFolder = await ftpClient.list( `${FTP_FOLDER}/test` );
        await ftpClient.disconnect();

        expect( responseMove.status ).toBe( true );
        if( responseMove.status === false ) {
            return;
        }

        expect( responseMove.filename ).toBe( 'python2-cc.pdf' );
        expect( responseMove.filepath ).toBe( `${FTP_FOLDER}/test/python2-cc.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        expect( responseList.count ).toBe( 1 );
        expect( responseList.list[ 0 ].name ).toBe( 'test' );
        expect( responseList.list[ 0 ].path ).toBe( `${FTP_FOLDER}/test` );
        expect( responseList.list[ 0 ].type ).toBe( 'd' );

        expect( responseListFolder.status ).toBe( true );
        if( responseListFolder.status === false ) {
            return;
        }

        expect( responseListFolder.count ).toBe( 1 );
        expect( responseListFolder.list[ 0 ].name ).toBe( 'python2-cc.pdf' );
        expect( responseListFolder.list[ 0 ].path ).toBe( `${FTP_FOLDER}/test/python2-cc.pdf` );
        expect( responseListFolder.list[ 0 ].type ).toBe( '-' );
    } );
});
