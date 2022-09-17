module.exports = class	Command
{
	api		= '';
	argv	= [];
	params	= {};

	argv_string(errorstr)
	{
		if (this.argv.length == 0)
		{
			throw	`Invalid argument : ${errorstr}`;
		}
		return	this.argv.shift();
	}

	get_string(name, defaultVal = undefined)
	{
		if (this.params[name] != undefined)
		{
			return	this.params[name];
		}
		if (defaultVal != undefined)
		{
			return	defaultVal;
		}
		throw	`Invalid parameter '${name}'.`;
	}

	constructor(line)
	{
		if (!line)
		{
			return;
		}

		let		command	= line.trim();
		while (command.length > 0)
		{
			const	f	= command[0];
			if (f == "'" || f == '"')
			{
				const	pos	= command.indexOf(f, 1);
				if (pos < 0)
				{
					throw	"Command parse error. Unclosed quataion.";
				}
				this.argv.push(command.substr(1, pos-1));
				command	= command.substr(pos+1);
				if (command.length == 0)
				{
					break;
				}
				if (command[0] != ' ')
				{
					throw	"Command parse error. Unsplit space.";
				}
				command	= command.trim();
			}
			else
			{
				const	pos	= command.indexOf(' ');
				if (pos < 0)
				{
					this.argv.push(command);
					break;
				}
				this.argv.push(command.substr(0, pos));
				command	= command.substr(pos+1).trim();
			}
		}
		this.api	= this.argv[0];
		this.argv.shift();

		for (let key in this.argv)
		{
			const	pos	= this.argv[key].indexOf('=');
			if (pos > 0)
			{
				const	name	= this.argv[key].substr(0, pos);
				const	val		= this.argv[key].substr(pos+1);
				this.params[name]	= val;
			}
		}
	}
}
