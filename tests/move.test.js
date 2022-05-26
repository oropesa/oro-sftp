const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-move', true );
    await ftpClient.mkdir( 'test-move/test', true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-move/python2.pdf' );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-move', true );
    await ftpClient.disconnect();
});

//

describe('move OSFtp', () => {
    test( 'move and no connected' , async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.move();

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Move failed: Error: rename: No SFTP connection available.' );
    } );

    test( 'move bad file-from', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.move( 'test-move/pthon2.pdf', 'test-move/python2-copy.pdf' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Move failed: Error: rename: No such file)/ );
    } );

    test( 'move bad file-to', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.move( 'test-move/python2.pdf', 'test-move/chacho/python2-copy.pdf' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Move failed: Error: rename: No such file)/ );
    } );

    test( 'move simple', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let responseMove = await ftpClient.move( 'test-move/python2.pdf', 'test-move/python2-copy.pdf' );
        let responseList = await ftpClient.list( 'test-move/' );
        await ftpClient.disconnect();

        expect( responseMove.status ).toBe( true );
        expect( responseMove.filename ).toBe( 'python2-copy.pdf' );
        expect( responseMove.filepath ).toBe( 'test-move/python2-copy.pdf' );
        expect( responseMove.filepathFrom ).toBe( 'test-move/python2.pdf' );

        expect( responseList.status ).toBe( true );
        expect( responseList.count ).toBe( 2 );

        expect( responseList.list[ 0 ].name ).toBe( 'python2-copy.pdf' );
        expect( responseList.list[ 0 ].path ).toBe( 'test-move/python2-copy.pdf' );
        expect( responseList.list[ 0 ].type ).toBe( '-' );

        expect( responseList.list[ 1 ].name ).toBe( 'test' );
        expect( responseList.list[ 1 ].path ).toBe( 'test-move/test' );
        expect( responseList.list[ 1 ].type ).toBe( 'd' );
    } );

    test( 'move to folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let responseMove = await ftpClient.move( 'test-move/python2-copy.pdf', 'test-move/test/python2-cc.pdf' );
        let responseList = await ftpClient.list( 'test-move/' );
        let responseListFolder = await ftpClient.list( 'test-move/test' );
        await ftpClient.disconnect();

        expect( responseMove.status ).toBe( true );
        expect( responseMove.filename ).toBe( 'python2-cc.pdf' );
        expect( responseMove.filepath ).toBe( 'test-move/test/python2-cc.pdf' );
        expect( responseMove.filepathFrom ).toBe( 'test-move/python2-copy.pdf' );

        expect( responseList.status ).toBe( true );
        expect( responseList.count ).toBe( 1 );
        expect( responseList.list[ 0 ].name ).toBe( 'test' );
        expect( responseList.list[ 0 ].path ).toBe( 'test-move/test' );
        expect( responseList.list[ 0 ].type ).toBe( 'd' );

        expect( responseListFolder.status ).toBe( true );
        expect( responseListFolder.count ).toBe( 1 );
        expect( responseListFolder.list[ 0 ].name ).toBe( 'python2-cc.pdf' );
        expect( responseListFolder.list[ 0 ].path ).toBe( 'test-move/test/python2-cc.pdf' );
        expect( responseListFolder.list[ 0 ].type ).toBe( '-' );
    } );
});
