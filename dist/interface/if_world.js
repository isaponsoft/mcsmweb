const	fs					= require('fs');
const	path				= require('path');
const	{ spawn }			= require('node:child_process')
const	Log					= require('../lib/log')
const	Opts				= require('../lib/opts')
const	lfs					= require('../lib/filesystem')
const	Response			= require('./response')
const 	World				= require('./world')



module.exports	= class	WorldController
{
	static	broadcast;

	static	config		= null;
	static	worldDir	= null;
	static	progDir		= null;
	static	worlds		= [];
	static	callback	= {};

	static	backups		= [];		// backup task process.


	static init(config, broadcast)
	{
		WorldController.config		= config;
		WorldController.broadcast	= broadcast;
		const	gamedir	= config.get_directory('mcsm.data-dir', null, true);
		WorldController.backupsDir	= gamedir + 'backups/';
		WorldController.worldDir	= gamedir + 'worlds/';
		WorldController.progDir		= gamedir + 'programs/';

		WorldController.addCallback(-1, (world, event, data) =>
		{
			if (event == 'output')
			{
				WorldController.broadcast(`OK notify/console ${world.name} ${data}`);
				return;
			}
			else if (event == 'eula')
			{
				WorldController.broadcast(`OK world/eula ${world.name} ${data}`);

			}

			WorldController.refreshList();
			const	res		= new Response('world/status');
			res.result		= WorldController.status(world.name);
			WorldController.broadcast(res);
		});

		WorldController.refreshList();
	}


	static if_create(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		const	dir		= WorldController.make_basename();
		const	world	= new World(WorldController.config, worldId, WorldController.worldDir + dir + '/');

		var		ini		= `title=${worldId}\n`;
		var		prop	= "";
		for (var key in cmd.params)
		{
			if (cmd.params[key])
			{
				if (key.startsWith('ini:'))
				{
					ini = ini + key.substr(4) + ' = ' + cmd.params[key] + "\n";
				}
				else if (key.startsWith('pro:'))
				{
					prop = prop + key.substr(4) + ' = ' + cmd.params[key] + "\n";
				}
			}
		}

		fs.mkdir(world.dir, (err) =>
		{
			if (err)
			{
				const	mCreated	= new Response("world/create");
				mCreated.status		= 'NG';
				mCreated.msg		= err.message;
				WorldController.broadcast(mCreated);
				return;
			}

			fs.writeFile(world.dir + "/" + world.config.get_string('mcsm.world-conf-filename'), ini, (err) =>
			{
				if (err)
				{
					const	mCreated	= new Response("world/create");
					mCreated.status		= 'NG';
					mCreated.msg		= err.message;
					WorldController.broadcast(mCreated);
					return;
				}

				fs.writeFile(world.dir + "/server.properties", prop, (err) =>
				{
					if (err)
					{
						const	mCreated	= new Response("world/create");
						mCreated.status		= 'NG';
						mCreated.msg		= err.message;
						WorldController.broadcast(mCreated);
						return;
					}

					WorldController.refreshList();

					const	mListup		= new Response("world/listup");
					mListup.result	= WorldController.listup();
					WorldController.broadcast(mListup);
				});
			});
		});
	}


	static if_delete(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		world	= WorldController.find(worldId);
		if (!world)
		{
			throw	`${worldId} : world nothing`;
		}
		if (world.status != World.STATUS.STOP)
		{
			throw	`${worldId} : world is not stopped.`;
		}

		fs.rm(world.dir, { recursive: true }, (err) =>
		{
			if (err)
			{
				const	mDeleted		= new Response("world/deleted");
				mDeleted.status	= 'NG';
				mDeleted.msg	= err.message;
				WorldController.broadcast(mDeleted);
				return;
			}

			const	mDeleted		= new Response("world/deleted");
			mDeleted.msg	= worldId;
			WorldController.broadcast(mDeleted);

			WorldController.refreshList();

			const	mListup		= new Response("world/listup");
			mListup.result	= WorldController.listup();
			WorldController.broadcast(mListup);
		});
	}

	static if_listup(res, cmd, session)
	{
		res.result	= WorldController.listup();
	}


	static if_eula(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		world	= WorldController.find(worldId);
		if (!world)
		{
			throw	`${worldId} : world nothing`;
		}
		world.eula();
	}

	// world/run world_id
	static if_run(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		world	= WorldController.find(worldId);
		if (!world)
		{
			throw	`${worldId} : world nothing`;
		}
		world.run();
		res.msg	= `world '${worldId}' is run.`;
	}

	// world/status world_id
	static if_status(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		world	= WorldController.find(worldId);
		if (world == null)
		{
			throw	`${worldId} : world nothing`;
		}
		res.result		= WorldController.status(worldId);
	}

	// world/stop world_id
	static if_stop(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		world	= WorldController.find(worldId);
		if (world == null)
		{
			throw	`${worldId} : world nothing`;
		}
		world.stop();
		res.msg		= `${worldId} is stoppping.`;
	}

	// world/stopAll
	static if_stopAll(res, cmd, session)
	{
		const	worlds	= session.worlds.listup();
		const	list	= [];
		for (let name in worlds)
		{
			worlds[name].stop();
			list.push(name);
		}
		res.msg	= list.join(', ');
	}

	// world/cmd world_id ...
	static if_cmd(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		const	c		= cmd.argv.join(' ');
		let		w		= WorldController.find(worldId);
		if (w == null)
		{
			throw	`${worldId} : world nothing`;
		}
		w.send(c);
	}

	static if_props(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		w		= WorldController.find(worldId);
		if (w == null)
		{
			throw	`${worldId} : world nothing`;
		}
		for (var key in cmd.params)
		{
			w.properties.set(key, cmd.params[key]);
		}
		w.saveProperties();
		WorldController.broadcastListup();
	}

	static if_setting(res, cmd, session)
	{
		const	worldId	= cmd.argv_string("WORLDID");
		let		w		= WorldController.find(worldId);
		if (w == null)
		{
			throw	`${worldId} : world nothing`;
		}
		for (var key in cmd.params)
		{
			if (cmd.params[key])
			{
				w.setting.set(key, cmd.params[key]);
			}
			else
			{
				delete	w.setting.values[key];
			}
		}
		w.saveSetting();
		WorldController.broadcastListup();
	}

	static broadcastListup()
	{
		const	res		= new Response("world/listup");
		res.result	= WorldController.listup();
		WorldController.broadcast(res);
	}

	static create_from_arvhive(title, zipfile)
	{
		const	node	= Opts.node;
		const	rootdir	= Opts.rootdir;
		const	id		= WorldController.make_basename();
		const	wdir	= path.join(WorldController.worldDir, id);

		const	cmds	= [];
		cmds.push(rootdir+'/restore.js');
		cmds.push('--config');
		cmds.push(Opts.configfile);
		cmds.push(wdir);
		cmds.push(zipfile);
		cmds.push(title);
		const	proc 	= spawn(node, cmds);

		WorldController.backups.push(proc);
		proc.stdout.on('data', (line) => { Log.trace(line.toString().trim()); });
		proc.stderr.on('data', (line) => { Log.trace(line.toString().trim()); });
		proc.on('spawn', (code) => { setTimeout(() => { WorldController.broadcastListup(); }, 100); });
		proc.on('error', () => { });
		proc.on('close', (code) => { });
		proc.on('disconnect', (code) =>
		{
			WorldController.backups	= WorldController.backups.filter((value, index, arr) =>
			{
		        return value != proc;
	   		});
		});
		proc.on('exit', (code) =>
		{
			if (!code)
			{
				const	w	= new World(WorldController.config, id, wdir + '/');
				w.load();
				w.setting.set('title', title);
				w.saveSetting();
				setTimeout(() => { WorldController.broadcastListup(); }, 100);
			}
		});
	}


	static refreshList()
	{
		// 削除されたワールドをリストから排除
		const	worlds	= {};
		for (var name in WorldController.worlds)
		{
			try
			{
				const	w	= WorldController.worlds[name];
				if (fs.lstatSync(w.dir).isDirectory())
				{
					w.load();
					worlds[name]	= w;
				}
			}
			catch (err)
			{
			}
		}
		WorldController.worlds	= worlds;

		// open world file.
		const	dir		= fs.opendirSync(WorldController.worldDir);
		for (;;)
		{
			const	dirent	= dir.readSync();
			if (!dirent) { break; }

			// 列挙済みならスキップ
			if (WorldController.worlds[dirent.name])
			{
				continue;
			}

			// 新規列挙
			try
			{
				Log.trace("Open world " + dirent.name);
				const	w	= new World(WorldController.config, dirent.name, WorldController.worldDir + dirent.name + '/');
				w.setCallback((world, ...args) =>
				{
					for (var id in WorldController.callback)
					{
						const	callback	= WorldController.callback[id];
						callback(world, ...args);
					}
				});
				w.load();
				WorldController.worlds[w.name]	= w;
			}
			catch (err)
			{
				Log.warn(dirent.name + " load : " + err.toString());
			}
		}
		dir.close();
	}

	static listup()
	{
		WorldController.refreshList();
		const	worlds	= WorldController.worlds;
		const	list	= {};
		for (let name in worlds)
		{
			list[name]	= WorldController.status(name);
		}
		return	list;
	}

	static status(worldId)
	{
		let		world	= WorldController.find(worldId);
		if (world == null)
		{
			throw	`${worldId} : world nothing`;
		}
		var		st	= {};
		st.id			= worldId;
		st.dir			= world.dir;
		st.status		= world.statusString();
		st.properties	= world.properties.values;
		st.setting		= {};
		for (var key in world.setting.parent.values)
		{
			st.setting[key]		= [ world.setting.parent.values[key], world.setting.values[key] ];
		}
		st.warnings		= world.warnings;
		st.ping			= world.pingStatus ? world.pingStatus.status : {};
		st.eula			= world.is_eula();
		return	st;
	}

	static stopAll()
	{
		for (let name in WorldController.worlds)
		{
			WorldController.worlds[name].proc.ref();
			WorldController.worlds[name].stop();
		}
	}

	static find(name)
	{
		for (let key in WorldController.worlds)
		{
			if (key == name)
			{
				return	WorldController.worlds[key];
			}
		}
		return	null;
	}


	static addCallback(id, callback)
	{
		WorldController.callback[id]	= callback;
	}

	static removeCallback(id)
	{
		delete WorldController.callback[id];
	}

	static sendAll(cmd)
	{
		for (let name in WorldController.worlds)
		{
			WorldController.worlds[name].send(cmd);
		}
	}

	static killAll(callback)
	{
		WorldController.killAllTest(() =>
		{
			callback();
		});
	}

	static killAllTest(callback)
	{
		var	stopAll	= true;
		for (let name in WorldController.worlds)
		{
			const	w	= WorldController.worlds[name];
			if (w.status == World.STATUS.ACTIVE)
			{
				w.stop();
			}
			if (w.status != World.STATUS.STOP)
			{
				stopAll	= false;
			}
		}
		if (!stopAll)
		{
			setTimeout(() => { WorldController.killAllTest(callback); }, 100);
		}
		else
		{
			callback();
		}
	}


	static procHandler(event, proc)
	{
		Log.info(event + " : server : " + proc.name);
	}



	static size()
	{
		return	0;
	}


	static make_basename()
	{
		return	Date.now().toString(16) + Math.floor(2000 * Math.random()).toString(16);
	}
};
