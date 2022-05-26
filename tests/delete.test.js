const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-delete', true );
    await ftpClient.mkdir( 'test-delete', true );
    await ftpClient.mkdir( 'test-delete/chacho', true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-delete/python2.pdf' );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-delete/chacho/python2-copy.pdf' );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-delete', true );
    await ftpClient.disconnect();
});

//

describe('delete OSFtp', () => {
    test( 'delete and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.delete();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Delete failed: Error: delete: No SFTP connection available.' );
    } );

    test( 'delete bad file strict', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.delete( 'test-delete/pthon2.pdf', true );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Delete failed: Error: delete: No such file)/ );
    } );

    test( 'delete bad file', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.delete( 'test-delete/pthon2.pdf' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'pthon2.pdf' );
        expect( response.filepath ).toBe( 'test-delete/pthon2.pdf' );
    } );

    test( 'delete bad folder with file', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.delete( 'test-delete/chacho' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Delete failed: Error: delete: Failure)/ );
    } );

    test( 'delete file', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.delete( 'test-delete/python2.pdf' );

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'python2.pdf' );
        expect( response.filepath ).toBe( 'test-delete/python2.pdf' );

        response = await ftpClient.list( 'test-delete/' );

        expect( response.status ).toBe( true );
        expect( response.count ).toBe( 1 );

        expect( response.list[ 0 ].name ).toBe( 'chacho' );
        expect( response.list[ 0 ].path ).toBe( 'test-delete/chacho' );
        expect( response.list[ 0 ].type ).toBe( 'd' );

        await ftpClient.disconnect();
    } );

    test( 'delete file of folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.delete( 'test-delete/chacho/python2-copy.pdf' );

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'python2-copy.pdf' );
        expect( response.filepath ).toBe( 'test-delete/chacho/python2-copy.pdf' );

        response = await ftpClient.list( 'test-delete/chacho' );

        expect( response.status ).toBe( true );
        expect( response.count ).toBe( 0 );

        await ftpClient.disconnect();
    } );

    test( 'delete folder empty', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.delete( 'test-delete/chacho' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Delete failed: Error: delete: Failure)/ );
    } );
});
