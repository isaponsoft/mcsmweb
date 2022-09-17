const	fs				= require('fs');
const	path 			= require('path');
const	process			= require('process');
const	Config			= require('./config');


module.exports	= class Opts
{
	static	node;
	static	self;
	static	argv;
	static	rootdir;
	static	datadir;
	static	configfile;
	static	config;

	static load_config(filename, parent)
	{
		var	ini;
		try
		{
			ini	= fs.readFileSync(filename).toString();
		}
		catch (err)
		{
			throw	err.toString();
		}
		try
		{
			return	new Config(filename, ini, parent);
		}
		catch (err)
		{
			return	err.toString();
		}
	}


	static parse(argv, defname, defini, defaultfile)
	{
		try
		{
			var	a			= Array.from(argv);
			var	values		= {};
			var	helps		= {};
			var	configfile	= defini;		// Default ini file name.
			Opts.node		= argv[0];		argv.shift();					// shell command
			Opts.self		= argv[0];		argv.shift();					// node script
			Opts.rootdir	= path.dirname(__dirname);

			// default parameters
			const	defaultConfig		= this.load_config(defaultfile, null);
			if (!(defaultConfig instanceof Config))
			{
				throw	defaultConfig;
			}

			// search '--config'
			var		argv2	= [];
			while (argv.length > 0)
			{
				const	cmd	= argv.shift();
				if (cmd.startsWith('--config'))
				{
					configfile	= Opts.exists_file('--config', argv);
				}
				else
				{
					argv2.push(cmd);
				}
			}
			argv			= argv2;
			configfile		= path.resolve(configfile);
			Opts.datadir	= path.dirname(configfile);
			Opts.configfile	= configfile;

			// User config
			const	userConfig	= this.load_config(configfile, defaultConfig);
			if (!(userConfig instanceof Config))
			{
				throw	userConfig;
			}
			userConfig.set(defname+'.data-dir', configfile.substr(0, configfile.lastIndexOf('/')));

			// Dynamic config
			const	dncdir		= userConfig.get_string(defname+'.data-dir', null);
			const	dncfile		= userConfig.get_string(defname+'.conf-filename', null);
			var		dnconf		= '';
			try
			{
				dnconf	= fs.readFileSync(dncdir + '/' + dncfile).toString();
			}
			catch (err)
			{
			}
			const	dynamicConfig	= new Config(dncdir + '/' + dncfile, dnconf, userConfig);

			// Arguments
			const	config		= new Config('-', "", dynamicConfig);
			config.parent		= userConfig;
			while (argv.length > 0)
			{
				var	cmd	= argv.shift();
				if (cmd.startsWith('--'))
				{
					cmd	= cmd.substr(2);				// skip "--"
					const	pos	= cmd.indexOf('=');
					// = で分割する
					if (pos > 0)
					{
						const	key	= cmd.substr(0, pos).trim();
						const	val	= cmd.substr(pos+1).trim();
						try
						{
							config.set(key, val);
						}
						catch (err)
						{
							config.set(defname+'.'+key, val);
						}
						continue;
					}

					// = が無いので、次の引数を value とする
					const	key	= cmd;
					const	val	= argv.shift();
					try
					{
						config.set(key, val);
					}
					catch (err)
					{
						config.set(defname+'.'+key, val);
					}
					continue;
				}
				argv.unshift(cmd);
				break;
			}

			// value validation
			for (var key in helps)
			{
				var		name	= key;
				if (!helps[name].fmt)
				{
					continue;
				}
				switch (helps[name].fmt)
				{
					case 'int' :
						config.get_integer(key);
						break;

					case 'dir' :
						config.get_directory(key, false);
						break;
				}
			}

			Opts.config	= config;
			Opts.argv	= argv;

			// Default parameters
			return	[ argv, config ];
		}
		catch (err)
		{
			console.log(err);
			process.exit(1);
		}
	}


	static exists_file(cmd, a)
	{
		if (a.length == 0)
		{
			throw `'${cmd}' has not filename.`;
		}
		const	filename	= a.shift().trim();
		if (!fs.existsSync(filename))
		{
			throw `'${filename}' is not file.`;
		}
		return	filename;
	}

	static get_integer(cmd, a)
	{
		if (a.length == 0)
		{
			throw `'${cmd}' has not number.`;
		}
		const	num		= a.shift().trim();
		const	isnum	= num.match('\\d+');
		if (isnum)
		{
			return	parseInt(num);
		}
		throw `'${cmd}' - '${num}' is not number.`;
	}
}
