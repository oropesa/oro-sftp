const OSFtp = require( '../index' );
const fsExtra = require( 'fs-extra' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-upload', true );
    await ftpClient.mkdir( 'test-upload/test', true );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-upload', true );
    await ftpClient.delete( 'zpython.pdf' );
    await ftpClient.disconnect();
});

//

describe('upload OSFtp', () => {
    test( 'upload and no connected', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.upload( `${__dirname}/zpython.pdf`, 'test-upload/python.pdf' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Upload failed: Error: put: No SFTP connection available.' );
    } );

    test( 'upload bad file-from name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.upload( `${__dirname}/zpthon.pdf`, 'test-upload/python-copy.pdf' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Upload failed: File to upload not exist.' );
    } );

    test( 'upload bad folder-to name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.upload( `${__dirname}/zpython.pdf`, 'test-upload/chacho/python-copy.pdf' );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Upload failed: Error: put: No such file)/ );
    } );

    test( 'upload simple one param', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let responseUpload = await ftpClient.upload( `${__dirname}/zpython.pdf` );
        let responseList = await ftpClient.list();
        await ftpClient.disconnect();

        expect( responseUpload.status ).toBe( true );
        expect( responseUpload.filename ).toBe( 'zpython.pdf' );
        expect( responseUpload.filepath ).toBe( 'zpython.pdf' );

        expect( responseList.status ).toBe( true );

        let names = Ofn.arrayValuesByKey( responseList.list, 'name' );
        expect( names.includes( 'zpython.pdf' ) ).toBe( true );
    } );

    test( 'upload absolute', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let responseUpload = await ftpClient.upload( `${__dirname}/zpython.pdf`, 'test-upload/python-copy.pdf' );
        let responseList = await ftpClient.list( 'test-upload/' );
        await ftpClient.disconnect();

        expect( responseUpload.status ).toBe( true );
        expect( responseUpload.filename ).toBe( 'python-copy.pdf' );
        expect( responseUpload.filepath ).toBe( 'test-upload/python-copy.pdf' );

        expect( responseList.status ).toBe( true );

        let names = Ofn.arrayValuesByKey( responseList.list, 'name' );
        expect( names.includes( 'python-copy.pdf' ) ).toBe( true );
    } );

    test( 'upload to folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let responseUpload = await ftpClient.upload( `${__dirname}/zpython.pdf`, 'test-upload/test/python-cc.pdf' );
        let responseList = await ftpClient.list( 'test-upload/test' );
        await ftpClient.disconnect();

        expect( responseUpload.status ).toBe( true );
        expect( responseUpload.filename ).toBe( 'python-cc.pdf' );
        expect( responseUpload.filepath ).toBe( 'test-upload/test/python-cc.pdf' );

        expect( responseList.status ).toBe( true );
        expect( responseList.count ).toBe( 1 );
        expect( responseList.list[ 0 ].name ).toBe( 'python-cc.pdf' );
        expect( responseList.list[ 0 ].path ).toBe( 'test-upload/test/python-cc.pdf' );
    } );

    test( 'upload relative', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await fsExtra.copy( `${__dirname}/zpython2.pdf`, `../python2.pdf` );

        await ftpClient.connect();
        let responseUpload = await ftpClient.upload( `../python2.pdf`, 'test-upload/python2.pdf' );
        let responseList = await ftpClient.list( 'test-upload/' );
        await ftpClient.disconnect();

        await fsExtra.remove( `../python2.pdf` );

        expect( responseUpload.status ).toBe( true );
        expect( responseUpload.filename ).toBe( 'python2.pdf' );
        expect( responseUpload.filepath ).toBe( 'test-upload/python2.pdf' );

        expect( responseList.status ).toBe( true );

        let names = Ofn.arrayValuesByKey( responseList.list, 'name' );
        expect( names.includes( 'python2.pdf' ) ).toBe( true );
    } );

    test( 'upload one', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.uploadOne( `${__dirname}/zpython.pdf`, 'test-upload/python-one.pdf' );

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'python-one.pdf' );
        expect( response.filepath ).toBe( 'test-upload/python-one.pdf' );
    } );
});

//endregion
