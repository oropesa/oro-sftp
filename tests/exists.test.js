const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-exists', true );
    await ftpClient.mkdir( 'test-exists' );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-exists/python2.pdf' );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-exists', true );
    await ftpClient.disconnect();
});

//

describe('exists OSFtp', () => {
    test( 'exists and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.exists();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Exists failed: Error: exists: No SFTP connection available.' );
    } );

    test( 'exists bad file-from', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.exists( 'pthon2.pdf' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( false );
        expect( response.filename ).toBe( 'pthon2.pdf' );
        expect( response.filepath ).toBe( 'pthon2.pdf' );
    } );

    test( 'exists file-from', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.exists( 'test-exists/python2.pdf' );
        let responseList = await ftpClient.list( 'test-exists' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'python2.pdf' );
        expect( response.filepath ).toBe( 'test-exists/python2.pdf' );
        expect( response.type ).toBe( '-' );

        expect( responseList.status ).toBe( true );
        expect( responseList.count ).toBe( 1 );

        expect( responseList.list[ 0 ].name ).toBe( 'python2.pdf' );
        expect( responseList.list[ 0 ].path ).toBe( 'test-exists/python2.pdf' );
        expect( responseList.list[ 0 ].type ).toBe( '-' );

    } );
});
