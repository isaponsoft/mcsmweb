const	fs				= require('fs');
const	path			= require('path');
const	Log				= require('./log');

module.exports	= class	filesystem
{
	// if not exists make a directory.
	static mkdir(dirname)
	{
		try
		{
			const	stat	= fs.lstatSync(dirname);
			if (stat.isDirectory())
			{
				return	true;
			}
		}
		catch (err)
		{
			Log.note(`makdir : ${dirname}`);
			fs.mkdirSync(dirname, { recursive : true });
			return	false;
		}
		Log.err(`'${dirname}' is not directory.`);
		throw	`'${dirname}' is not directory.`;
	}

	static normalize(fname)
	{
		return	path.normalize(fname);
	}

	static join(...fname)
	{
		var	p	= fname[0];
		for (var i = 1; i < fname.length; ++i)
		{
			p	= path.join(p, fname[i]);
		}
		return	path.normalize(p);
	}

	static rm(filename, callback)
	{
		try
		{
			fs.rm(filename, () =>
			{
				callback(true);
			});
			return	true;
		}
		catch (err)
		{
			callback(false);
			return	false;
		}
	}

};
