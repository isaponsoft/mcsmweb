<html>
<head>
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
	<style>
	html {
		background-color: #333;
		color: #0f0;
	}

	body {
		margin: 0;
		padding: 0;
	}

	a {
		color: #fff;
		text-decoration: none;
	}

	#containor {
		flex-direction: column;
		padding: 0;
		margin: 0;
	}

	#header {
		padding: 0.5em;
		text-align: center;
		box-sizing: border-box;
	}

	#main {
		display: flex;
		flex-direction: row;
		flex-grow: 1;
	}

	#sidebar {
		width: 15em;
		color: #000;
		padding: 0;
		background-color: #fff;
		box-sizing: border-box;
	}

	#content {
		display: flex;
		flex-direction: column;
		flex-grow: 1;
	}

	.content-header {
		padding-left: 1em;
		background-color: #050;
	}

	.content-body {
		padding-left: 1em;
		background-color: #070;
	}

	#developper {
		padding: 1em;
		color: #fff;
		text-align: center;
		background-color: #111;
	}

	#operator {
		padding: 1em;
		text-align: center;
		color: #fff;
		background-color: #000;
	}

	ul {
		padding: 0;
	}

	table {
		margin: 1em auto 1em;
		width: 300px;
		border-collapse: collapse;
	}

	td {
		border-bottom: solid 1px #333;
		padding: 0.5em;
	}

	td.param-name {
		width: 120px;
	}

	.system-info {
		font-family: fantasy;
	}

	.param-name {
		text-align: right;
	}

	.param-value {
		text-align: center;
	}

	.param-number {
		text-align: right;
	}

	#server-programs li {
		text-align: center;
		font-size: 0.8em;
		padding: 0.2em 0.4em;
		list-style-type : none;
	}

	#server-alives li {
		text-align: center;
		font-size: 0.8em;
		padding: 0.2em 0.4em;
		list-style-type : none;
	}

	.server-selector p {
		margin: 0;
		padding: 0;
	}

	.server-status-active {
		color: #090;
		font-weight: bold;
	}

	.server-status-deactive {
		color: #000;
	}

	.mcframe {
		background-color: #ddd;
		border-left: solid 2px #eee;
		border-top: solid 2px #eee;
		border-right: solid 2px #999;
		border-bottom: solid 3px #999;
		box-shadow: 0px 0px 0px 2px #111;
		color: #000;
		text-decoration: none;
	}

	input {
		border: solid 1px #fff;
		padding: 0.4em;
	}


	button {
		background-color: #6f6f6f;
		border-left: solid 2px #a7a7a7;
		border-top: solid 2px #a7a7a7;
		border-right: solid 2px #5a5b5b;
		border-bottom: solid 3px #5a5b5b;
		box-shadow: 0px 0px 0px 2px #0a0a0a;
		color: #fff;
		padding: 0.5em 5em;
		text-decoration: none;
	}

	button:hover {
		box-shadow: 0px 0px 0px 2px #fff;
	}

	.button-play {
		background-color: #3e8a4c;
		box-shadow: 0px 0px 0px 2px #0a0a0a;
		border: solid 2px #316d42;
		border-top: solid 2px #64cb55;
		color: #fff;
		padding: 0.5em 5em;
		text-decoration: none;
	}

	.button-play:hover {
		box-shadow: 0px 0px 0px 2px #000;
	}

	.button-play:active {
		box-shadow: 0px 0px 0px 2px #fff;
	}

	dialog table {
		color: #000;
	}

	dialog td {
		border: none;
	}

	dialog input {
		background-color: #986;
		border-left: solid 2px #543;
		border-top: solid 2px #543;
		border-right: solid 2px #543;
		border-bottom: solid 2px #543;
		box-shadow: 0 0 2px 0px #fff inset;
		color: #fff;
	}

	dialog .note {
		color: #080;
	}

	dialog input:active {
		box-shadow: 0 0 2px 0px #fff inset;
	}

	#server-programs button {
		width: 100%;
	}

	#server-alives button {
		width: 100%;
	}

	</style>
