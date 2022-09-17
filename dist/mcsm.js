const	fs					= require('node:fs');
const	path				= require('node:path');
const	{ spawn }			= require('node:child_process')
const	Log					= require('./lib/log')
const	Opts				= require('./lib/opts')
const	Interface			= require('./interface/interface')

Interface.startup({
	'broadcast':	() => {}
});

const	pidfile	= path.join(Interface.datadir, 'mcsmd.pid');
const	mode	= Interface.argv[0];

function sleeping(sec)
{
	return	new Promise(resolve => setTimeout(resolve, sec*1000));
}


async function stop()
{
	if (!fs.existsSync(pidfile))
	{
		return	false;
	}
	const	pid	= parseInt(fs.readFileSync(pidfile).toString());
	process.kill(pid);
	while (isRunning(pid))
	{
		await sleeping(100);
	}
	return	pid;
}

function start()
{
	fs.writeFileSync(pidfile, "-1");
	const	node	= Opts.node;
	const	rootdir	= Opts.rootdir;

	const	cmds	= [];
	cmds.push(rootdir+'/daemon.js');
	cmds.push('--config');
	cmds.push(Opts.configfile);
	const	proc 	= spawn(node, cmds, { detached: true });
	return	proc.pid;
}

function isRunning(pid)
{
	try
	{
		process.kill(pid, 0);
		return	true;
	}
	catch(e)
	{
		return	false;
	}
}

if (mode == 'stop')
{
	const	pid	= stop();
	if (!pid)
	{
		console.log(`mcsmd not running. '${pidfile}' nothing.`);
	}
	process.exit(pid ? 0 : 1);
}
else if (mode == 'start')
{
	const	pid	= start();
	process.exit(pid ? 0 : 1);
}
else if (mode == 'restart')
{
	stop();
	const	pid	= start();
	process.exit(pid ? 0 : 1);
}
else if (mode == 'help')
{
	console.log(`usage)`);
	console.log(`mcsmd [options] (start|stop|restart)`);
	console.log(`[options]`);
	const	conf	= Interface.config.topparent();
	var		maxlen	= 0;
	var		maxlen2	= 0;
	for (var k in conf.values['mcsm'])
	{
		const	len		= k.length;
		maxlen	= maxlen >= len ? maxlen : len;

		const	len2	= conf.values['mcsm'][k].length;
		maxlen2	= maxlen2 >= len2 ? maxlen2 : len;
	}
	for (var k in conf.values['mcsm'])
	{
		const	valid	= conf.validator[`mcsm.${k}`];
		const	fmt		= valid['fmt'] == 'int'  ? 'int   '
						: valid['fmt'] == 'bool' ? 'bool  '
						:                 'string';
		const	def		= conf.load_value(`mcsm.${k}`);
		console.log(`  --${k.padEnd(maxlen, ' ')}  [${fmt}]  ${valid['msg']} (default : ${def})`);
	}
	process.exit(0);
}
else
{
	console.log(`Unkown command "${mode}".`);
	process.exit(1);
}
