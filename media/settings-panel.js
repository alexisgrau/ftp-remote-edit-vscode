document.addEventListener('DOMContentLoaded', function(){
	
	const vscode = acquireVsCodeApi();
	vscode.postMessage({ command: 'get_server_list' });
	let serversname = document.querySelector('select[name="servers_name"]');
	let savehost = document.querySelector('button[name="save_host"]');
	let newhost = document.querySelector('button[name="new_host"]');
	let deletehost = document.querySelector('button[name="delete_host"]');
	let closepanel = document.querySelector('button[name="close_panel"]');
	let servername = document.querySelector('input[name="server_name"]');
	let host = document.querySelector('input[name="host"]');
	let port = document.querySelector('input[name="port"]');
	let user = document.querySelector('input[name="user"]');
	let password = document.querySelector('input[name="password"]');
	let root = document.querySelector('input[name="root"]');

	let hosts = null;

	window.addEventListener('message', event => {
		const message = event.data;
		if(message.command == 'server_list'){
			hosts = message.value;
			fillserversname();
			loadHost(Object.keys(hosts)[0]);
		}
	});

	function fillserversname(selected = ''){
		if(!hosts){ return; }
		serversname.innerHTML = '';
		for(const host in hosts){
			let option = document.createElement('option');
			option.innerText = host;
			option.value = host;
			if(selected == host){ option.selected = true; }
			serversname.appendChild(option);
		}
	}

	serversname.addEventListener('change', event => {
		if(hosts){ loadHost(event.target.value); }
	});

	closepanel.addEventListener('click', event => {
		vscode.postMessage({ command: 'close_panel' });
	});

	deletehost.addEventListener('click', event => {
		if(!hosts){ return; }
		delete hosts[serversname.value];
		fillserversname();
		loadHost(Object.keys(hosts)[0]);
		vscode.postMessage({ command: 'update_server_list', value: hosts });
	});

	savehost.addEventListener('click', event => {
		if(!hosts){ return; }
		if(!host.value){ return; }
		if(!user.value){ return; }
		if(!port.value){ return; }
		if(!root.value){ return; }

		hosts[servername.value] = {
			"host" : host.value, 
			"user" : user.value,
			"password": password.value,
			"port": port.value,
			"root": root.value
		};
		if(servername.oldname && servername.oldname != servername.value){
			delete hosts[servername.oldname];
			servername.oldname = '';
		}
		fillserversname(servername.value);
		vscode.postMessage({ command: 'update_server_list', value: hosts });
	});

	newhost.addEventListener('click', event => {
		servername.value = 'Nouveau serveur '+(Object.keys(hosts).length+1);
		servername.oldname = '';
		host.value = '';
		port.value = '';
		user.value = '';
		password.value = '';
		root.value = '';
	});

	function loadHost(hostName){
		if(!hosts){ return; }
		if(hosts.hasOwnProperty(hostName)){
			servername.value = hostName;
			servername.oldname = hostName;
			host.value = hosts[hostName].host;
			port.value = hosts[hostName].port;
			user.value = hosts[hostName].user;
			password.value = hosts[hostName].password;
			root.value = hosts[hostName].root;
		}
	}
});