</head>
<body>
<div id="containor">
	<div id="header">
		<h1><img src="header.png" /></h1>
	</div>
	<!-- main contents { -->
	<div id="main">
		<div id="sidebar">
			<div>Server program</div>
			<ul id="server-programs">
				<li id="menu-program-download" class="program-download"><button class="button-play">DOWNLOAD</button></li>
			</ul>
			<div>World</div>
			<ul id="server-alives">
				<li id="menu-server-create" class="server-create"><button class="button-play">新規作成</button></li>
			</ul>
		</div>
		<div id="content">
			<div class="content-header">
				<p>サーバーマシンの状態</p>
			</div>
			<div class="content-body">
				<table class="mcframe system-info"><tbody>
					<tr><td class="param-name">HOSTNAME</td><td class="param-value"><p id="machine-hostname">HOSTNAME</p></div>
					<tr><td class="param-name">IP ADDRESS</td><td class="param-value"><p id="machine-ipaddress">0.0.0.0</p></div>
					<tr><td class="param-name">CPU CORES</td><td class="param-value"><p id="machine-cpu-cores">0/0</p></div>
					<tr><td class="param-name">CPU USAGE</td><td class="param-value"><p id="machine-cpu-usages">0%</p></div>
					<tr><td class="param-name">TOTAL MEMORY</td><td class="param-value"><p id="machine-memory-total">0</p></div>
					<tr><td class="param-name">USING MEMORY</td><td class="param-value"><p id="machine-memory-using">0</p></div>
					<tr><td class="param-name">FREE MEMORY</td><td class="param-value"><p id="machine-memory-free">0</p></div>
				</tbody></table>
			</div>

			<div class="content-header">
				<p>サーバープロセスの状態</p>
			</div>
			<div id="server-status" class="content-body">
			</div>
		</div>
	</div>
	<!-- } main contents -->
	<div id="operator">
		<p>運営チーム</p>
		<a href="http://github">twitter</a>
		<a href="http://github">youtube</a>
	</div>
	<div id="developper">
		<p>サーバー管理システムの開発者を支援する</p>
		<a href="http://github">github</a>
		<a href="http://github">twitter</a>
		<a href="http://github">youtube</a>
	</div>
</div>
</body>
<!-- ********************************************************************************* -->
<template id="tmpl-server-list">
	<li class="server-selector"><button class="world-status"></p></li>
</template>
<!--------------------------------------------------------------------------------------->
<template id="tmpl-program-selector">
	<li class="program-selector"><button class="program-status"></button></li>
</template>
<!--------------------------------------------------------------------------------------->
<template id="tmpl-server-info">
	<table class="mcframe system-info"><tbody>
		<tr><td class="param-name">SERVERNAME</td><td class="param-value"><p id="server-name"></p></div>
		<tr><td class="param-name">ADDRESS</td><td class="param-value"><p id="server-address"></p></div>
		<tr><td class="param-name">ALIVE</td><td class="param-value"><p id="server-alive"></p></div>
		<tr><td class="param-name">VERSION</td><td class="param-value"><p id="server-version"></p></div>
		<tr><td class="param-name">DESCRIPTION</td><td class="param-value"><p id="server-description"></p></div>
		<tr><td class="param-name">PLAYERS</td><td class="param-value"><p id="server-players">0/0</p></div>
		<tr><td class="param-name">ONLINE PLAYERS</td><td class="param-value"><p id="server-player-list"></p></div>
	</tbody></table>
	<menu>
		<button class="button-server-start" data-servername>Start</button>
		<button class="button-server-stop" data-servername>Stop</button>
		<button class="button-server-delete" data-servername>Delete</button>
	</menu>
</template>
<!--------------------------------------------------------------------------------------->
<template id="tmpl-program-info">
	<table class="mcframe system-info"><tbody>
		<tr><td class="param-name">TYPE</td><td class="param-value"><p class="val-program-name"></p></div>
		<tr><td class="param-name">VERSION</td><td class="param-value"><p class="val-program-ver"></p></div>
		<tr><td class="param-name">STATE</td><td class="param-value"><p class="val-program-state"></p></div>
	</tbody></table>
	<menu>
		<button class="button-program-delete" data-type data-ver>Delete</button>
		<button class="button-program-rebuild" data-type data-ver>Rebuild</button>
	</menu>
</template>
<!-- ********************************************************************************* -->
<dialog id="dialog-program-download" class="mcframe">
<div>
	<form method="dialog">
	<table><tbody>
		<tr><td>TYPE</td><td><input type="text" name="type" value="spigot" /><p class="note">vanilla(comming soon), spigot, bukkit(comming soon)</p></div>
		<tr><td>VERSION</td><td><input type="text" name="ver" value="" /><p class="note">ex) 1.19.1</p></div>
	</tbody></table>
	<menu>
		<button value="cancel">Cancel</button>
		<button id="btn-program-download" value="upgrade" class="button-play">Upgrade</button>
	</menu>
	</form>
