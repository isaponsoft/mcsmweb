var	auth_token		= '';
var	wsock			= null;

function websock_url()
{
	return	`wss://${location.host}${location.pathname}`;
}


function send_command(cmd)
{
	if (cmd == "")
	{
		return;
	}
	if (cmd[0] == "?")
	{
		const	pos	= cmd.indexOf(' ');
		var		api	= cmd;
		var		arg	= '';
		if (pos > 0)
		{
			api	= cmd.substr(1, pos-1);
			arg	= cmd.substr(pos + 1).trim();
		}
		if (api == 'select-world')
		{
			world	= arg;
			wsock.send('world/status ' + world);
		}
		if (api == 'select-program')
		{
			selectProgram(arg);
		}
	}
	else if (cmd[0] == ":")
	{
		wsock.send(cmd.substr(1).trim());
	}
	else if (cmd[0] == "/")
	{
		wsock.send('world/cmd ' + world + " " + cmd.substr(1).trim());
	}
	else if (cmd[0] == '@')
	{
		post_command(cmd.substr(1), {}, (state, response, params) =>
		{
			print(world, cmd[0].substr(1) + ' ' + response);
		});
	}
}

function post_command(uri, params, callback)
{
	document.getElementById('dialog-loading').showModal();
	const	formData	= new FormData();
	for (var key in params)
	{
		formData.append(key, params[key]);
	}
	formData.append('authToken', auth_token);

	const	xhr			= new XMLHttpRequest();
	xhr.open('POST', uri, true);
	xhr.onreadystatechange = () =>
	{
		if(xhr.readyState === XMLHttpRequest.DONE)
		{
			callback(xhr.status, xhr.responseText, params)
			document.getElementById('dialog-loading').close();
		}
	};
	xhr.send(formData);
}


function connect(user, pass)
{
	var wsUri = websock_url();
	var	conn	= new WebSocket(wsUri); 
	conn.onopen = function(e)
	{
		wsock	= conn;
		wsock.send('auth/session');

		wsock.onclose = () =>
		{
			document.getElementById('dialog-login').showModal();
			document.getElementById('containor').style.display = 'none';
		};

		setTimeout(() => { document.getElementById('dialog-loading').close(); }, 100);
		wsock.onmessage = function(e)
		{
			var		pos;
			var		res		= e.data;
			var		state	= '';
			var		api		= '';
			var		msg		= '';

			document.getElementById('dialog-loading').close();

			if ((pos = res.indexOf(' ')) < 0)
			{
				return;
			}
			state	= res.substr(0, pos);
			res		= res.substr(pos + 1);
			if ((pos = res.indexOf(' ')) < 0)
			{
				return;
			}
			api		= res.substr(0, pos);
			res		= res.substr(pos + 1);
			if ((pos = res.indexOf('\n')) < 0)
			{
				msg		= res;
			}
			else
			{
				msg		= res.substr(0, pos);
				res		= res.substr(pos + 1);
			}

			if (api == 'notify/console')
			{
				const	pos	= msg.indexOf(' ');
				if (pos > 0)
				{
					const	wn		= msg.substr(0, pos).trim();
					print(wn, msg.substr(pos).trim());
				}
				return;
			}

			if (api == 'auth/session')
			{
				const	token	= msg;
				const	uniq	= Date.now().toString(16) + Math.floor(2000 * Math.random()).toString(16);
				sha256(uniq + token + user + pass).then((val) =>
				{
					const	byteArray = new Uint8Array(val);
					const	hexCodes = [...byteArray].map(value =>
					{
					    return	value.toString(16).padStart(2, '0');
				 	});
					wsock.send('auth/login ' + uniq + ' ' + user + " " + hexCodes.join(''));
				});
				return;
			}

			if (api == 'auth/login')
			{
				if (state == 'OK')
				{
					document.getElementById('dialog-loading').showModal();
					wsock.send(".json");
					wsock.send("world/listup");
					wsock.send("program/listup");
					wsock.send("backup/listup");
					document.querySelector('#console-message').focus();
					auth_token	= msg;
					document.getElementById('containor').style.display = 'block';
					document.cookie	= `authToken=${auth_token}; SameSite=None; Secure`;
				}
				else
				{
					document.getElementById('dialog-login').showModal();
				}
				return;
			}

			if (api == 'program/listup')
			{
				updateProgramList(res.trim() ? JSON.parse(res.trim()) : []);
				return;
			}

			if (api == 'world/listup')
			{
				try
				{
					const	data	= JSON.parse(res.trim());
					updateWorldList(data);
				}
				catch (err)
				{
					updateWorldList([]);
				}
				return;
			}

			if (api == 'backup/listup')
			{
				try
				{
					const	data	= JSON.parse(res.trim());
					updateBackupList(data);
				}
				catch (err)
				{
					updateBackupList([]);
				}
				return;
			}

			if (api == 'world/status')
			{
				try
				{
					const	data	= JSON.parse(res.trim());
					updateWorldStatus(data);
				}
				catch (err)
				{
				}
				return;
			}
			
		};
	}
}
