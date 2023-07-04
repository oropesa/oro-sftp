import OSFtp from '../index';
import fsExtra from 'fs-extra';
import Ofn from 'oro-functions';

//

const FTPCONFIG_DEFAULT = Ofn.getFileJsonRecursivelySync( `${__dirname}/config.json` );

const FTP_FOLDER = 'test-upload-ts';

beforeAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.mkdir( `${FTP_FOLDER}/test`, true );
    await ftpClient.disconnect();
});

afterAll(async () => {
    const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );
    await ftpClient.connect();
    await ftpClient.rmdir( FTP_FOLDER, true );
    await ftpClient.delete( 'zpython.pdf' );
    await ftpClient.disconnect();
});

//

describe('upload OSFtp', () => {
    test( 'upload and no connected', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const response = await ftpClient.upload( `${__dirname}/zpython.pdf`, `${FTP_FOLDER}/python.pdf` );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'UNCONNECTED' );
        expect( response.error.msg ).toBe(
            'SFTP Upload failed: FtpConnectionError: connection status is not yet connected.'
        );
    } );

    test( 'upload bad file-from name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.upload( `${__dirname}/zpthon.pdf`, `${FTP_FOLDER}/python-copy.pdf` );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe( 'SFTP Upload failed: File (From) to upload not exist.' );
    } );

    test( 'upload bad folder-to name', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const response = await ftpClient.upload( `${__dirname}/zpython.pdf`, `${FTP_FOLDER}/chacho/python-copy.pdf` );

        expect( response.status ).toBe( false );
        if( response.status === true ) {
            return;
        }

        expect( response.error.code ).toBe( 'ENOTFOUND' );
        expect( response.error.msg ).toBe( `SFTP Upload failed: No such file ${FTP_FOLDER}/chacho/python-copy.pdf.` );
    } );

    test( 'upload simple one param', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const responseUpload = await ftpClient.upload( `${__dirname}/zpython.pdf` );
        const responseList = await ftpClient.list();
        await ftpClient.disconnect();

        expect( responseUpload.status ).toBe( true );
        if( responseUpload.status === false ) {
            return;
        }

        expect( responseUpload.filename ).toBe( 'zpython.pdf' );
        expect( responseUpload.filepath ).toBe( 'zpython.pdf' );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        const names = Ofn.arrayValuesByKey( responseList.list, 'name' );
        expect( names.includes( 'zpython.pdf' ) ).toBe( true );
    } );

    test( 'upload absolute', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const responseUpload = await ftpClient.upload( `${__dirname}/zpython.pdf`, `${FTP_FOLDER}/python-copy.pdf` );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/` );
        await ftpClient.disconnect();

        expect( responseUpload.status ).toBe( true );
        if( responseUpload.status === false ) {
            return;
        }

        expect( responseUpload.filename ).toBe( 'python-copy.pdf' );
        expect( responseUpload.filepath ).toBe( `${FTP_FOLDER}/python-copy.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        const names = Ofn.arrayValuesByKey( responseList.list, 'name' );
        expect( names.includes( 'python-copy.pdf' ) ).toBe( true );
    } );

    test( 'upload to folder', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await ftpClient.connect();
        const responseUpload = await ftpClient.upload( `${__dirname}/zpython.pdf`, `${FTP_FOLDER}/test/python-cc.pdf` );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/test` );
        await ftpClient.disconnect();

        expect( responseUpload.status ).toBe( true );
        if( responseUpload.status === false ) {
            return;
        }

        expect( responseUpload.filename ).toBe( 'python-cc.pdf' );
        expect( responseUpload.filepath ).toBe( `${FTP_FOLDER}/test/python-cc.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        expect( responseList.count ).toBe( 1 );
        expect( responseList.list[ 0 ].name ).toBe( 'python-cc.pdf' );
        expect( responseList.list[ 0 ].path ).toBe( `${FTP_FOLDER}/test/python-cc.pdf` );
    } );

    test( 'upload relative', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        await fsExtra.copy( `${__dirname}/zpython2.pdf`, `../python2.pdf` );

        await ftpClient.connect();
        const responseUpload = await ftpClient.upload( `../python2.pdf`, `${FTP_FOLDER}/python2.pdf` );
        const responseList = await ftpClient.list( `${FTP_FOLDER}/` );
        await ftpClient.disconnect();

        await fsExtra.remove( `../python2.pdf` );

        expect( responseUpload.status ).toBe( true );
        if( responseUpload.status === false ) {
            return;
        }

        expect( responseUpload.filename ).toBe( 'python2.pdf' );
        expect( responseUpload.filepath ).toBe( `${FTP_FOLDER}/python2.pdf` );

        expect( responseList.status ).toBe( true );
        if( responseList.status === false ) {
            return;
        }

        const names = Ofn.arrayValuesByKey( responseList.list, 'name' );
        expect( names.includes( 'python2.pdf' ) ).toBe( true );
    } );

    test( 'upload one', async () => {
        const ftpClient = new OSFtp( FTPCONFIG_DEFAULT );

        const response = await ftpClient.uploadOne( `${__dirname}/zpython.pdf`, `${FTP_FOLDER}/python-one.pdf` );

        expect( response.status ).toBe( true );
        if( response.status === false ) {
            return;
        }

        expect( response.filename ).toBe( 'python-one.pdf' );
        expect( response.filepath ).toBe( `${FTP_FOLDER}/python-one.pdf` );
    } );
});

//endregion
