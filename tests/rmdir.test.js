const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-rmdir', true );
    await ftpClient.mkdir( 'test-rmdir/chacho', true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-rmdir/chacho/python2.pdf' );
    await ftpClient.mkdir( 'test-rmdir/test', true );
    await ftpClient.mkdir( 'test-rmdir/foo/bar/baz', true );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-rmdir', true );
    await ftpClient.disconnect();
});

//

describe('rmdir OSFtp', () => {
    test( 'rmdir and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.rmdir( 'test-rmdir/chacho' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Rmdir failed: Error: rmdir: No SFTP connection available.' );
    } );

    test( 'rmdir folder null', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.rmdir( null );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Rmdir failed: param folder is required.' );
    } );

    test( 'rmdir folder not exist', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.rmdir( 'test-rmdir/loco' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.msg ).toBe( 'Folder not found.' );
        expect( response.foldername ).toBe( 'loco' );
        expect( response.folderpath ).toBe( 'test-rmdir/loco' );
    } );

    test( 'rmdir folder not exist strict', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.rmdir( 'test-rmdir/loco', true, true );
        await ftpClient.disconnect();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(FTP Rmdir failed: Error: rmdir: Bad path:)/ )
    } );

    test( 'rmdir folder with content', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.rmdir( 'test-rmdir/chacho' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(FTP Rmdir failed: Error: rmdir: Failure)/ )
    } );

    test( 'rmdir folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.rmdir( 'test-rmdir/test' );

        expect( response.status ).toBe( true );
        expect( response.foldername ).toBe( 'test' );
        expect( response.folderpath ).toBe( 'test-rmdir/test' );

        await ftpClient.disconnect();
    } );

    test( 'rmdir folder in folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.rmdir( 'test-rmdir/foo/bar/baz' );

        expect( response.status ).toBe( true );
        expect( response.foldername ).toBe( 'baz' );
        expect( response.folderpath ).toBe( 'test-rmdir/foo/bar/baz' );

        await ftpClient.disconnect();
    } );
});
