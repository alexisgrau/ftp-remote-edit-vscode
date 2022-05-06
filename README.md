# <img src="media/git-icon.png" alt="OpenTelemetry Icon" width="45" height=""> FTP-Remote-Edit for VS Code

* [About](#about)
* [Features](#features)
* [Warning](#warning)
* [Install Extension](#install-extension)
* [Extension commands](#extension-commands)
* [Local development](#local-development)
* [Contributing](#contributing)

## About

Editing files directly on your SFTP server without creating a local workspace. No need to download all files of your remote project. Simply connect and edit your remote files. The files will be automatically uploaded to your server upon saving.

## Features

- [x] Edit and save server list
- [x] Explore remote SFTP server direcly in VS Code
- [x] Edit your remote single files without donwloading them all
- [x] Automatic upload when saving files

## Warning

Plugin under development. Please use with caution on non-production servers. I cannot be held responsible for any data loss on your SFTP servers.

## Install Extension

Download the [latest version](https://github.com/alexisgrau/ftp-remote-edit-vscode/releases/latest/download/ftp-remote-edit-vscode.vsix).
Open VS Code, press F1, copy paste "workbench.extensions.action.installVSIX" or type "install vsix" in the field, windows explorer opens select downloaded file.

## Extension commands

This extension contributes the following commands to the Command palette :

- onCommand:ftpExplorer.addServer
- onCommand:ftpExplorer.openFtpResource
- onCommand:ftpExplorer.deleteEntry
- onCommand:ftpExplorer.newFile
- onCommand:ftpExplorer.refresh

## Local development

### Getting started

```sh
git clone https://github.com/alexisgrau/ftp-remote-edit-vscode.git
cd ftp-remote-edit-vscode
npm install
```

Now you can edit the code and create new features

### Test your changes

From VS Code you can run the extension under the debugger by pressing F5. This opens a new VS Code window with your extension loaded. Output from your extension shows up in the Debug Console. You can set break points, step through your code, and inspect variables either in the Debug view or the Debug Console.

### Build your extension

Open a Terminal in the extension folder then type :

```sh
npm run bundle
```

## Contributing

To contribute to the project :
- make a fork of my repository
- follow the flow as described in local development above, just change repository url
- Create a new banch as "issue-(issue id)" [link to issues](https://github.com/alexisgrau/ftp-remote-edit-vscode/issues)
- write your code to fulfill the issue
- follow the code style of the project, including indentation, and documentation
- pay attention to write good descriptive commits
- when issue is complete send your pull request