</div>
</dialog>
<!-- --------------------------------------------------------------------------------- -->
<dialog id="dialog-program-download-connecting" class="mcframe">
<div>
	<p id="dialog-program-download-connecting-state"></p>
</div>
</dialog>
<!-- --------------------------------------------------------------------------------- -->
<dialog id="dialog-create" class="mcframe">
<div>
	<form method="dialog">
	<table><tbody>
		<tr><td>WORLDID</td><td><input type="text" name="id" /><p class="note">A-Z a-z 0-9 _ -</p></div>
		<tr><td>PORT</td><td><input type="text" name="port" value="25565" /><p class="note">25565</p></div>
		<tr><td>SEED</td><td><input type="text" name="seed" value="AUTO"/><p class="note">AUTO or 0-9A-F</p></div>
		<tr><td>PROGRAM TYPE</td><td><input type="text" name="type" value="spigot"/></div>
		<tr><td>PROGRAM VER</td><td><input type="text" name="ver" value="1.19.1"/></div>
	</tbody></table>
	<menu>
		<button value="cancel">Cancel</button>
		<button id="btn-server-create" class="button-play">Create</button>
	</menu>
	</form>
</div>
</dialog>
<!-- ********************************************************************************* -->
<script>

/*********************************************************
 * Library
 *********************************************************/

// each elements.
const	eachelm			= function (dom, selectors, f)
{
	const	items	= dom.querySelectorAll(selectors);
	for (var i = 0; i < items.length; i++)
	{
		f(items[i]);
	}
}

// ajax call
// params = {
//		type:	POST, GET
//		url:
//		data: {
//			key: value,
//			key: value,
//		}
// }
const	ajaxcall		= function (method, url, data)
{
	const	ajax	= class {
		constructor(params)
		{
			this.params	= params;
			this.done_callback		= (res) => {};
			this.error_callback		= (res) => {};
			this.fail_callback		= (res) => {};
			this.finish_callback	= (res) => {};
		}
		go ()
		{
			fetch(this.params.url, {
					method:		this.params.type,
					cache:		'no-cache',
					headers:	{
						'Accept':		'application/json',
						'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
					},
					body:		new URLSearchParams(data)
				})
				.then(response => response.json())
				.then(response => {
					if (response.status_code)
					{
						this.error_callback(response);
					}
					else
					{
						this.done_callback(response);
					}
					this.finish_callback(this.params);
					return;
				})
				.catch(err => {
					this.fail_callback(err);
					this.finish_callback(this.params);
				});
		}
		done (callback) 
		{
			this.done_callback	= callback;
			return	this;
		}
		error (callback)
		{
			this.error_callback	= callback;
			return	this;
		}
		fail (callback)
		{
			this.fail_callback	= callback;
			return	this;
		}
		finish (callback)
		{
			this.finish_callback	= callback;
			return	this;
		}
	};
	var		req	= new ajax({
		'type':	method,
		'url':	url,
		'data':	data
	});
	req.go();
	return	req;
}


const	UpgradeDialog	= document.getElementById('dialog-program-download');



const	program_show	= function (dom_id, program)
{
	const 	item	= document.importNode(document.querySelector('#tmpl-program-info').content, true);
	const	parent	= document.getElementById(dom_id);
	while (parent.firstChild)
	{
		parent.removeChild(parent.firstChild);
	}
	item.querySelector('.val-program-name').innerHTML		= program.type;
	item.querySelector('.val-program-ver').innerHTML		= program.ver;
	item.querySelector('.val-program-state').innerHTML		= program.state;
	eachelm(item, '.button-program-delete .button-program-rebuild', (e) =>
	{
		e.dataset.type	= program.type;
		e.dataset.ver	= program.ver;
	});
	eachelm(item, '.button-program-delete', (e) =>
	{
		e.addEventListener('click', () =>
		{
			program_delete(program.type, program.ver);
		});
	});
	eachelm(item, '.button-program-rebuild', (e) =>
	{
		e.addEventListener('click', () =>
		{
			program_upgrade(program.type, program.ver);
		});
	});
	parent.appendChild(item);
};

const	program_delete	= function (type, ver)
{
	document.getElementById('dialog-program-download-connecting').showModal();
	document.getElementById('dialog-program-download-connecting-state').innerText	= 'Connecting...';
	ajaxcall('POST', 'program/remove', {
		'type':	type,
		'ver': ver,
	}).done(function(res) {
		if (res.status_code != 0)
		{
			document.getElementById('dialog-program-download-connecting').close();
			alert('Deelete server error');
		}
		setInterval(function ()
		{
			document.getElementById('dialog-program-download-connecting').close();
			programlist();
		}, 500);
	}).fail(function(XMLHttpRequest, status, e){
		document.getElementById('dialog-program-download-connecting').close();
		alert('Deelete server error');
	});
};

