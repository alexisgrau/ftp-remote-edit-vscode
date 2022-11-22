import * as vscode from "vscode";

export class SettingsPanel {
	public static currentPanel: SettingsPanel | undefined;

	public static readonly viewType = "settings";

	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private readonly _extensionContext: vscode.ExtensionContext;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionContext: vscode.ExtensionContext) {
		const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

		if (SettingsPanel.currentPanel) {
			SettingsPanel.currentPanel._panel.reveal(column);
			SettingsPanel.currentPanel._update();
			return;
		}
		const panel = vscode.window.createWebviewPanel(
			SettingsPanel.viewType,
			"FTP Remote explorer settings",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [extensionContext.extensionUri],
			}
		);

		SettingsPanel.currentPanel = new SettingsPanel(panel, extensionContext);
	}

	public static kill() {
		SettingsPanel.currentPanel?.dispose();
		SettingsPanel.currentPanel = undefined;
	}

	public static revive(panel: vscode.WebviewPanel, extensionContext: vscode.ExtensionContext) {
		SettingsPanel.currentPanel = new SettingsPanel(panel, extensionContext);
	}

	private constructor(panel: vscode.WebviewPanel, extensionContext: vscode.ExtensionContext) {
		this._panel = panel;
		this._extensionUri = extensionContext.extensionUri;
		this._extensionContext = extensionContext;
		this._update();
		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
	}

	public dispose() {
		SettingsPanel.currentPanel = undefined;
		this._panel.dispose();

		while (this._disposables.length) {
			const x = this._disposables.pop();
			if (x) { x.dispose(); }
		}
	}

	public getNonce() {
		let text = "";
		const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) { text += possible.charAt(Math.floor(Math.random() * possible.length)); }
		return text;
	}

	private async _update() {
		const webview = this._panel.webview;

		this._panel.webview.html = this._getHtmlForWebview(webview);
		webview.onDidReceiveMessage(async (data) => {

			if (data.command == 'get_server_list') {
				this._extensionContext.secrets.get(`ftpRemoteEdit.servers`).then(servers => {
					if (servers == undefined) { servers = '{}'; }
					webview.postMessage({ command: 'server_list', value: JSON.parse(servers) });
				});
			}
			if (data.command == 'update_server_list') {
				this._extensionContext.secrets.store("ftpRemoteEdit.servers", JSON.stringify(data.value));
				vscode.commands.executeCommand('ftpExplorer.refresh');
			}
			if (data.command == 'close_panel') {
				this.dispose();
			}
		});
	}

	private _getHtmlForWebview(webview: vscode.Webview) {

		const stylePath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "settings-panel.css"));
		const scriptPath = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, "media", "settings-panel.js"));
		const nonce = this.getNonce();

		return `
	<!DOCTYPE html>
	<html lang="fr">
		<head>
			<meta charset="UTF-8">
			<meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource}; script-src 'nonce-${nonce}';">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<link href="${stylePath}" rel="stylesheet">
			<script nonce="${nonce}" src="${scriptPath}"></script>
		</head>
		<body>
			<h1>Servers settings</h1>
			<p class="info_text">You can edit each connection at the time. Changes will only be saved by pushing the save button.</p>
			<div class="action_bar_top">
				<select name="servers_name"></select><button name="new_host">New</button><button name="delete_host">Delete</button>
			</div>
			<div class="form_row">
				<div>
					<label>The name of the server</label>
					<input type="text" name="server_name" placeholder="New server name">
				</div>
			</div>
			<div class="form_row">
				<div>
					<label>The hostname or IP address of the server</label>
					<input type="text" name="host" placeholder="localhost">
				</div>
				<div>
					<label>Port</label>
					<input type="text" name="port" placeholder="21">
				</div>
			</div>
			<div class="form_row">
				<div>
					<label>Protocol</label>
					<select name="protocol">
						<option value="sftp">SSH - File transfer Protocol</option>
						<option value="ftp">FTP - File transfer Protocol</option>
					</select>
				</div>
			</div>
			<div class="form_row">
				<div>
					<label>Username for authentication</label>
					<input type="text" name="user" placeholder="user">
				</div>
			</div>
			<div class="form_row">
				<div>
					<label>Password/Passphrase for authentication</label>
					<input type="password" name="password" placeholder="password">
				</div>
			</div>
			<div class="form_row">
				<div>
					<label>Initial path</label>
					<input type="text" name="root" placeholder="/var/www">
				</div>
			</div>
			<div class="action_bar_bottom">
				<button name="save_host">Save</button><button name="close_panel">Cancel</button>
			</div>
		</body>
	</html>
	`;
	}
}