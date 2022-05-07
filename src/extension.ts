'use strict';

import * as vscode from 'vscode';
import { FtpExplorer } from './ftpExplorer';
import { SettingsPanel } from './SettingsPanel';

export async function activate(context: vscode.ExtensionContext) {
	new FtpExplorer(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('ftpExplorer.addServer', () => { SettingsPanel.createOrShow(context); })
	);

}