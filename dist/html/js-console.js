
var consoleBox		= document.getElementById('console-box');
var	console_select	= '';
var	console_max		= 100;


function print(w, t)
{
	if (w == console_select || !w)
	{
		var	line	= document.createElement('div');
		line.innerText	= t;//.replaceAll(' ', '&nbsp;');
		consoleBox.appendChild(line);
		while (consoleBox.children.length > console_max)
		{
			consoleBox.removeChild(consoleBox.firstChild);
		}
		consoleBox.scrollTop = consoleBox.scrollHeight;
	}
}
function console_cls()
{
	if (console_select)
	{
		console_logs[console_select] = [];
	}
	consoleBox.innerText = '';	
	consoleBox.scrollTop = consoleBox.scrollHeight;
}
function console_change(w)
{
	console_select	= w;
	document.getElementById('console-prompt').innerText	= worlds[w].setting['title'][1];
}
function console_command(cmd)
{
	const	pos	= cmd.indexOf(' ');
	var		c	= cmd;
	if (pos > 0)
	{
		c	= cmd.substr(0, pos);
		if (c == "line")
		{
			const	num	= parseInt(cmd.substr(pos+1));
			if (num > 0)
			{
				console_max	= num;
				while (consoleBox.children.length > console_max)
				{
					consoleBox.removeChild(consoleBox.firstChild);
				}
			}
			return;
		}
		if (c == "size")
		{
			const	num	= cmd.substr(pos+1);
			if (num != "")
			{
				consoleBox.style.height	= num;
			}
			return;
		}
		if (c == "world")
		{
			world_change(cmd.substr(pos+1));
			return;
		}
	}
	if (c == 'cls' || c == '@clear')
	{
		console_cls();
		return;
	}
	if (cmd == '?')
	{
		print(console_select, "? : console help.");
		print(console_select, "cls, clear : clear current console.");
		print(console_select, "line N : Change console line number.");
		print(console_select, "size N : Change console window height.");
		print(console_select, "world WORLD  : Change world.");
		print(console_select, "/xxxx  : send minecraft server command.");
		return;
	}
	send_command(cmd);
}

document.querySelector('#console-message').addEventListener('keydown', (event) =>
{
	if (event.which == 13)
	{
		const cmd	= document.querySelector('#console-message').value;
		document.querySelector('#console-message').value	= '';
		console_command(cmd);
	}
});


console_command('?');

