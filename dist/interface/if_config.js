const	Session	= require('./session')
const	Log		= require('../lib/log');

module.exports	= class	ConfigController
{
	static	json(res, cmd, session)
	{
		session.format = 'json';
	}

	static	txt(res, cmd, session)
	{
		session.format = 'text';
	}

	static get(res, cmd, session)
	{
		if (cmd.argv[0] == undefined)
		{
			res.result	= session.config.keys();
			return;
		}
		try
		{
			const	reg		= new RegExp(cmd.argv[0]);
			const	vars	= session.config.keys();
			res.result	= {};
			for (var sec in vars)
			{
				for (var key in vars[sec])
				{
					const	name	= sec+'.'+key;
					if (name.match(reg))
					{
						if (!res.result[sec]) { res.result[sec] = {}; }
						res.result[sec][key] = session.config.get_value(name);
					}
				}
			}
		}
		catch (err)
		{
			throw	`regex error : '${cmd.argv[0]}'`;
		}
	}
}
