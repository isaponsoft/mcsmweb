const	fs					= require('node:fs');
const	path				= require('node:path');
const	Log					= require('./lib/log')
const	WebServer			= require('./lib/webserver')
const	Command				= require('./interface/command')
const	Interface			= require('./interface/interface')
const	BackupController	= require('./interface/if_backup')
const	WorldController		= require('./interface/if_world')
const	Session				= require('./interface/session')

var		sessions			= [];


function broadcast(m)
{
	sessions.forEach((s) =>
	{
		const	v	= (m.build) ? m.build(s.format) : m;
		//Log.trace("CAST " + (v.substr(0, v.indexOf(' ', 4))));
		s.socket.sendUTF(v);
	});
}

Interface.startup({
	'broadcast':	broadcast
});

const	pidfile	= path.join(Interface.datadir, 'mcsmd.pid');
fs.writeFileSync(pidfile, `${process.pid}`);

const	webserver		= new WebServer(Interface.config.get_string('mcsm.ssl_key'), Interface.config.get_string('mcsm.ssl_crt'));
webserver.public_dir	= __dirname + '/html/';
webserver.port			= Interface.config.get_integer('mcsm.bind-port');

function shutdown(callback)
{
	Log.note("Shutdown start");
	WorldController.killAll(() =>
	{
		webserver.close();
		try {fs.rmSync(pidfile);}catch(err){}
		Log.note("Shutdown complite");
		callback();
	});
}

Interface.wsif['shutdown']	= (res, cmd, session) =>
{
	shutdown();
};

var signals = ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGABRT', 'SIGTERM'];
signals.forEach((signal) =>
{
	process.on(signal, () =>
	{
		shutdown(() =>
		{
			process.exit(0);
		});
	});
});
process.on('exit', () =>
{
	try {fs.rmSync(pidfile);}catch(err){}
});

function authrozedSession(authToken)
{
	for (var i = 0; i < sessions.length; ++i)
	{
		if (authToken == sessions[i].authToken)
		{
			return	sessions[i];
		}
	}
	return	null;
}
webserver.tmpdir	= Interface.tmpdir;
webserver.onUrl = (res, url, params) =>
{
	const	api		= url.replace(/^\/+/, '').replace(/\/+$/, '');
	const	intf	= Interface.webif[api];
	if (intf)
	{
		const	cmd		= new Command(null);
		const	session	= authrozedSession(params.params.authToken.trim());
		if (!session)
		{
			Log.note(`HTTP ${api} Authorize error`);
			return	{
				status:	401,
				type:	'text/plain',
				body:	'Unauthorized'
			};
		}
		cmd.api		= api;
		cmd.params	= params.params;
		const	res	= new Response(cmd.api);
		intf(res, cmd, session);
		Log.note(`HTTP ${api} OK`);
		return	{
			status:	200,
			type:	'text/plain',
			body:	res.msg
		};
	}
	if (url.startsWith('/upload'))
	{
		const	session	= authrozedSession(params.params.authToken.trim());
		if (!session)
		{
			Log.note(`HTTP ${api} Authorize error`);
			return	{
				status:	401,
				type:	'text/plain',
				body:	'Unauthorized'
			};
		}
		const	title	= params.params['title'];
		const	file	= params.files['file']['tmpfile'];
		const	type	= params.files['file']['type'];
		if (type != 'application/x-zip-compressed')
		{
			return	{
				status:	200,
				type:	'text/plain',
				body:	'NG Not zip'
			};
		}
		BackupController.make_backup_from_archive(file, title);
		Log.note(`HTTP ${api} OK ${title}`);
		return	{
			status:	200,
			type:	'text/plain',
			body:	'OK'
		};
	}
	if (url.startsWith('/skins/'))
	{
		const	session	= authrozedSession(params.params.authToken);
		if (!session)
		{
			Log.note(`HTTP ${api} Authorize error`);
			return	{
				status:	401,
				type:	'text/plain',
				body:	'Unauthorized'
			};
		}
		try
		{
			const	data	= fs.readFileSync(Interface.skindir + "/" + url.substr(7) + ".png", 'binary');
			Log.note(`HTTP ${api} OK ${Interface.skindir}/${url.substr(7)}.png"}`);
			return	{
				status:	200,
				type:	'image/png',
				body:	data
			};
		}
		catch (err)
		{
			Log.note(`HTTP ${api} Not found ${Interface.skindir}/${url.substr(7)}.png"}`);
			return	{
				status:	404,
				type:	'text/plain',
				body:	'Not found',
			};
		}
	}
	if (url.startsWith('/backups/'))
	{
		const	target	= url.substr(9);
		const	session	= authrozedSession(params.params.authToken.trim());
		if (!session)
		{
			Log.note(`HTTP ${api} Authorize error`);
			return	{
				status:	401,
				type:	'text/plain',
				body:	'Unauthorized'
			};
		}
		const	backups	= BackupController.listup();
		for (var i in backups)
		{
			if (backups[i].file != target)
			{
				continue;
			}
			const	filename	= backups[i].archive;
			const	stat		= fs.statSync(filename);
		    res.writeHeader(200, {"Content-Length": stat.size});
		    const	stream		= fs.createReadStream(filename);
		    stream.on('data', (data) =>
			{
				if (!res.write(data))
				{
					stream.pause();
				}
			});
			stream.on('end', () =>
			{
				Log.note(`HTTP ${api} OK`);
				res.end();
			});
			res.on("drain", () =>
			{
				stream.resume();
			});
			return	true;
		}
		return	null;
	}
	return	null;
};
//callback
webserver.onRequest = (client) =>
{
	const	sender		= (m) => { client.sendUTF(m); };
	const	session		= new Session(Interface.config, Interface.wsif);
	session.socket		= client;
	session.send		= (m) =>
	{
		const	v	= (m.build) ? m.build(session.format) : m;
		session.socket.sendUTF(v);
	};
	sessions.push(session);
	session.broadcast	= broadcast;
	client.on('message', (m) => { session.onMessage(m); });
	client.on('close', () =>
	{
		sessions	= sessions.filter((value, index, arr) =>
		{
	        return	value != session;
   		});
		session.finish();
	});
};
webserver.start();
Log.note("Start daemon");
