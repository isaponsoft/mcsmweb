const	fs					= require('fs');
const	{ spawn }			= require('node:child_process')
const	Config				= require('../lib/config')
const	Log					= require('../lib/log')
const	Minecraft			= require('../lib/minecraft')
const 	ProgramController	= require('./if_program')

class	MinecraftSkinManager
{
	static	skins	= {};
	static	config;

	static init(config)
	{
		this.config	= config;
	}

	static fetchSkin(uid)
	{
		if (MinecraftSkinManager.skins[uid])
		{
			return;
		}


		const	gamedir	= MinecraftSkinManager.config.get_directory('mcsm.data-dir', null, true);
		const	skindir	= gamedir + "/skins";
		try
		{
			fs.mkdirSync(skindir);
		}
		catch (err)
		{
		}
		try
		{
			const	png	= fs.readFileSync(skindir + "/" + uid + '.png');
			MinecraftSkinManager.skins[uid]	= png;
			return;
		}
		catch (err)
		{
		}
		Minecraft.load_skin(uid, (png) =>
		{
			MinecraftSkinManager.skins[uid]	= png;
			fs.writeFileSync(skindir + "/" + uid + '.png', png);
		});
	}
};


module.exports	= class	World
{
	static get STATUS ()
	{return{
		STOP		: 0,
		ACTIVE		: 1,
		ACTIVATING	: 2,
		STOPPING	: 3,
	}};

	static get PROCESS ()
	{return{
		ACTIVE		: 0,
		RESTORE		: 1,
		ERROR		: 2,
	}};

	name			= '';
	dir				= '';
	status			= World.STATUS.STOP;
	lines			= [];
	maxLine			= 1024;
	proc			= null;
	event			= [];

	config			= null;
	properties		= null;

	setting			= null;

	warnings		= [];
	eulsUrl			= null;

	minecraft		= null;
	pingStatus		= null;
	oldStatus		= "";

	constructor(config, name, dir)
	{
		this.config		= config;
		this.name		= name;
		this.dir		= dir;
		this.minecraft	= new Minecraft();
	}

	online_players_monitor()
	{
		if (this.status != World.STATUS.ACTIVE)
		{
			return;
		}

		try
		{
			const	port	= this.properties.values['server-port'];
			this.minecraft.ping(this.name, "localhost", port, (info) =>
			{
				this.pingStatus	= info;

				if (info.status.players.online > 0)
				{
					MinecraftSkinManager.init(this.config);
					for (var i = 0; i < info.status.players.online; i++)
					{
						MinecraftSkinManager.fetchSkin(info.status.players.sample[i].id);
					}
				}

				const	st	= JSON.stringify(info.status);
				if (st != this.oldStatus)
				{
					this.oldStatus	= st;
					this.fire('players', []);
				}
			});
		}
		catch (err)
		{
			Log.trace(err.toString());
		}
		setTimeout(() => { this.online_players_monitor(); }, 1000);
	}



	load(parent)
	{
		var	filename	= this.dir + 'server.properties';
		try
		{
			this.properties	= new Config(filename, fs.readFileSync(filename).toString(), null, false);
		}
		catch (err)
		{
			this.properties	= new Config(filename, "", null, false);
		}

		filename	= __dirname + '/../config/default-world.ini';
		this.setting	= new Config(filename, fs.readFileSync(filename).toString(), null);

		filename	= this.dir + this.config.get_string('mcsm.world-conf-filename');
		try
		{
			this.setting	= new Config(filename, fs.readFileSync(filename).toString(), this.setting);
		}
		catch (err)
		{
			this.setting	= new Config(filename, "", this.setting, false);
		}
	}

	eula()
	{
		try
		{
			const	eula	= fs.readFileSync(this.dir + '/eula.txt').toString();
			const	yes		= eula.replace('eula=false', 'eula=true');
			fs.writeFileSync(this.dir + '/eula.txt', yes);
			this.is_eula();
			this.warnings	= [];
			this.fire('eula', 'OK');
		}
		catch (err)
		{
			this.fire('eula', 'NG');
		}
	}

	is_eula()
	{
		try
		{
			const	eula	= fs.readFileSync(this.dir + '/eula.txt').toString();
			const	m		= eula.match('EULA \\((.*)\\)');
			if (m)
			{
				this.eulsUrl	= m[1];
			}
			if (eula.match('eula=true'))
			{
				return	true;
			}
			return	this.eulsUrl;
		}
		catch (err)
		{
			return	"??";
		}
	}

	statusString()
	{
		return	this.status == World.STATUS.STOP ? 'stop'
			:	this.status == World.STATUS.ACTIVE ? 'active'
			:	this.status == World.STATUS.ACTIVATING ? 'activating'
			:	this.status == World.STATUS.STOPPING ? 'stopping'
			:	'unkown';
	}

	addline (s)
	{
		const	lines	= s.toString().split("\n");
		for (var i in lines)
		{
			const	line	= lines[i].trim();
			if (!line) { continue; }
			if (line.match('\\[Server thread/WARN\\]: \\*\\*\\*\\* FAILED TO BIND TO PORT!'))
			{
				this.warnings.push('FAILED TO BIND TO PORT');
				this.fire('status', []);
			}
			if (line.match('\\*\\*\\* Please download a new build as per instructions from'))
			{
				this.warnings.push('SPIGOT UPGRADE');
				this.fire('status', []);
			}
			if (line.match('\\[ServerMain/INFO\\]: You need to agree to the EULA'))
			{
				this.warnings.push('EULA NOTHING');
				this.fire('status', []);
			}
			if (line.match('possibly by other Minecraft instance'))
			{
				this.warnings.push('RUNNING ZOMBIE PROCESS');
				this.fire('status', []);
			}

			Log.trace(line);
			this.lines.push(line);
			while (this.lines.length > this.maxLine)
			{
				this.lines.shift();
			}
			this.fire('output', line);
		}
	}

	setCallback(callback)
	{
		this.event = callback;
	}

	fire(...args)
	{
		const	e	= this.event;
		if (e)
		{
			e(this, ...args);
		}
	}

	saveProperties()
	{
		try
		{
			var	pf	= [];
			for (var key in this.properties.values)
			{
				pf.push(`${key}=${this.properties.values[key]}`);
			}
			fs.writeFileSync(this.dir + '/server.properties', pf.join("\n")+"\n");
			this.fire('properties', []);
		}
		catch (err)
		{
			Log.err("saveProperties error : " + err.toString());
		}
	}

	saveSetting()
	{
		try
		{
			var	pf	= [];
			for (var key in this.setting.values)
			{
				pf.push(`${key}=${this.setting.values[key]}`);
			}
			fs.writeFileSync(this.dir + this.config.get_string('mcsm.world-conf-filename'), pf.join("\n")+"\n");
		//	this.fire('settings', []);
		}
		catch (err)
		{
			Log.err("saveSetting error : " + err.toString());
		}
	}

	run()
	{
		if (this.status == World.STATUS.STOP)
		{
			this.warnings	= [];

			const	prog	= ProgramController.get(this.setting.get_string('program-type'), this.setting.get_string('program-ver'));
			if (!prog)
			{
				Log.err("Not found : " + this.setting.get_string('program-type') + ","+ this.setting.get_string('program-ver'));
				return	false;
			}
			const	javaopt	= this.setting.get_string('java-opt');

			let		dir		= this.dir;

			process.chdir(dir);
			

			const	command	= 'java '+javaopt+' -jar '+prog.file+' nogui';
			const	cmds	= command.split(' ');
			const	cmd		= cmds[0];
			cmds.shift();
			this.proc 		= spawn(cmd, cmds);
			this.warnings	= [];

			this.proc.stdout.on('data', (line) =>
			{
				line	= line.toString();
				this.addline(line);

				if (this.status	== World.STATUS.ACTIVATING)
				{
					if (line.match('\\[Server thread/INFO\\]: Done '))
					{
						this.status	= World.STATUS.ACTIVE
						this.fire('activated', []);
						this.online_players_monitor();
					}
				}
			});
			this.proc.stderr.on('data', (line) => { this.addline(line.toString()); });
			this.proc.on('spawn', (code) => {
				Log.trace("Start minecraft server : " + this.name);
				this.status	= World.STATUS.ACTIVATING;
				this.fire('spawn', []);
			});
			this.proc.on('error', () => {
				this.status	= World.STATUS.STOP;
				Log.trace("error");
				this.fire('error', []);
			});
			this.proc.on('exit', (code) => {
				Log.trace("exit minecraft server : " + this.name, code);
				this.status		= World.STATUS.STOP;
				this.pingStatus	= null;
				this.fire('exit', []);
			});
			this.proc.on('close', (code) => {
				Log.trace("close minecraft server : " + this.name, code);
				this.status	= World.STATUS.STOP;
				this.pingStatus	= null;
				this.fire('close', []);
			});
			this.proc.on('disconnect', (code) => {
				Log.trace("disconnect minecraft server : " + this.name);
				this.status	= World.STATUS.STOP;
				this.pingStatus	= null;
				this.fire('disconnect', []);
			});
			return	true;
		}
		return	false;
	}

	stop()
	{
		this.warnings	= [];
		this.send("save-all");
		this.send("stop");
		this.status	= World.STATUS.STOPPING;
		this.pingStatus	= null;
		this.fire('stop', []);
	}

	async send(cmd)
	{
		if (this.proc && !this.proc.killed)
		{
			await this.proc.stdin.write(cmd + "\n");
		}
	}

	kill()
	{
		this.warnings	= [];
		this.proc.kill('SIGKILL');
	}
};
