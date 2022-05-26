const OSFtp = require( '../index' );
const fsExtra = require( 'fs-extra' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-download', true );
    await ftpClient.mkdir( 'test-download/test', true );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-download/python2.pdf' );
    await ftpClient.upload( `${__dirname}/zpython2.pdf`, 'test-download/test/python2-copy.pdf' );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( 'test-download', true );
    await ftpClient.disconnect();
});

//

describe('download OSFtp', () => {
    test( 'download and no connected', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let response = await ftpClient.download( 'test-download/python2.pdf', `${__dirname}/zpython-copy.pdf` );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Download failed: Error: get: No SFTP connection available.' );
    } );

    test( 'download bad file-from name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.download( 'test-download/pthon2.pdf', `${__dirname}/zpython-copy.pdf` );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toMatch( /(SFTP Download failed: Error: get: No such file)/ );
    } );

    test( 'download bad folder-to name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.download( 'test-download/python2.pdf', `${__dirname}/chacho/zpython-copy.pdf` );

        expect( response.status ).toBe( false );
        expect( response.error.msg ).toBe( 'SFTP Download failed: Folder to download not exist.' );
    } );

    test( 'download simple one param', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.download( 'test-download/python2.pdf' );
        await ftpClient.disconnect();

        let existsFile = await fsExtra.exists( `${process.cwd()}/python2.pdf` );
        if( existsFile ) { await fsExtra.remove( `python2.pdf` ); }

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'python2.pdf' );
        expect( response.filepath ).toBe( Ofn.sanitizePath( `${process.cwd()}/python2.pdf` ) );
        expect( existsFile ).toBe( true );
    } );

    test( 'download absolute', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.download( 'test-download/python2.pdf', `${__dirname}/zpython-copy.pdf` );
        await ftpClient.disconnect();

        let existsFile = await fsExtra.exists( `${__dirname}/zpython-copy.pdf` );
        if( existsFile ) { await fsExtra.remove( `${__dirname}/zpython-copy.pdf` ); }

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'zpython-copy.pdf' );
        expect( response.filepath ).toBe( Ofn.sanitizePath( `${__dirname}/zpython-copy.pdf` ) );
        expect( existsFile ).toBe( true );
    } );

    test( 'download relative', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        let response = await ftpClient.download( 'test-download/python2.pdf', `../python2-copy.pdf` );
        await ftpClient.disconnect();

        let existsFile = await fsExtra.exists( `../python2-copy.pdf` );
        if( existsFile ) { await fsExtra.remove( `../python2-copy.pdf` ); }

        expect( response.status ).toBe( true );
        expect( response.filename ).toBe( 'python2-copy.pdf' );
        expect( response.filepath ).toBe( Ofn.sanitizePath( `${Ofn.getFolderByPath( process.cwd() )}/python2-copy.pdf` ) );
        expect( existsFile ).toBe( true );
    } );

});

//endregion
