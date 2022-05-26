const OSFtp = require( '../index' );
const Ofn = require( 'oro-functions' );

//

const FTPCONFIG_BAD = { host: 'http://ftp-fake.oropensando.com', port: 22, user: 'chacho', password: 'loco' };
const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

jest.setTimeout( 20 * 1000 );

//

describe('get OSFtp parent clientFTP', () => {
    test( 'client is SftpClient', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        let clientFTP = ftpClient.getClient();
        expect( clientFTP.constructor.name ).toBe( 'SftpClient' );
    } );
});

describe('init Bad OSFtp', () => {
    test( 'new OSFtp( undefined )', async () => {
        const ftpClient = new OSFtp();

        const connected = await ftpClient.connect();

        expect( connected.status ).toBe( false );
        expect( connected.tryAgain ).toBe( undefined );
        expect( connected.error.msg ).toBe( `SFTP Connect failed: ftpConfig is empty.` );
    } );

    test( 'new OSFtp( bad-config )', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_BAD );

        const connected = await ftpClient.connect();

        expect( connected.status ).toBe( false );
        expect( connected.tryAgain ).toBe( true );
        expect( connected.error.msg ).toBe(
            `SFTP Connect failed: Error: connect->getConnection: client-socket error. Address lookup failed for host ${FTPCONFIG_BAD.host}.` );
    } );

    test( 'new OSFtp( timeout-config )', async () => {
        const customConfig = Object.assign( { readyTimeout: 1 }, FTPCONFIG_DEFAULT );
        const ftpClient = new OSFtp( customConfig );

        const connected = await ftpClient.connect();

        expect( connected.status ).toBe( false );
        expect( connected.tryAgain ).toBe( true );
        expect( connected.error.msg ).toBe(
            `SFTP Connect failed: Error: connect->getConnection: Timed out while waiting for handshake.` );
    } );
});

describe('init OSFtp', () => {
    test( 'new OSFtp( config )', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const connected = await ftpClient.connect();
        const disconnected = await ftpClient.disconnect();

        expect( connected.status ).toBe( true );
        expect( disconnected.status ).toBe( true );
    } );
});

describe('init OSFtp and disconnect when error', () => {
    test( 'init and auto-disconnect', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const connected = await ftpClient.connect();
        await ftpClient.rmdir( 'connect2', false, true );
        const mkdir = await ftpClient.mkdir( 'connect2' );

        expect( connected.status ).toBe( true );
        expect( mkdir.status ).toBe( false );
    } );

    test( 'init and avoid auto-disconnect', async () => {
        const config = Ofn.cloneObject( FTPCONFIG_DEFAULT );
        config.disconnectWhenError = false;

        const ftpClient = new OSFtp( config );

        const connected = await ftpClient.connect();
        await ftpClient.rmdir( 'connect1', false, true );
        const mkdir = await ftpClient.mkdir( 'connect1' );
        await ftpClient.rmdir( 'connect1' );
        await ftpClient.disconnect();

        expect( connected.status ).toBe( true );
        expect( mkdir.status ).toBe( true );
    } );
});