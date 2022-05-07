import * as vscode from 'vscode';
import { basename, dirname, join } from 'path';
import * as os from 'os';
import * as fs from'fs';
import sanitize = require("sanitize-filename");
import { FtpHelper } from './FtpHelper';

export interface FtpNode {
	resource: vscode.Uri;
	isDirectory: boolean;
	label: any;
	credentials;
}

export interface RemoteFile {
	uri: vscode.Uri;
	remotePath: string;
	ftpnode: FtpNode;
	downloadTime: number;
}

export class FtpModel extends FtpHelper {

	private _extensionContext: vscode.ExtensionContext;
	private _hosts: object;

	constructor(extensionContext: vscode.ExtensionContext){
		super();
		this._extensionContext = extensionContext;
		return;
	}

	/**
	 * Called to empty _hosts variable and force reassignment
	 */

	public resetHosts(){
		this._hosts = null;
	}

	/**
	 * Create ftpNodes array with the _hosts variable
	 *
	 * @return A FtpNode array that contains information for generate node in treeview
	 */

	public returnRootsNodes():FtpNode[]{
		const ftpNodes = [];
		for (const serverName in this._hosts) {
			ftpNodes.push({
				resource: vscode.Uri.file(this._hosts[serverName]['root']), 
				isDirectory: true,
				label: serverName,
				credentials: this._hosts[serverName]
			});
		}
		return ftpNodes;
	}

	/**
	 * Retrieve servers list from secret var ftpRemoteEdit.servers 
	 * and initialize _hosts variable then return ftpNodes array
	 *
	 * @return A thenable that resolves whith ftpNodes array when _hosts is assigned
	 */

	public get roots(): Thenable<FtpNode[]> {
		return new Promise((c, e) => {
			if(!this._hosts){
				this._extensionContext.secrets.get(`ftpRemoteEdit.servers`).then(hosts => {
					if(hosts == undefined){ hosts = '{}';}
					this._hosts = JSON.parse(hosts);
					c(this.returnRootsNodes());
				});
			}
			else{
				c(this.returnRootsNodes());
			}
			
		});
	}

	/**
	 * Retrieve a list of files inside SFTP folder. Return children 
	 * in the form of an array of FtpNode
	 *
	 * @param node The ftpNode object which represents parent
	 * @return A thenable that resolves whith ftpNode child array
	 */

	public async getChildren(node: FtpNode): Promise<FtpNode[]> {

		const client = await this.connect(node.credentials);
		const sftp = await this.getSftp(client);
		const list = await this.readdir(sftp, node.resource.path);

		const ftpNodes = list.map(entry => {
			const rootPath = node.resource.path.slice(-1) == '/' ? node.resource.path.slice(0, -1) : node.resource.path;
			return {
				resource: vscode.Uri.file(rootPath +'/'+entry.filename),
				isDirectory: entry.longname.slice(0, 1) === 'd',
				label: false,
				credentials: node.credentials
			};
		});

		client.end();

		return this.sort(ftpNodes);
	}

	/**
	 * Sort ftpNodes array by type (folder or file) and name
	 *
	 * @param nodes the ftpnode array
	 * @return the sorted ftpnode array
	 */

	private sort(nodes: FtpNode[]): FtpNode[] {
		return nodes.sort((n1, n2) => {
			if (n1.isDirectory && !n2.isDirectory) {
				return -1;
			}

			if (!n1.isDirectory && n2.isDirectory) {
				return 1;
			}

			return basename(n1.resource.fsPath).localeCompare(basename(n2.resource.fsPath));
		});
	}

	/**
	 * Connect to the sftp server and download a file 
	 *
	 * @param nodes the ftpnode object that represent file to download on server
	 * @return A thenable that resolves whith RemoteFile an object that contains information about downloaded file and remote file
	 */

	public async openFile(node: FtpNode): Promise<RemoteFile> {

		const client = await this.connect(node.credentials);
		const sftp = await this.getSftp(client);

		const filename = basename(node.resource.path);
		const remoteFile = node.resource.path;

		const re = new RegExp('/', 'g');
		const localFolder = os.tmpdir() + "\\" + sanitize(node.credentials.host) + dirname(node.resource.path).replace(re, '\\');
		const localFile = localFolder + '\\' + filename;

		if (!fs.existsSync(localFolder)){
			fs.mkdirSync(localFolder, { recursive: true });
		}

		await this.fastGet(sftp, remoteFile, localFile);

		client.end();

		return({
			uri: vscode.Uri.file(localFile), 
			remotePath: remoteFile, 
			ftpnode: node, 
			downloadTime: Math.floor(Date.now()/1000)
		});
	}

	/**
	 * Connect to the sftp server and create or edit a file with content given
	 *
	 * @param remoteFile the remoteFile object that represent file to edit or create on server
	 * @param fileContent the content to put inside this file
	 * @return A thenable that resolves when remote file is created or edited
	 */

	public async uploadFile(remoteFile: RemoteFile, fileContent: string, force: any=false): Promise<void> {
		const client = await this.connect(remoteFile.ftpnode.credentials);
		const sftp = await this.getSftp(client);
		if (remoteFile.downloadTime != null && !force) {
			const stats = await this.getRemoteFileStat(sftp, remoteFile.remotePath).catch(e => {});
			if(stats['mtime'] > remoteFile.downloadTime){ throw new Error('error-file-changed'); }
		}
		await this.writeFile(sftp, remoteFile.remotePath, fileContent);
		remoteFile.downloadTime = Math.floor(Date.now()/1000) + 30;

		client.end();
		return;
	}

