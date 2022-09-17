var	world	= 'myworld';
var	worlds	= {};
var	eulack	= {};

var	skins	= {};


function updateWorldStatus(data)
{
	worlds[data.id]	= data;
	refreshWorldStatus(data.id);
	world_change(data.id);
}

function world_select(w)
{
	if ((world == w) && (document.querySelector('#content-world').style.display != 'none'))
	{
		world	= "";
		document.querySelector('#content-world').style.display = 'none';
		return;
	}
	world_change(w);
}

function world_change(w)
{
	if (!worlds[w])
	{
		for (var k in worlds)
		{
			if (worlds[k].setting['title'][1] == w)
			{
				w	= k;
				break;
			}
		}
	}

	world	= w;
	refreshWorldStatus(w);
	console_change(w);
	document.querySelector('#console-message').focus();
}

function refreshWorldStatus(sel)
{
	if (world != sel)
	{
		return;
	}

	if (!worlds[sel])
	{
		document.querySelector('#content-world').style.display = 'none';
		return;
	}


	document.querySelector('#content-world').style.display = 'block';

	const	select		= worlds[sel];
	const 	item		= document.querySelector('#world-status');
	document.querySelector('#world-status').style.display = "block";
	item.querySelector('.contents-header-title').innerText	= select.setting['title'][1];
	item.querySelector('#btn-stop').style.display = 'none';
	item.querySelector('#btn-run').style.display = 'none';
	item.querySelector('#btn-eula').style.display = 'none';
	item.querySelector('#btn-setting').style.display = 'none';
	item.querySelector('#btn-prop').style.display = 'none';
	item.querySelector('#btn-world-backup').style.display = 'none';
	item.querySelector('#btn-world-delete').style.display = 'none';

	item.querySelector('#world-status-motd').innerText = select.properties['motd'];
	item.querySelector('#world-status-dir').innerText = select.dir;
	item.querySelector('#world-status-program').innerText =
		(select.setting['program-type'][1] ? select.setting['program-type'][1] : select.setting['program-type'][0])
		+ " - " +
		(select.setting['program-ver'][1] ? select.setting['program-ver'][1] : select.setting['program-ver'][0]);
	item.querySelector('#world-status-status').innerText = translate["WORLD/STATUS/"+select.status];
	item.querySelector('#world-status-warnings').innerText = select.warnings.join(', ');
	item.querySelector('#world-status-port').innerText = select.properties['server-port'];

	item.querySelector('#world-status-players').innerText = 'ONLINE:0/MAX:'+select.properties['max-players'];
	item.querySelector('#world-status-login').innerText = "";
	if (select.ping && select.ping.players)
	{
		item.querySelector('#world-status-players').innerText = 'ONLINE:' + select.ping.players.online + "/MAX:" + select.ping.players.max;
		var		onlines	= [];
		const	box		= document.querySelector('#world-status-login');
		box.querySelectorAll('div').forEach((e) =>
		{
			e.remove();
		});
		if (select.ping.players.sample)
		{
			select.ping.players.sample.forEach((p) =>
			{
				const 	item		= document.importNode(document.querySelector('#tmpl-login-player').content, true);
				item.querySelector('.skin').src			= 'skins/' + p.id;
				item.querySelector('.name').innerHTML	= p.name;
				box.appendChild(item);
			});
		}
	}

	item.querySelector('#btn-eula').innerText	= eulack[select.id]
												? translate['DIALOG/WORLDSTATUS/EULA-BUTTON2']
												: translate['DIALOG/WORLDSTATUS/EULA-BUTTON'];
	if (select.warnings.find((val) => { return val == 'EULA NOTHING'; }))
	{
		item.querySelector('#btn-eula').style.display = 'block';
	}
	else if (select.status == 'stop')
	{
		item.querySelector('#btn-run').style.display = 'block';
		item.querySelector('#btn-setting').style.display = 'block';
		item.querySelector('#btn-prop').style.display = 'block';
		item.querySelector('#btn-world-backup').style.display = 'block';
		item.querySelector('#btn-world-delete').style.display = 'block';
	}

	if (select.status == 'active')
	{
		item.querySelector('#btn-stop').style.display = 'block';
	}

	console_change(sel);
}


document.querySelector('#btn-eula').addEventListener('click', () =>
{
	if (eulack[worlds[world].id])
	{
		send_command(':world/eula ' + worlds[world].id);
	}
	else
	{
		window.open(worlds[world].eula, '_blank');
		eulack[worlds[world].id]	= true;
		refreshWorldStatus(world);
	}
});

