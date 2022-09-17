const	fs				= require('node:fs');
const	path			= require('node:path');
const	process			= require('node:process');
const	readline		= require('node:readline');
const	{ spawn }		= require('node:child_process')
const	Config			= require('./lib/config');
const	lfs				= require('./lib/filesystem');

const	argv			= process.argv;
const	node			= argv.shift();
const	script			= argv.shift();
const	systemDir		= path.dirname(script);

const	defaultConfFile	= lfs.join(systemDir, 'config/default-mcsm.ini');
const	configDef		= new Config(defaultConfFile, fs.readFileSync(defaultConfFile).toString());
const	configUserFile	= lfs.join(process.cwd(), configDef.get_string('mcsm.conf-filename'));
var		configUserData	= '';
try
{
	configUserData	= fs.readFileSync(configUserFile).toString()
}
catch (err)
{
}
const	configUser		= new Config(configUserFile, configUserData, configDef);
const	input			= readline.createInterface({
							input:	process.stdin,
							output:	process.stdout
						});




async function main()
{
	console.log("MCSMWEB Minecraft server manager setup");
	console.log(`Setup config file : ${configUserFile}`);
	await setup_configfile();
	await setup_directory();
	await setup_certification();
	await setup_modules();
	console.log("mcsmweb initial ok.");
	input.close();
}


(async () => { main(); })();


async function setup_configfile()
{
	await question('mcsm.bind-port', 'port number');
	await question('mcsm.admin-user', 'admin username');
	await question('mcsm.admin-pass', 'admin password');


	// 結果を書き込む
	var	params	= '';
	for (var key in configUser.values)
	{
		if (configUser.values[key] instanceof Object)
		{
			params += `[${key}]\n`;
			for (var subkey in configUser.values[key])
			{
				if (configUser.values[key][subkey] != configDef.values[key][subkey])
				{
					params += `${subkey}=${configUser.values[key][subkey]}\n`
				}
			}
		}
		else
		{
			if (configUser.values[key] != configDef.values[key])
			{
				params += `${key}=${configUser.values[key]}\n`
			}
		}
	}

	console.log(`Write config file to ${configUserFile}`);
	fs.writeFileSync(configUserFile, params);
	configUser.set('mcsm.data-dir', path.dirname(configUserFile));
}

async function setup_directory()
{
	lfs.mkdir(configUser.get_string('mcsm.program-dir'));
	lfs.mkdir(configUser.get_string('mcsm.world-dir'));
	lfs.mkdir(configUser.get_string('mcsm.backup-dir'));
	lfs.mkdir(configUser.get_string('mcsm.tmp-dir'));
	lfs.mkdir(configUser.get_string('mcsm.skin-dir'));
	lfs.mkdir(configUser.get_string('mcsm.log-dir'));
}


async function setup_modules()
{
	return	new Promise((resolv) =>
	{
		console.log("node module setup");
		process.chdir(__dirname);

		const	cmds	= [];
		cmds.push('i');
		const	proc 	= spawn('npm', cmds);
		proc.stdout.on('data', (line) => { process.stdout.write(line.toString()); });
		proc.stderr.on('data', (line) => { process.stdout.write(line.toString()); });
		proc.on('spawn', (code) => { });
		proc.on('error', () => { });
		proc.on('close', (code) => { });
		proc.on('disconnect', (code) => {});
		proc.on('exit', (code) =>
		{
			resolv(code);
		});
	});
}

async function question(key, msg)
{
	const	get	= async (msg) =>
	{
		return	new Promise((resolv) =>
		{
			input.question(msg, (val) =>
			{
				resolv(val);
			});
		});
	};

	for (;;)
	{
		try
		{

			const	val	= await get(`${msg} [${configUser.get_value(key)}] : `);
			if (val.trim() == '')
			{
				break;
			}
			configUser.set(key, val);
			break;
		}
		catch (err)
		{
			console.log(err.toString());
		}
	}
}

async function setup_certification()
{
	return	new Promise((resolv) =>
	{
		const	ssl_key	= configUser.get_filepath('mcsm.ssl_key');
		const	crt_key	= configUser.get_filepath('mcsm.ssl_crt');
		if (fs.existsSync(ssl_key) && fs.existsSync(crt_key))
		{
			resolv(0);
			return;
		}
		console.log("Generation ssl certificatin files.");
		console.log(`key : ${ssl_key}`);
		console.log(`crt : ${crt_key}`);

		const	cmds	= [];
		cmds.push('req');
		cmds.push('-new');
		cmds.push('-newkey');
		cmds.push('rsa:4096');
		cmds.push('-days');
		cmds.push('36500');
		cmds.push('-nodes');
		cmds.push('-x509');
		cmds.push('-subj');
		cmds.push('/C=JA/ST=Home/L=Home/O=Local/CN=mcsmweb');
		cmds.push('-keyout');
		cmds.push(ssl_key);
		cmds.push('-out');
		cmds.push(crt_key);
		const	proc 	= spawn('openssl', cmds);
		proc.stdout.on('data', (line) => { process.stdout.write(line.toString()); });
		proc.stderr.on('data', (line) => { process.stdout.write(line.toString()); });
		proc.on('spawn', (code) => { });
		proc.on('error', () => { });
		proc.on('close', (code) => { });
		proc.on('disconnect', (code) => {});
		proc.on('exit', (code) =>
		{
			if (code == 0) {console.log("Generated ok.");}
			resolv(code);
		});
	});
}
