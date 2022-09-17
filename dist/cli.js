#!/usr/bin/env node
const	crypto			= require('crypto');
const	WebSocketClient	= require('websocket').client;
const	process			= require('process');
const	readline		= require('readline');
const 	Config			= require('./lib/config');
const 	Command			= require('./interface/command');
const 	Log				= require('./lib/log');
const 	Opts			= require('./lib/opts');
const	fs				= require('fs');

const 	Minecraft		= require('./lib/minecraft');


var		[argv, config]	= Opts.parse(process.argv, 'mcsm', 'mcsm.ini', __dirname + '/config/default-mcsm.ini');
function serverUrl()
{
	return	'wss://localhost:'+(config.get_integer('mcsm.bind-port'))+'/';
}

function sha256(message)
{
	return	crypto.createHash('sha256').update(message).digest('hex');
}
/*
const	m	= new Minecraft();
m.ping("test", "localhost", 25565, (msg) =>
{
	console.log(msg);
});
*/

class	Connector
{
	con		= null;
	prompt	= '';
	recv	= 0;


	async alive()
	{
		const	thiz	= this;
		return new Promise((resolve, reject) =>
		{
			if (thiz.con)
			{
				resolve(true);
				return;
			}

			const	client		= new WebSocketClient({ tlsOptions: { rejectUnauthorized: false } });
			client.on('connect', (connection) =>
			{
				thiz.con	= connection;
			    thiz.con.on('error', function(error)
				{
			    });
			    thiz.con.on('close', function()
				{
					thiz.con	= null;
					thiz.prompt	= '';
			    });
			    thiz.con.on('message', function(message)
				{
			        if (message.type === 'utf8')
					{
						const	m	= message.utf8Data.toString();
						const	cmd	= new Command(m.substr(m.indexOf(' ')+1));
						const	api	= cmd.api.trim(' /');
						if (api == 'auth/session')
						{
							const	user	= config.get_string('mcsm.admin-user');
							const	pass	= config.get_string('mcsm.admin-pass');

							const	token	= cmd.argv[0];
							const	uniq	= Date.now().toString(16) + Math.floor(2000 * Math.random()).toString(16);
							const	val		= sha256(uniq + token + user + pass);
							const	byteArray = new Uint8Array(val);
							const	hexCodes = [...byteArray].map(value =>
							{
							    return	value.toString(16).padStart(2, '0');
						 	});
							thiz.send('auth/login ' + uniq + ' ' + user + " " + val);
							return;
						}
						if (api == 'auth/login')
						{
							resolve(true);
							return;
						}
						console.log(m);
						thiz.recv	= 1;
			        }
			    });
				thiz.prompt	= "";
				thiz.send('auth/session');
			});
			client.on('connectFailed', (error) =>
			{
				console.log("connect failed", error);
				resolve(false);
			});
			client.connect(serverUrl());
		});
	}

	async send(cmd)
	{
		this.alive(cmd).then(() =>
		{
			this.con.sendUTF(cmd);
		});
		return	true;
	}

	async sleep(ms)
	{
		return	new Promise((resolve, reject) =>
		{
			setTimeout(() =>
			{
				resolve(ms);
			}, ms);
		});
	}
}

if (argv.length > 0)
{
	const	conn	= new Connector();
	conn.send(argv.join(' '));
	setTimeout(() =>
	{
		process.exit(0);
	}, 10);
	return;
}



async function main()
{
	let	conn	= new Connector();
	for (;;)
	{
		const line = await prompt(conn.prompt + "> ");
		if (line)
		{
			if (line == 'exit')
			{
				process.exit(0);
			}
			if (!await conn.send(line))
			{
				console.log("can't connect server : " + serverUrl());
				process.exit(1);
			}
		}
	}
}


async function prompt(PS)
{
	return new Promise((resolve) =>
	{
		const readlineInterface = readline.createInterface(
		{
			input: process.stdin,
			output: process.stdout
		});
	    readlineInterface.question(PS, (line) =>
		{
			resolve(line.trim());
			readlineInterface.close();
		});
	});
};

(async () => {

	await main();
})();
