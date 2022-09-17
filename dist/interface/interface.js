const	Log					= require('../lib/log')
const	Opts				= require('../lib/opts')
const 	lfs					= require('../lib/filesystem')
const	AuthController		= require('./if_auth')
const	BackupController	= require('./if_backup')
const	ConfigController	= require('./if_config')
const	ProgramController	= require('./if_program')
const	WorldController		= require('./if_world')

module.exports	= class	Interface
{
	static	argv;
	static	config;
	static	broadcast;

	static	datadir;
	static	worlddir;
	static	progdir;
	static	backupdir;
	static	tmpdir;
	static	logdir;

	// http interface
	static	webif	= {
	'backup/remove'		: BackupController.if_remove,
	'backup/restore'	: BackupController.if_restore,
	};

	// websock interface
	static	wsif	= {
	'.json'				: ConfigController.json,
	'.text'				: ConfigController.txt,
	'config/get'		: ConfigController.get,
	'auth/session'		: AuthController.session,
	'auth/login'		: AuthController.login,
	'program/build'		: ProgramController.if_build,
	'program/delete'	: ProgramController.if_delete,
	'program/listup'	: ProgramController.if_listup,
	'backup/archive'	: BackupController.if_archive,
	'backup/listup'		: BackupController.if_listup,
	'world/create'		: WorldController.if_create,
	'world/delete'		: WorldController.if_delete,
	'world/eula'		: WorldController.if_eula,
	'world/listup'		: WorldController.if_listup,
	'world/props'		: WorldController.if_props,
	'world/setting'		: WorldController.if_setting,
	'world/run'			: WorldController.if_run,
	'world/status'		: WorldController.if_status,
	'world/stop'		: WorldController.if_stop,
	'world/stopAll'		: WorldController.if_stopAll,
	'world/cmd'			: WorldController.if_cmd,
	};

	//	params : {
	//		broadcast: (msg) => {}
	//
	//	}
	static startup(params)
	{
		var		[argv, config]	= Opts.parse(process.argv, 'mcsm', 'mcsm.ini', __dirname + '/../config/default-mcsm.ini');
		try
		{
			Log.config		= config;
		}
		catch (err)
		{
			console.log("error", err);
			process.exit(1);
		}
		Interface.broadcast	= params.broadcast ? params.broadcast : (msg) => {};
		Interface.argv		= argv;
		Interface.config	= config;

		const	broadcast	= Interface.broadcast;
		ConfigController.config		= config;
		AuthController.config		= config;
		ProgramController.config	= config;
		WorldController.config		= config;

		BackupController	.init(config, broadcast);
		ProgramController	.init(config, broadcast);
		WorldController		.init(config, broadcast);

		Interface._init_dir();
	}

	static _init_dir()
	{
		Interface.datadir	= lfs.normalize(Interface.config.get_string('mcsm.data-dir'));
		Interface.worlddir	= lfs.normalize(Interface.config.get_string('mcsm.world-dir'));
		Interface.progdir	= lfs.normalize(Interface.config.get_string('mcsm.program-dir'));
		Interface.backupdir	= lfs.normalize(Interface.config.get_string('mcsm.backup-dir'));
		Interface.tmpdir	= lfs.normalize(Interface.config.get_string('mcsm.tmp-dir'));
		Interface.skindir	= lfs.normalize(Interface.config.get_string('mcsm.skin-dir'));
		Interface.logdir	= lfs.normalize(Interface.config.get_string('mcsm.log-dir'));
		Log.logdir			= Interface.logdir;
		Log.logfile			= Interface.config.get_string('mcsm.log-file');
		try
		{
			lfs.mkdir(Interface.datadir);
			lfs.mkdir(Interface.worlddir);
			lfs.mkdir(Interface.progdir);
			lfs.mkdir(Interface.backupdir);
			lfs.mkdir(Interface.tmpdir);
			lfs.mkdir(Interface.skindir);
			lfs.mkdir(Interface.logdir);
		}
		catch (err)
		{
			process.exit(1);
		}
	}
}