const	program_upgrade	= function (type, ver)
{
	document.getElementById('dialog-program-download-connecting').showModal();
	document.getElementById('dialog-program-download-connecting-state').innerText	= 'Connecting...';
	ajaxcall('POST', 'program/upgrade', {
		'type':	type,
		'ver': ver,
	}).done(function(res) {
		if (res.status_code != 0)
		{
			document.getElementById('dialog-program-download-connecting').close();
			alert('Upgrade server error');
		}
		setInterval(function ()
		{
			document.getElementById('dialog-program-download-connecting').close();
			programlist();
		}, 500);
	}).fail(function(XMLHttpRequest, status, e){
		document.getElementById('dialog-program-download-connecting').close();
		alert('Upgrade server error');
	});
};

const	programlist	= function ()
{
	let id = $("#main").val();
	ajaxcall('POST', "program/listup", {
	}).done(function (res) {
		var		box	= document.getElementById('server-programs');
		$('.program-selector').remove();

		var		programs	= res.programs;
		for (var i = 0; i < programs.length; i++)
		{
			const	program		= programs[i];
			const 	item		= document.importNode(document.querySelector('#tmpl-program-selector').content, true);
			item.querySelector('.program-status').innerHTML		= program.type + "&nbsp;" + program.ver;
			if (program.state == 'OK')
			{
				item.querySelector('button').classList.add('button-play');
			}
			item.querySelector('li').addEventListener('click', function ()
			{
				program_show('server-status', program);
			});
			document.getElementById('server-programs').appendChild(item);
	    }
	});
};


const	server_create	= function (id, port, seed, type, ver)
{
	document.getElementById('dialog-program-download-connecting').showModal();
	document.getElementById('dialog-program-download-connecting-state').innerText	= 'Connecting...';
	ajaxcall('POST', "world/create", {
		'id':	id,
		'port':	port,
		'seed':	seed,
		'type':	type,
		'ver': ver,
	}).done(function(res) {
		if (res.status_code != 0)
		{
			document.getElementById('dialog-program-download-connecting').close();
			alert('Deelete server error');
		}
		setInterval(function ()
		{
			document.getElementById('dialog-program-download-connecting').close();
			programlist();
		}, 500);
	}).error(function(res){
		document.getElementById('dialog-program-download-connecting').close();
		alert('Deelete server error');
	}).fail(function(res){
		document.getElementById('dialog-program-download-connecting').close();
		alert('Deelete server error');
	});
}


programlist();

// program upgrade
document.getElementById('menu-program-download').addEventListener('click', function onOpen()
{
	UpgradeDialog.showModal();
});
document.getElementById('btn-program-download').addEventListener('click', function onOpen()
{
	var	type	= '';
	var	ver		= '';

	var	inputs	= UpgradeDialog.querySelectorAll('input');
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'type')
		{
			type	= inputs[i].value;
		}
		if (inputs[i].name == 'ver')
		{
			ver	= inputs[i].value;
		}
	}

	program_upgrade(type, ver);
});

//

document.getElementById('menu-server-create').addEventListener('click', function onOpen()
{
	document.getElementById('dialog-create').showModal();
});


document.getElementById('btn-server-create').addEventListener('click', function onOpen()
{
	var	id		= '';
	var	port	= 25565;
	var	seed	= '';
	var	type	= '';
	var	ver		= '';

	var	inputs	= document.getElementById('dialog-create').querySelectorAll('input');
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'id')
		{
			id		= inputs[i].value;
		}
		if (inputs[i].name == 'port')
		{
			port	= inputs[i].value;
		}
		if (inputs[i].name == 'seed')
		{
			seed	= inputs[i].value;
		}
		if (inputs[i].name == 'type')
		{
			type	= inputs[i].value;
		}
		if (inputs[i].name == 'ver')
		{
			ver	= inputs[i].value;
		}
	}
	server_create(id, port, seed, type, ver);
});


const	server_start	= function (servername)
{
	let id = $("#main").val();
	ajaxcall('POST', 'server/start', {
		'servername': servername
	}).done(function(res) {
		servers_info_monitor();
	});
};

const	server_stop	= function (servername)
{
	let id = $("#main").val();
	ajaxcall('POST', 'server/stop', {
		'servername': servername
	}).done(function(res) {
		servers_info_monitor();
	});
};


