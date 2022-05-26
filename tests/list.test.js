const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.mkdir( 'test-list/test', true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-list/python2.pdf' );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-list', true );
    await ftpClient.disconnect();
});
//

describe('list OSFtp', () => {
    test( 'list and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.list();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP List failed: Error: list: No SFTP connection available.' );
    } );

    test( 'list simple', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.list( 'test-list' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.count ).toBe( 2 );

        expect( response.list[ 0 ].name ).toBe( 'python2.pdf' );
        expect( response.list[ 0 ].path ).toBe( 'test-list/python2.pdf' );
        expect( response.list[ 0 ].type ).toBe( '-' );

        expect( response.list[ 1 ].name ).toBe( 'test' );
        expect( response.list[ 1 ].path ).toBe( 'test-list/test' );
        expect( response.list[ 1 ].type ).toBe( 'd' );

    } );

    test( 'list simple start dot', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.list( './test-list' );
        await ftpClient.disconnect();

        expect( response.status ).toBe( true );
        expect( response.count ).toBe( 2 );

        expect( response.list[ 0 ].name ).toBe( 'python2.pdf' );
        expect( response.list[ 0 ].path ).toBe( 'test-list/python2.pdf' );
        expect( response.list[ 0 ].type ).toBe( '-' );

        expect( response.list[ 1 ].name ).toBe( 'test' );
        expect( response.list[ 1 ].path ).toBe( 'test-list/test' );
        expect( response.list[ 1 ].type ).toBe( 'd' );
    } );

    test( 'list details', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let responseListEmpty = await ftpClient.list( 'test-list/test' );

        await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-list/test/python2-copy.pdf' );

        let responseListTest = await ftpClient.list( 'test-list/test' );
        await ftpClient.disconnect();

        //

        expect( responseListEmpty.status ).toBe( true );
        expect( responseListEmpty.count ).toBe( 0 );

        //

        expect( responseListTest.status ).toBe( true );
        expect( responseListTest.count ).toBe( 1 );

        expect( responseListTest.list[ 0 ].name ).toBe( 'python2-copy.pdf' );
        expect( responseListTest.list[ 0 ].path ).toBe( 'test-list/test/python2-copy.pdf' );
        expect( responseListTest.list[ 0 ].type ).toBe( '-' );

        let fileKeys = Object.keys( responseListTest.list[ 0 ] );
        expect( fileKeys.includes( 'name' ) ).toBe( true );
        expect( fileKeys.includes( 'path' ) ).toBe( true );
        expect( fileKeys.includes( 'type' ) ).toBe( true );
        expect( fileKeys.includes( 'date' ) ).toBe( true );
        expect( fileKeys.includes( 'size' ) ).toBe( true );
        expect( fileKeys.includes( 'rights' ) ).toBe( true );
        expect( fileKeys.includes( 'owner' ) ).toBe( true );
        expect( fileKeys.includes( 'group' ) ).toBe( true );

        let rightKeys = Object.keys( responseListTest.list[ 0 ].rights );

        expect( rightKeys.includes( 'user' ) ).toBe( true );
        expect( rightKeys.includes( 'group' ) ).toBe( true );
        expect( rightKeys.includes( 'other' ) ).toBe( true );
    } );
});