	/**
	 * Connect to the sftp server and delete a remote file
	 *
	 * @param node the ftpnode object that represent file to delete on server
	 * @return A thenable that resolves when remote file is deleted
	 */

	public async deleteFile(node: FtpNode): Promise<void> {
		const client = await this.connect(node.credentials);
		const sftp = await this.getSftp(client);
		await this.unlink(sftp, node.resource.path);
		client.end();
		return;
	}
}

export class FtpTreeDataProvider implements vscode.TreeDataProvider<FtpNode>{

	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	constructor(private readonly model: FtpModel) { }

	public refresh(): any {
		this.model.resetHosts();
		this._onDidChangeTreeData.fire(undefined);
	}

	public getTreeItem(element: FtpNode): vscode.TreeItem {
		return {
			resourceUri: element.resource,
			label : element.label,
			collapsibleState: element.isDirectory ? vscode.TreeItemCollapsibleState.Collapsed : void 0,
			contextValue: element.isDirectory ? 'folderitem' : 'fileitem',
			iconPath: !element.isDirectory ? void 0 : {
				light : join(__dirname, '..', 'resources', 'light', 'folder2.svg'),
				dark : join(__dirname, '..', 'resources', 'dark', 'folder2.svg'),
			},
			command: element.isDirectory ? void 0 : {
				command: 'ftpExplorer.openFtpResource',
				arguments: [element],
				title: 'Open file'
			}
		};
	}

	public getChildren(element?: FtpNode): FtpNode[] | Thenable<FtpNode[]> {
		return element ? this.model.getChildren(element) : this.model.roots;
	}

	public getParent(element: FtpNode): FtpNode {
		const parent = element.resource.with({ path: dirname(element.resource.path) });
		return parent.path !== '//' ? { resource: parent, isDirectory: true, label:false, credentials: element } : null;
	}

	public removeNode(element: FtpNode){
		this.model.deleteFile(element).then(msg => { this.refresh(); });
	}

	public addNode(element: FtpNode){
		const options: vscode.InputBoxOptions = { prompt: "", placeHolder: "Name of the new file" };
		vscode.window.showInputBox(options).then(value => {
			if (!value) return;		
			const re = new RegExp('/', 'g');
			const localFolder = os.tmpdir() + "\\" + sanitize(element.credentials.host) + dirname(element.resource.path).replace(re, '\\');
			const localFile = localFolder + '\\' + value;
			fs.writeFile(localFile,'', e => {
				if(!e){
					const remotefile:RemoteFile = {
						uri: vscode.Uri.file(localFile),
						remotePath: element.resource.path+'/'+value,
						ftpnode: element,
						downloadTime: null
					};
					this.model.uploadFile(remotefile, '').then(msg => {
						this.refresh();
					});
				}
			});
		});
	}
}

export class FtpExplorer {

	private remoteFilesEdited = [];

	constructor(context: vscode.ExtensionContext) {

		const ftpModel = new FtpModel(context);
		
		const treeDataProvider = new FtpTreeDataProvider(ftpModel);

		vscode.window.createTreeView('ftpExplorer', { treeDataProvider });

		vscode.commands.registerCommand('ftpExplorer.refresh', () => treeDataProvider.refresh());
		vscode.commands.registerCommand('ftpExplorer.deleteEntry', node => treeDataProvider.removeNode(node));
		vscode.commands.registerCommand('ftpExplorer.newFile', node => treeDataProvider.addNode(node));
		vscode.commands.registerCommand('ftpExplorer.openFtpResource', resource => ftpModel.openFile(resource).then(downloadedres => this.openResource(downloadedres)));

		vscode.workspace.onWillSaveTextDocument(event => {
			const remoteFile = this.isRemoteFile(event.document.uri);
			if(remoteFile != null){ 
				event.waitUntil(ftpModel.uploadFile(remoteFile, event.document.getText()).catch(e => {
					if(e.message == 'error-file-changed'){
						vscode.window
						.showInformationMessage("The file has been modified since the last download do you want to overwrite these modifications", "Yes", "No")
						.then(answer => {
							if (answer === "Yes") { ftpModel.uploadFile(remoteFile, event.document.getText(), true); }
						});
					}
				}));
			}
		});
	}

	private isRemoteFile(uri: vscode.Uri): RemoteFile{
		for (let i = 0; i < this.remoteFilesEdited.length; i++) {
			if(this.remoteFilesEdited[i].uri.fsPath == uri.fsPath){
				return this.remoteFilesEdited[i];
			}
		}
		return null;
	}

	private addEditedRemoteFile(remoteFile: RemoteFile): boolean{
		let included = false;
		for (let i = 0; i < this.remoteFilesEdited.length; i++) {
			if(this.remoteFilesEdited[i].remotePath == remoteFile.remotePath){
				included = true;
				break;
			}
		}
		if(!included){
			this.remoteFilesEdited.push(remoteFile);
			return true;
		}
		return false;
	}

	private openResource(remoteFile: RemoteFile): void {
		this.addEditedRemoteFile(remoteFile);
		vscode.window.showTextDocument(remoteFile.uri);
	}
}