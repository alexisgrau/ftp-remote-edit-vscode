import { Client } from 'ssh2';

export class FtpHelper{

	public connect(credentials): Promise<any> {
		return new Promise((c, e) => {
			const client = new Client();
			client.on('ready', () => {
				c(client);
			});

			client.on('error', error => {
				e('Error while connecting: ' + error.message);
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
				if(err){ e(); return; }
				c(sftp);
			});
		});
	}

	public getRemoteFileStat(sftp, remotePath): Promise<any>{
		return new Promise((c, e) => {
			sftp.stat(remotePath, (err, file) => {
				if(!err && file && file.mtime){
					c(file); return;
				}
				e(); 
			});
		});	
	}

	public writeFile(sftp, remotePath, fileContent): Promise<void>{
		return new Promise((c, e) => {
			sftp.writeFile(remotePath, fileContent, {}, err => {
				if(err){ e(err); return; }
				setTimeout(() => { c(); }, 100);
			});
		});
	}

	public unlink(sftp, remotePath): Promise<void> {
		return new Promise((c, e) => {
			sftp.unlink(remotePath, err => {
				if(err){ e(); return; }
				setTimeout(() => { c(); }, 100);
			});
		});
	}

	public fastGet(sftp, remoteFile, localFile): Promise<void> {
		return new Promise((c, e) => {
			sftp.fastGet(remoteFile, localFile, {}, err => {
				if(err){ e(); return; }
				setTimeout(() => { c(); }, 100);
			});
		});
	}

	public readdir(sftp, remotePath): Promise<Array<any>> {
		return new Promise((c, e) => {
			sftp.readdir(remotePath, (err: string, list) => {
				if (err) { return e(err); }
				c(list);
			});
		});
	}
}