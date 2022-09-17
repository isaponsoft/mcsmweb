var	backup_select	= '';
var	backup_list		= {};
var	backup_id		= '';


	

document.getElementById('btn-dialog-backup-yes').addEventListener('click', () =>
{
	const	inputs	= document.getElementById('dialog-backup').querySelectorAll('input');
	var		title	= '';
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'title')
		{
			title		= inputs[i].value;
			continue;
		}
	}
	send_command(`:backup/archive ${world} "${title}"`);
});


document.getElementById('btn-dialog-restore-yes').addEventListener('click', () =>
{
	const	inputs	= document.getElementById('dialog-backup-restore').querySelectorAll('input');
	var		world_id	= '';
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'id')
		{
			world_id		= inputs[i].value;
			continue;
		}
	}
	post_command(
		"backup/restore",
		{
			'backup'	: backup_id,
			'world'		: world_id,
		},
		(state, msg) =>
		{
		}
	);
});


document.getElementById('backup-upload').addEventListener('click', () =>
{
	document.getElementById('dialog-backup-upload').showModal();
});


document.getElementById('btn-backup-upload').addEventListener('click', () =>
{
	const	box			= document.getElementById('dialog-backup-upload');
	var		title		= null;
	var		file		= null;
	box.querySelectorAll('input').forEach((e) =>
	{
		if (e.name == 'title')
		{
			title	= e.value;
		}
		if (e.name == 'restore-file')
		{
			file	= e.files[0];
		}
	});

	const	formData	= new FormData();
	formData.append("authToken",	auth_token);
	formData.append("title",		title);
	formData.append("file",			file);

	const	xhr			= new XMLHttpRequest();
	xhr.open('POST', 'upload', true);
	xhr.onload = function(e) { 
 	};
	xhr.upload.addEventListener("progress", (env) => {
		
	}, false); 
	xhr.onreadystatechange = () =>
	{
	};
	xhr.send(formData);  
});

function backup_change(select)
{
	const	box	= document.querySelector('#content-backup');
	if ((backup_select == select || !backup_list[select]) && (box.style.display != 'none'))
	{
		box.style.display	= 'none';
		backup_select		= '';
		return;
	}
	backup_select		= select;
	box.style.display	= 'block';


	const	backup	= backup_list[backup_select];
	box.querySelector(".contents-header-title").innerText	= backup_select;

	const	table	= box.querySelector(".backup-list");
	table.querySelectorAll('.backup-selector').forEach((e) =>
	{
		e.remove();
	});

	backup.sort((a, b) => { return a.time < b.time; });
	backup.forEach((i) =>
	{
		const	id			= i.id;
		const	stateTxt	= i.state == 1 ? 'BACKUP/STATE/ARCHIVING'
							: i.state == 2 ? 'BACKUP/STATE/ERROR'
							:                'BACKUP/STATE/OK';
		var		item;
		if (i.state == 0)
		{
			item		= document.importNode(document.querySelector('#tmpl-backup-item').content, true);
			item.querySelector(".button-download").href		= "backups/" + i.file + '?authToken=' + auth_token;
			item.querySelector(".button-download").download	= "backups/" + i.file;
		}
		else
		{
			item	= document.importNode(document.querySelector('#tmpl-backup-item-no-ok').content, true);
			item.querySelector(".backup-state").innerText	= translate[stateTxt];
			item.querySelector(".backup-msg").innerText		= i.msg;
		}
		const	date	= (new Date(i.time * 1000));
		item.querySelector(".backup-state").innerText	= translate[stateTxt];
		item.querySelector(".backup-time").innerText	= date.toLocaleDateString() + " " + date.toLocaleTimeString();

		const	restore	= item.querySelector(".button-restore");
		if (restore)
		{
			restore.addEventListener('click', () =>
			{
				backup_id	= id;
				document.getElementById('dialog-backup-restore').showModal();
			});
		}

		item.querySelector(".button-delete").addEventListener('click', () =>
		{
			yes_no(translate['BackUP/DELETE/TITLE'], translate['BackUP/DELETE/YES'], translate['BackUP/DELETE/NO'], () =>
			{
				post_command(
					'backup/remove',
					{
						'id' : id
					},
					(state, msg) =>
					{
						print('', msg);
					});
			});
		});
		table.appendChild(item);
	});
	updateTranslated();
}


function updateBackupList(list)
{
	const	box	= document.querySelector('#backup-list');

	box.querySelectorAll('.backup-selector').forEach((e) =>
	{
		e.remove();
	});
	backup_list	= {};

	for (var i in list)
	{
		const	title		= list[i].title;
		if (!backup_list[title])
		{
			const 	item		= document.importNode(document.querySelector('#tmpl-backup-selector').content, true);
			item.querySelector('.backup-selector').innerHTML		= title;
			item.querySelector('.backup-selector').addEventListener('click', function onOpen()
			{
				backup_change(title);
			});
			box.appendChild(item);
			backup_list[title] = [];
		}
		backup_list[title].push(list[i]);
	}
	if (backup_select)
	{
		if (backup_list[backup_select])
		{
			const	old	= backup_select;
			backup_select	= '';
			backup_change(old);
		}
		else
		{
			backup_change(backup_select);
		}
	}
}
