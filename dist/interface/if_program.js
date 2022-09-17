const	fs			= require('fs');
const	{ spawn }	= require('node:child_process');
const	Session		= require('./session');
const	Response	= require('./response');
const	Interface	= require('./interface');
const	Log			= require('../lib/log');
const	Opts		= require('../lib/opts');
const	lfs			= require('../lib/filesystem');

class	Program
{
	name	= '';
	dir		= null;
	file	= null;
	type	= "spigot";
	version	= "0.0.0";
	state	= 0;			// 0: none, 1: active, 2: downloading, 3: building, 4:build error
	proc	= null;

	splitVer()
	{
		var		pos;
		var		ver	= ""+this.version;

		pos	= ver.indexOf('.');
		const	v1	= ver.substr(0, pos);	ver	= ver.substr(pos+1);

		pos	= ver.indexOf('.');
		const	v2	= ver.substr(0, pos);	ver	= ver.substr(pos+1);

		return	[ parseInt(v1), parseInt(v2), parseInt(ver) ];
	}
}


module.exports	= class	ProgramController
{
	static get STATE ()
	{return{
		OK				: 0,
		DOWNLOADING		: 1,
		DOWNLOADERROR	: 2,
		DOWNLOADOK		: 3,
		BUILDING		: 4,
		BUILDERROR		: 5,
		BUILDOK			: 6,
	}};


	static	config		= null;
	static	programs	= [];
	static	broadcast	= null;
	static	procs		= [];
	static	progdir		= null;

	static init(config, broadcast)
	{
		ProgramController.config	= config;
		ProgramController.broadcast	= broadcast;
		ProgramController.progdir	= Opts.config.get_string('mcsm.program-dir');
	}

	static if_listup(res, cmd, session)
	{
		const	list	= ProgramController._listup();
		res.result	= list;
	}

	static if_build(res, cmd, session)
	{
		const	type	= cmd.argv_string("TYPE");
		if (type == "vanilla")
		{
			const	url		= cmd.argv_string("URL");
			ProgramController._vanilla_build(url);
		}
		else if (type == "spigot")
		{
			const	ver		= cmd.argv_string("VER");
			ProgramController._spigot_build(ver);
		}
		else
		{
			res.state	= "NG";
			res.msg		= "Unkown type " + type;
		}
	}

	static if_delete(res, cmd, session)
	{
		const	type	= cmd.argv_string("TYPE");
		ProgramController.remove(type);
	}

	static notify()
	{
		const	res		= new Response("program/listup");
		res.result	= ProgramController._listup();
		ProgramController.broadcast(res);
	}


	static remove(type)
	{
		try
		{
			const	progDir	= ProgramController.progdir + '/' + type;
			fs.rmSync(progDir, { recursive: true });
		}
		catch (err)
		{
		}

		const	res		= new Response("program/listup");
		res.result	= ProgramController._listup();
		ProgramController.broadcast(res);
	}

	static last(type)
	{
		const	list	= ProgramController._listup();
		var		last	= null;
		for (var i in list)
		{
			const	prog	= list[i];
			if (prog.type != type) { continue; }
			if (!last)
			{
				last	= prog;
				continue;
			}

			const	v1	= last.splitVer();
			const	v2	= prog.splitVer();
			if (v1[0] > v2[0]) continue;
			if (v1[1] > v2[1]) continue;
			if (v1[2] > v2[2]) continue;
			last	= prog;
		}
		return	last;
	}

	static get(type, ver)
	{
		if (!ver || ver == 'last')
		{
			return	ProgramController.last(type);
		}

		const	list	= ProgramController._listup();
		for (var i in list)
		{
			const	prog	= list[i];
			if (prog.type == type && prog.version == ver)
			{
				return	prog;
			}
		}
		return	null;
	}

	// 状態を取得して通知する
	static notify_to_client()
	{
		const	list	= ProgramController._listup();
		const	res		= new Response();
		res.result	= list;
	}


	static _vanilla_build(url)
	{
		const	node	= Opts.node;
		const	rootdir	= Opts.rootdir;
		const	progDir	= lfs.join(ProgramController.progdir, 'vanilla-');
		const	rndCode	= Date.now().toString(16) + Math.floor(2000 * Math.random()).toString(16);
		const	tmpDir	= lfs.join(ProgramController.progdir, `vanilla-download-${rndCode}`);
		try
		{
			fs.mkdirSync(tmpDir);
		}
		catch (err)
		{
		}

		Log.note(`Build ${tmpDir} ${url}`);

		const	cmds	= [];
		cmds.push(rootdir+'/build-vanilla.js');
		cmds.push('--config');
		cmds.push(Opts.configfile);
		cmds.push(tmpDir);
		cmds.push(url);

		const	proc 	= spawn(node, cmds);
		proc.stdout.on('data', (line) =>
		{
			Log.trace(line.toString().trim());
			if (line.toString().trim() == '**** CHANGE STATE ****')
			{
				Log.trace("Change state");
				ProgramController.notify();
			}
		});
		proc.on('spawn', (code) => { setTimeout(() => {ProgramController.notify();}, 500); });
		proc.on('error', () => { ProgramController.notify(); });
		proc.on('close', (code) =>
		{
			if (code == 0)
			{
				try
				{
					const	verdata		= JSON.parse(fs.readFileSync(tmpDir + '/version.json').toString());
					const	version		= verdata['name'];
					Log.trace(`Vanilla download. version = ${version}.`);
					try
					{
						fs.rmSync(progDir + version, { recursive: true });
					}
					catch (err)
					{
					}
					fs.renameSync(tmpDir, progDir + version);
					fs.writeFileSync(lfs.join(progDir + version, 'state'), ProgramController.STATE.BUILDOK + " Build OK\n");
				}
				catch (err)
				{
					try
					{
						fs.writeFileSync(lfs.join(tmpDir, 'state'), ProgramController.STATE.BUILDERROR+" : " + err.toString() + "\n");
					}
					catch (e)
					{
						Log.warn(tmpDir + ' : ' + e.toString());
					}
					Log.warn(tmpDir + ' : ' + err.toString());
				}
			}
			ProgramController.notify();
			ProgramController.procs	= ProgramController.procs.filter((value, index, arr) =>
			{
		        return value != proc;
	   		});
		});
		proc.on('exit', (code) =>
		{
			setTimeout(() => { ProgramController.notify() }, 100);
			ProgramController.procs	= ProgramController.procs.filter((value, index, arr) =>
			{
		        return value != proc;
	   		});
		});
		ProgramController.procs.push(proc);
	}

	static _spigot_build(version)
	{
		const	node		= Opts.node;
		const	rootdir		= Opts.rootdir;
		const	progroot	= ProgramController.progdir;
		const	progDir		= `${ProgramController.progdir}/spigot-${version}`;

		Log.note(`Build ${progDir} ${version}`);

		const	cmds	= [];
		cmds.push(rootdir+'/build-spigot.js');
		cmds.push('--config');
		cmds.push(Opts.configfile);
		cmds.push(progDir);
		cmds.push(version);
		const	proc 	= spawn(node, cmds);

		proc.stdout.on('data', (line) =>
		{
			Log.trace(line.toString().trim());
			if (line.toString().trim() == '**** CHANGE STATE ****')
			{
				Log.trace("Change state");
				ProgramController.notify();
			}
		});
		proc.on('spawn', (code) => { setTimeout(() => { ProgramController.notify() }, 100); });
		proc.on('error', () => { });
		proc.on('close', (code) => { });
		proc.on('disconnect', (code) => { });
		proc.on('exit', (code) =>
		{
			setTimeout(() => { ProgramController.notify() }, 100);
			ProgramController.procs	= ProgramController.procs.filter((value, index, arr) =>
			{
		        return value != proc;
	   		});
		});
		ProgramController.procs.push(proc);
	}

	static _listup()
	{
		const	gamedir	= ProgramController.config.get_directory('mcsm.data-dir', null, true);
		const	progDir	= gamedir + 'programs/';

		const	dir			= fs.opendirSync(progDir);
		const	programs	= {};
		for (;;)
		{
			const	dirent	= dir.readSync();
			if (!dirent) { break; }
			try
			{

				const	name	= dirent.name;
				const	pos		= name.indexOf('-');

				const	st		= fs.readFileSync(progDir + '/' + name + '/state').toString();
				const	prog	= new Program();
				prog.name		= name;
				prog.dir		= (progDir + '/' + name).replace('//', '/');
				prog.type		= name.substr(0, pos);
				prog.version	= name.substr(pos + 1);
				prog.state		= parseInt(st.substr(0, st.indexOf(' ')));

				if (prog.type == 'vanilla')
				{
					prog.file		= prog.dir + '/server.jar';
				}
				else
				{
					prog.file		= prog.dir + '/' + name + '.jar';
				}

				programs[name]	= prog;
			//	Log.note(prog.type + " " + prog.version + ", state=" + prog.state);
			}
			catch (err)
			{
				Log.warn(dirent.name + " load : " + err.toString());
			}
		}
		dir.close();
		ProgramController.programs	= programs;
		return	programs;
	}
}
