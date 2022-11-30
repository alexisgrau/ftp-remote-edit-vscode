import { Client } from 'ssh2';
import FtpClient = require('ftp');
import * as fs from 'fs';

export class FtpHelper{

	public connectFtp(credentials): Promise<any>{
		return new Promise((c, e) => {
			const client = new FtpClient();
			client.on('ready', () => {
				c(client);
			});

			client.on('error', err => {
				e('Error while connecting check your credentials');
				return;
			});

			client.connect({
				host: credentials.host,
				port: credentials.port,
				user: credentials.user,
				password: credentials.password
			});
		});
	}

	public readdirFtp(client, remotePath): Promise<Array<any>> {
		return new Promise((c, e) => {
			client.list(remotePath, function(err, list){
				if(err){ 
					e('Error while getting file list from server');
					return;
				}
				c(list);
			});
		});
	}

	public fastGetFtp(client, remoteFile, localFile): Promise<void> {
		return new Promise((c, e) => {
			client.get(remoteFile, function(err, stream) {
				if(err){ 
					e('Error while getting file from server');
					return;
				}
				stream.once('close', function() { c(); });
				stream.pipe(fs.createWriteStream(localFile));
			});
		});
	}

	public mkDirFtp(client, remoteDir): Promise<void> {
		return new Promise((c, e) => {
			client.mkdir(remoteDir, false, function(err) {
				if(err){ 
					e('Error while creating folder on server');
					return;
				}
				c();
			});
		});
	}

	public rmDirFtp(client, remoteDir): Promise<void> {
		return new Promise((c, e) => {
			client.rmdir(remoteDir, true, function(err) {
				if(err){ 
					e('Error while removing folder on server');
					return;
				}
				c();
			});
		});
	}

	public writeFileFtp(client, remoteFile, bufferContent): Promise<void>{
		return new Promise((c, e) => {
			client.put(bufferContent, remoteFile, err => {
				if(err){ 
					e('Error while writing file from server');
					return;
				}
				c();
			});
		});
	}

	public unlinkFtp(client, remotePath): Promise<void> {
		return new Promise((c, e) => {
			client.delete(remotePath, err => {
				if(err){ 
					e('Error while writing file from server');
					return;
				}
				c();
			});
		});
	}

	public connect(credentials): Promise<any> {
		return new Promise((c, e) => {
			const client = new Client();
			client.on('ready', () => {
				c(client);
			});

			client.on('error', err => {
				e('Error while connecting check your credentials');
				return;
			});

			client.connect({
				host: credentials.host,
				port: credentials.port,
				username: credentials.user,
				password: credentials.password
			});
		});

	}

	public getSftp(client): Promise<any>{
		return new Promise((c, e) => {
			client.sftp((err, sftp) => {
				if(err){
					client.end();
					e('Error while getting sftp object');
					return;
				}
				c(sftp);
			});
		});
	}

	public getRemoteFileStat(sftp, remotePath): Promise<any>{
		return new Promise((c, e) => {
			sftp.stat(remotePath, (err, file) => {
				if(!err && file && file.mtime){
					c(file); 
					return;
				}
				e('Error while getting remote file informations');
			});
		});	
	}

	public writeFile(sftp, remotePath, fileContent): Promise<void>{
		return new Promise((c, e) => {
			sftp.writeFile(remotePath, fileContent, {}, err => {
				if(err){ 
					e('Error while writing file on server');
					return;
				}
				setTimeout(() => { c(); }, 100);
			});
		});
	}

	public unlink(sftp, remotePath): Promise<void> {
		return new Promise((c, e) => {
			sftp.unlink(remotePath, err => {
				if(err){ 
					e('Error while deleting file on server');
					return;
				}
				setTimeout(() => { c(); }, 100);
			});
		});
	}

	public fastGet(sftp, remoteFile, localFile): Promise<void> {
		return new Promise((c, e) => {
			sftp.fastGet(remoteFile, localFile, {}, err => {
				if(err){ 
					e('Error while downloading');
					return;
				}
				setTimeout(() => { c(); }, 100);
			});
		});
	}

	public readdir(sftp, remotePath): Promise<Array<any>> {
		return new Promise((c, e) => {
			sftp.readdir(remotePath, (err: string, list) => {
				if (err) { 
					e('Error while reading remote folder content');
					return;
				}
				c(list);
			});
		});
	}

	public mkDir(sftp, remoteDir: string): Promise<void>{
		return new Promise((c, e) => {
			sftp.mkdir(remoteDir, (err: string) => {
				if (err) { 
					e('Error while creating folder on server');
					return;
				}
				c();
			});
		});
	}

	public rmDir(sftp, remoteDir: string): Promise<void>{
		return new Promise((c, e) => {
			sftp.rmdir(remoteDir, (err: string) => {
				if (err) {
					e('Error while removing folder on server');
					return;
				}
				c();
			});
		});
	}
}