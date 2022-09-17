const	fs				= require('fs');
const	path			= require('path');
const	{ spawn }		= require('node:child_process')
const 	lfs				= require('../lib/filesystem')
const 	Log				= require('../lib/log')
const 	Opts			= require('../lib/opts')
const 	Interface		= require('./interface')
const 	Response		= require('./response')
const 	WorldController	= require('./if_world')

module.exports	= class	BackupController
{
	static	ST_OK			= 0;
	static	ST_ARCHIVING	= 1;
	static	ST_ERROR		= 2;

	static	config			= null;
	static	broadcast		= null;


	// backup/archive
	static if_archive(res, cmd, session)
	{
		const	node	= Opts.node;
		const	rootdir	= Opts.rootdir;

		const	worldId	= cmd.argv_string("WORLDID");
		const	title	= cmd.argv_string("BACKUPTITLE");
		let		world	= WorldController.find(worldId);
		if (!world)
		{
			throw	`${worldId} : world nothing`;
		}

		if (world.status != 0)
		{
			throw	`${worldId} : world is not stopped.`;
		}

		const	cmds	= [];
		cmds.push(rootdir+'/backup.js');
		cmds.push('--config');
		cmds.push(Opts.configfile);
		cmds.push(worldId);
		cmds.push(title);
		const	proc 	= spawn(node, cmds);

		WorldController.backups.push(proc);
		proc.stdout.on('data', (line) => { Log.trace(line.toString().trim()); });
		proc.stderr.on('data', (line) => { Log.trace(line.toString().trim()); });
		proc.on('spawn', (code) => { setTimeout(() => { BackupController.broadcastListup(); }, 100); });
		proc.on('error', () => { });
		proc.on('close', (code) => { });
		proc.on('disconnect', (code) =>
		{
			WorldController.backups	= WorldController.backups.filter((value, index, arr) =>
			{
		        return value != proc;
	   		});
		});
		proc.on('exit', (code) => { BackupController.broadcastListup(); });
	}

	// backup/listup
	static if_listup(res, cmd, session)
	{
		res.result	= BackupController.listup();
	}

	// backup/listup
	static if_remove(res, cmd, session)
	{
		const	id		= cmd.params['id'].trim();
		const	item	= BackupController.get(id);
		if (!item)
		{
			res.msg		= `Nothing ${id}`;
			BackupController.broadcastListup();
			return;
		}

		const	zipfile		= path.normalize(item.archive);
		const	jsonfile	= path.join(path.dirname(zipfile), path.basename(zipfile, '.zip')) + '.json';
		lfs.rm(zipfile, (stat) => {});
		lfs.rm(jsonfile, (stat) => {});
		res.msg		= "OK";
		setTimeout(() => { BackupController.broadcastListup(); }, 100);
	}

	// backup/restore
	static if_restore(res, cmd, session)
	{
		const	backup_id	= cmd.params['backup'].trim();
		const	title		= cmd.params['world'].trim();
		const	item		= BackupController.get(backup_id);
		if (!item)
		{
			res.msg		= `Nothing ${backup_id}`;
			BackupController.broadcastListup();
			return;
		}

		WorldController.create_from_arvhive(title, item.archive);
		res.msg		= "OK";
	}

	static broadcastListup()
	{
		const	res	= new Response('backup/listup');
		res.result	= BackupController.listup();
		BackupController.broadcast(res);
	}

	static init(config, broadcast)
	{
		BackupController.config		= config;
		BackupController.broadcast	= broadcast;
	}

	static backupdir()
	{
		return	BackupController.config.get_directory('mcsm.backup-dir');
	}

	static get(id)
	{
		const	list	= BackupController.listup();
		for (var i in list)
		{
			if (list[i].id == id)
			{
				return	list[i];
			}
		}
		return	null;
	}

	// バックアップデータを列挙します。
	static listup()
	{
		const	files	= {};

		// open world file.
		const	bkdir	= BackupController.backupdir();
		const	dir		= fs.opendirSync(bkdir);
		for (;;)
		{
			const	dirent	= dir.readSync();
			if (!dirent) { break; }

			const	pos		= dirent.name.lastIndexOf('.');
			const	name	= dirent.name.substr(0, pos);
			const	ext		= dirent.name.substr(pos+1);

			if (!files[name])
			{
				files[name] = {
					id:			'',
					title:		'',
					file:		'',
					time:		0,
					archive:	'',
					state:		0,
					msg:		'',
				};
			}

			const	filename	= bkdir + '/' + dirent.name;
			if (ext == 'json')
			{
				const	state		= JSON.parse(fs.readFileSync(filename).toString());
				files[name].state	= parseInt(state.state);
				files[name].id		= state.id    ? state.id.trim()   : '';
				files[name].msg		= state.msg   ? state.msg.trim()   : '';
				files[name].title	= state.title ? state.title : '';
				files[name].time	= state.time  ? state.time  : 0;
			}
			else
			{
				files[name].archive	= path.normalize(filename);
				files[name].file	= dirent.name;
			}
		}
		dir.close();

		const	result	= [];
		for (var key in files)
		{
			result.push(files[key]);
		}
		return	result;
	}

	// アーカイブされたZIPファイルを移動しバックアップデータを生成する
	static make_backup_from_archive(zipfile, title)
	{
		const	basename	= BackupController.make_basename();
		const	backupdir	= BackupController.backupdir();
		fs.renameSync(zipfile, backupdir+'/'+basename+".zip");
		BackupController.make_state(basename, title, 0, '');
		setTimeout(() => { BackupController.broadcastListup(); }, 100);
	}

	// ステータスデータを作成する
	static make_state(basename, title, statecode, msg)
	{
		const	dir		= lfs.normalize(BackupController.config.get_string('mcsm.backup-dir'));
		const	meta	= JSON.stringify({
			'id'	: Date.now().toString(16) + Math.floor(2000 * Math.random()).toString(16),
			'title'	: title,
			'state'	: statecode,
			'msg'	: msg,
			'time'	: parseInt(Date.now()/1000),
		});
		fs.writeFileSync(dir+'/'+basename+".json", meta);
	}

	static make_basename()
	{
		const	date		= new Date();
		const	basename	= "backup-"
							+ (""+date.getFullYear())	.padStart(4, '0')
							+ (""+date.getMonth())		.padStart(2, '0')
							+ (""+date.getDate())		.padStart(2, '0')
							+ (""+date.getHours())		.padStart(2, '0')
							+ (""+date.getMinutes())	.padStart(2, '0')
							+ (""+date.getSeconds())	.padStart(2, '0');
		return	basename;
	}
};