var		currentServer	= null;

const	machine_status	= function ()
{
	ajaxcall('POST', 'machine/usages', {
	}).done(res => {
		document.getElementById('machine-hostname').textContent 	= res.usages.hostname;
		document.getElementById('machine-ipaddress').textContent 	= res.usages.ipaddress;
		document.getElementById('machine-cpu-cores').textContent 	= res.usages.cpu.cores + "/" + res.usages.cpu.threads;
		document.getElementById('machine-cpu-usages').textContent 	= (100 * res.usages.cpu.loadaverage[0] / res.usages.cpu.cores).toFixed() + "%(ave = " + res.usages.cpu.loadaverage[0].toFixed(2) + ")";

		document.getElementById('machine-memory-total').textContent	= Number((res.usages.mem.total / (1024*1024)).toFixed()).toLocaleString() + 'M';
		document.getElementById('machine-memory-using').textContent	= Number((res.usages.mem.using / (1024*1024)).toFixed()).toLocaleString() + 'M';
		document.getElementById('machine-memory-free').textContent	= Number(((res.usages.mem.total - res.usages.mem.using) / (1024*1024)).toFixed()).toLocaleString() + 'M';
	});
};


const	world_listup	= function ()
{
	let id = $("#main").val();
	ajaxcall('POST', 'world', {
	}).done(res => {
		var		box	= document.getElementById('server-alives');
		$('.server-selector').remove();

		var		worlds	= res.worlds;
		for (var world_id in worlds)
		{
			const	world		= worlds[world_id];
			const 	item		= document.importNode(document.querySelector('#tmpl-server-list').content, true);
			item.querySelector('.world-status').innerHTML 	= world_id;
			if (world.pid != 0)
			{
				item.querySelector('button').classList.add('button-play');
			}
			item.querySelector("li").dataset.serverName	= world_id;
			document.getElementById('server-alives').appendChild(item);

			$(box).on('click', '.server-selector', function() {
				currentServer	= $(this).data('serverName');
				server_info(currentServer);
			});
        }
	});
};

const	server_info	= function (world_id)
{
	ajaxcall('POST', 'world/state', {
		'id':	world_id
	}).done(function(res) {
		var		box	= document.getElementById('server-status');
		while (box.firstChild) {
			box.removeChild(box.firstChild);
		}

		const 	item		= document.importNode(document.querySelector('#tmpl-server-info').content, true);
		item.querySelector('#server-name').innerHTML 		= world_id;
		item.querySelector('#server-address').innerHTML 	= (res.minecraft.port == 25565) ? res.minecraft.hostname : (res.minecraft.hostname + ":" + res.minecraft.port);
		item.querySelector('#server-alive').innerHTML 		= res.minecraft.pid == 0 ? 'DOWN' : ('ACTIVE(PID=' + res.minecraft.pid + ')');

		if (res.minecraft.pid != 0)
		{
			var		info		= res.minecraft.info;
			var		descript	= '';
			for (var i = 0; i < info.description.extra.length; i++)
			{
				descript += info.description.extra[i].text + "<br />";
			}

			var		playerlist	= '';
			if ('sample' in info.players)
			{
				for (var i = 0; i < info.players.sample.length; i++)
				{
					playerlist += info.players.sample[i].name + "<br />";
				}
			}

			item.querySelector('#server-version').innerHTML 	= info.version.name;
			item.querySelector('#server-description').innerHTML	= descript;
			item.querySelector('#server-players').innerHTML		= info.players.online + "/" + info.players.max;
			item.querySelector('#server-player-list').innerHTML	= playerlist;

			item.querySelector(".button-server-start").style.display = 'none';
			item.querySelector(".button-server-stop").addEventListener('click', function onOpen()
			{
				server_stop(servername);
			});
			item.querySelector(".button-server-delete").style.display = 'none';
		}
		else
		{
			item.querySelector(".button-server-start").addEventListener('click', function onOpen()
			{
				server_start(servername);
			});
			item.querySelector(".button-server-stop").style.display = 'none';
			item.querySelector(".button-server-delete").addEventListener('click', function onOpen()
			{
				alert("Delete" + servername);
			});
		}
		box.appendChild(item);
	});
};

const	servers_info_monitor	= function ()
{
	if (currentServer != null)
	{
		server_info(currentServer);
	}
};

world_listup();


$(document).ready(function()
{
	machine_status();
/*
	machine_status();
	world_listup();

	setInterval(function () {
		machine_status();
		world_listup();
		servers_info_monitor();
	}, 5000);
*/
});
</script>
</html>