document.querySelector('#btn-run').addEventListener('click', () =>
{
	send_command(':world/run ' + worlds[world].id);
});

document.querySelector('#btn-stop').addEventListener('click', () =>
{
	send_command(':world/stop ' + worlds[world].id);
});

document.querySelector('#btn-setting').addEventListener('click', () =>
{
	const	dialog	= document.getElementById('dialog-world-setting');
	const	box		= dialog.querySelector('.input-frame');
	box.querySelectorAll('.element-edit').forEach((e) =>
	{
		e.remove();
	});
	const	w	= worlds[world];
	for (var key in w.setting)
	{
		const 	item		= document.importNode(document.querySelector('#tmpl-setting-editor').content, true);
		item.querySelector('.prop-name').innerHTML			= key;
		item.querySelector('.prop-value').name				= key;
		item.querySelector('.setting-default').innerText	= w.setting[key][0];
		item.querySelector('.prop-value').value				= w.setting[key][1];
		box.appendChild(item);
	}

	document.getElementById('dialog-world-setting').showModal();
	updateTranslated();
});

document.querySelector('#btn-prop').addEventListener('click', () =>
{
	const	dialog	= document.getElementById('dialog-edit');
	const	box		= dialog.querySelector('.input-frame');
	box.querySelectorAll('.element-edit').forEach((e) =>
	{
		e.remove();
	});
	const	w	= worlds[world];
	for (var key in w.properties)
	{
		const 	item		= document.importNode(document.querySelector('#tmpl-prop-editor').content, true);
		item.querySelector('.prop-name').innerHTML		= key;
		item.querySelector('.prop-value').name			= key;
		item.querySelector('.prop-value').value			= w.properties[key];
		box.appendChild(item);
	}

	document.getElementById('dialog-edit').showModal();
});


document.querySelector('#btn-prop-save').addEventListener('click', () =>
{
	const	dialog	= document.getElementById('dialog-edit');
	const	box		= dialog.querySelector('.input-frame');
	var		props	= [];

	box.querySelectorAll('.prop-value').forEach((e) =>
	{
		props.push(`"${e.name}=${e.value}"`);
	});
	send_command(':world/props ' + worlds[world].id + " " + props.join(' '));
});

document.querySelector('#btn-world-setting-save').addEventListener('click', () =>
{
	const	dialog	= document.getElementById('dialog-world-setting');
	const	box		= dialog.querySelector('.input-frame');
	var		props	= [];

	box.querySelectorAll('.prop-value').forEach((e) =>
	{
		props.push(`"${e.name}=${e.value}"`);
	});
	send_command(':world/setting ' + worlds[world].id + " " + props.join(' '));
});




document.getElementById('world-create').addEventListener('click', () =>
{
	document.getElementById('dialog-world-create').showModal();
});


document.getElementById('btn-world-create').addEventListener('click', () =>
{
	var	id		= '';
	var	props	= [];

	var	inputs	= document.getElementById('dialog-world-create').querySelectorAll('input');
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'id')
		{
			id		= inputs[i].value;
			continue;
		}
		props.push(`"${inputs[i].name}=${inputs[i].value}"`);
	}
	inputs	= document.getElementById('dialog-world-create').querySelectorAll('select');
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'id')
		{
			id		= inputs[i].value;
			continue;
		}
		props.push(`"${inputs[i].name}=${inputs[i].value}"`);
	}
	send_command(':world/create ' + id + " " + props.join(' '));
});


document.getElementById('btn-world-backup').addEventListener('click', () =>
{
	document.getElementById('dialog-backup').showModal();
});


document.getElementById('btn-world-delete').addEventListener('click', () =>
{
	yes_no('WORLD/DELETE/CONFIRM-MSG', 'WORLD/DELETE/CONFIRM-YES', 'WORLD/DELETE/CONFIRM-NO', () =>
	{
		send_command(':world/delete ' + world);
	});
});


function updateWorldList(list)
{
	document.querySelectorAll('.world-selector').forEach((e) =>
	{
		e.remove();
	});
	worlds	= list;

	const	box	= document.querySelector('#world-list');
	for (var key in list)
	{
		const	name		= key;
		const 	item		= document.importNode(document.querySelector('#tmpl-world-selector').content, true);
		item.querySelector('.world-selector').innerHTML		= list[name].setting['title'][1];
		item.querySelector('.world-selector').addEventListener('click', () =>
		{
			world_select(name);
		});
		box.appendChild(item);
	}
	refreshWorldStatus(world);
}
