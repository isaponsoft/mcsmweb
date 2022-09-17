var		program		= null;
var		programs	= {};

document.getElementById('program-update').addEventListener('click', () =>
{
	document.getElementById('dialog-program-build').showModal();
});


document.querySelector('#dialog-program-add-type').addEventListener('change', () =>
{
	const	box		= document.getElementById('dialog-program-build');
	const	type	= document.getElementById('dialog-program-add-type');
	for (var i = 0; i < type.options.length; i++)
	{
		const	val	= type.options[i].value;
		box.querySelector('.type-' + val).style.display	= type.options[i].selected ? 'block' : 'none';
	}
});



document.getElementById('btn-delete').addEventListener('click', () =>
{
	const	prog	= programs[program];
	yes_no('PROGRAM/DELETE/CONFIRM-MSG', 'PROGRAM/DELETE/CONFIRM-YES', 'PROGRAM/DELETE/CONFIRM-NO', () =>
	{
		send_command(`:program/delete "${prog.name}"`);
	});
});




document.querySelector('#btn-program-update').addEventListener('click', () =>
{
	const	dialog	= document.getElementById('dialog-program-build');
	var		type	= '';
	var		ver		= '';
	var		url		= '';

	const	selector	= document.getElementById('dialog-program-add-type');
	type	= selector.options[selector.options.selectedIndex].value;
	dialog.querySelectorAll('input').forEach((e) =>
	{
		if (e.name == 'version')	ver		= e.value;
		if (e.name == 'url')		url		= e.value;
	});
	if (type == 'vanilla')
	{
		send_command(`:program/build "${type}" "${url}"`);
	}
	if (type == 'spigot')
	{
		send_command(`:program/build "${type}" "${ver}"`);
	}
});


function program_select(select)
{
	if ((select == program) && (document.querySelector('#content-program').style.display != 'none'))
	{
		program	= '';
		document.querySelector('#content-program').style.display = 'none';
		return;
	}
	selectProgram(select);
}

function selectProgram(select)
{
	var	prog	= programs[select];
	if (!prog)
	{
		select	= undefined;
		for (var key in programs)
		{
			select	= key;
			break;
		}
		if (!select)
		{
			document.querySelector('#content-program').style.display = 'none';
			return;
		}
		prog	= programs[select];
	}
	program	= select;

	document.querySelector('#content-program').style.display = 'block';

	const	box	= document.querySelector('#content-program');

	box.querySelector('.contents-header-title').innerText	= prog.name;
	box.querySelector('#program-status-dir').innerText		= prog.dir;
	box.querySelector('#program-status-jar').innerText		= prog.file;
	box.querySelector('#program-status-type').innerText		= prog.type;
	box.querySelector('#program-status-version').innerText	= prog.version;
	box.querySelector('#program-status-status').innerText	= prog.state == 1 ? 'Downloading'
															: prog.state == 2 ? 'Download error'
															: prog.state == 3 ? 'Download ok'
															: prog.state == 4 ? 'Building'
															: prog.state == 5 ? 'Build error'
															: prog.state == 6 ? 'Active'
															:					'Unkown state';
	const	url		= (prog.type == 'spigot')	?	'https://www.spigotmc.org/'
					:								null;
	if (url)
	{
		box.querySelector('#program-status-website-tr').style.visibility	= 'visible';
		box.querySelector('#program-status-website').href 					= url;
	}
	else
	{
		box.querySelector('#program-status-website-tr').style.visibility	= 'collapse';
	}
}

function updateProgramList(list)
{
	document.querySelectorAll('.program-selector').forEach((e) =>
	{
		e.remove();
	});

	programs	= list;

	const	box	= document.querySelector('#program-list');
	for (var key in programs)
	{
		const	name		= key;
		const 	item		= document.importNode(document.querySelector('#tmpl-program-selector').content, true);
		item.querySelector('.program-selector').innerHTML		= name;
		item.querySelector('.program-selector').addEventListener('click', () =>
		{
			program_select(name);
		});
		box.appendChild(item);
	}
	if (program)
	{
		send_command('?select-program ' + program);
	}
}

function resetProgram()
{
	const	box		= document.getElementById('dialog-program-build');
	const	type	= document.getElementById('dialog-program-add-type');
	const	def		= 'spigot';
	for (var i = 0; i < type.options.length; i++)
	{
		const	val	= type.options[i].value;
		type.options[i].selected	= val == def;
		box.querySelector('.type-' + val).style.display	= (val == def) ? 'block' : 'none';
	}
}
resetProgram();
