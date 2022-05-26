const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-mkdir', true );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-mkdir', true );
    await ftpClient.disconnect();
});

//

describe('mkdir OSFtp', () => {
    test( 'mkdir and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.mkdir( 'test-mkdir' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Mkdir failed: Error: mkdir: mkdir: No SFTP connection available.' );
    } );

    test( 'mkdir folder null', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( null );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Mkdir failed: param folder is required.' );
    } );

    test( 'mkdir folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( 'test-mkdir' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.foldername ).toBe( 'test-mkdir' );
        expect( response.folderpath ).toBe( 'test-mkdir' );
    } );

    test( 'mkdir folder already exists', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( 'test-mkdir' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.msg ).toBe( 'Folder already exists.' );
        expect( response.foldername ).toBe( 'test-mkdir' );
        expect( response.folderpath ).toBe( 'test-mkdir' );
    } );

    test( 'mkdir folder already exists strict', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( 'test-mkdir', true, true );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Mkdir failed: Folder already exists.)/ )
    } );

    test( 'mkdir folder not recursive', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( 'test-mkdir/chacho/loco/tio', false );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Mkdir failed: Error: mkdir: Bad path:)/ )
    } );

    test( 'mkdir folder recursive', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( 'test-mkdir/chacho/loco/tio' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.foldername ).toBe( 'tio' );
        expect( response.folderpath ).toBe( 'test-mkdir/chacho/loco/tio' );
    } );

    test( 'mkdir subfolder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( 'test-mkdir/loco' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.foldername ).toBe( 'loco' );
        expect( response.folderpath ).toBe( 'test-mkdir/loco' );
     } );

    test( 'mkdir subfolder dot', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.mkdir( './test-mkdir/tio' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.foldername ).toBe( 'tio' );
        expect( response.folderpath ).toBe( 'test-mkdir/tio' );
    } );
});
