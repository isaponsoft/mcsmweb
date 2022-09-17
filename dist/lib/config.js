const	fs				= require('fs');
const	path			= require('path');
const	Log				= require('./log')

module.exports	= class Config
{
	filename;
	values		= {};
	error		= null;
	parent		= null;
	updatable	= false;
	validator	= null;
	usescope	= true;

	topparent()
	{
		var	p	= this;
		while (p.parent)
		{
			p	= p.parent;
		}
		return	p;
	}

	keys()
	{
		var	p	= this.parent;
		while (p.parent)
		{
			p	= p.parent;
		}
		const	r	= [];
		for (var sec in p.values)
		{
			r[sec]	= [];
			for (var key in p.values[sec])
			{
				r[sec][key] = this.get_value(`${sec}.${key}`);
			}
		}
		return	r;
	}

	set(name, value)
	{
		try
		{
			value	= this.validation(name, value);
		}
		catch (err)
		{

			Log.note(`${this.filename} : ${err.toString()}`);
			throw	`${this.filename} : ${err.toString()}`;
		}

		const	pos		= name.indexOf('.');
		if (pos > 0 && this.usescope)
		{
			const	sec	= name.substr(0, pos);
			const	key	= name.substr(pos + 1);
			if (this.values[sec] == undefined) { this.values[sec] = {}; }
			this.values[sec][key] = value;
		}
		else
		{
			this.values[name] = value;
		}
	}

	validation(name, value)
	{
		if (this.parent)
		{
			return	this.parent.validation(name, value);
		}
		if (this.validator == null)
		{
			return	value;
		}
		if (this.validator[name] == undefined)
		{
			throw	`Unkown value name '${name}'.`;
		}
		switch (this.validator[name].fmt)
		{
			case 'int' :
			{
				if (Number.isInteger(value) || value.match("^\\d+$"))
				{
					return	parseInt(value);
				}
				break;
			}

			case 'bool' :
			{
				if (value == '1' || value == 'true' ) { return true;  }
				if (value == '0' || value == 'false') { return false; }
				break;
			}

			case 'dir' :
			{
				// 設定時はディレクトリの有無のテストは行わない
				if (value.slice(-1) != '/')
				{
					value = value + '/';
				}
				return	value;
			}
			default:
				return	value;

		}
		throw	`'${name}' = '${value}' is not ${this.validator[name].fmt}.`;
	}

	constructor(filename, initext, parent, usescope = true)
	{
		this.filename	= filename;
		this.parent		= parent;
		this.usescope	= usescope;
		if (!this.parent)
		{
			this.validator	= null;
		}

		let		group	= null;
		const	lines	= initext.split("\n");
		for (let i in lines)
		{
			const	line	= lines[i].trim();
			if (line.length == 0 || line[0] == ';' || line[0] == '#')
			{
				continue;
			}
			if (line[0] == '[')
			{
				const	pos	= line.indexOf(']');
				if (pos < 0)
				{
					throw	filename + '(' + (i + 1) + ') : Unclosed section.';
				}
				group	= line.substr(1, pos - 1).trim();
				this.values[group]	= [];
				continue;
			}

			const	pos	= line.indexOf('=');
			if (pos < 0)
			{
				throw	filename + '(' + (i + 1) + ') : parse error.';
			}
			const	key	= line.substr(0, pos).trim();
			var		val	= line.substr(pos + 1).trim();
			if (!key)
			{
				throw	filename + '(' + (i + 1) + ') : key nothing.';
			}

			const	cpos	= val.indexOf(';');
			if (cpos > 0)
			{
				const	comment	= val.substr(cpos + 1).trim();
				val	= val.substr(0, cpos).trim();
				if (!this.parent)
				{
					if (this.validator == null) { this.validator = {}; }

					const	msg		= comment.match("'msg=([^']+)");
					const	fmt		= comment.match("'fmt=([^']+)");
					this.validator[group ? `${group}.${key}` : key]	= {
						'msg'		: msg ? msg[1].trim() : null,
						'fmt'		: fmt ? fmt[1].trim() : null,
					};
				}
			}
			this.set(group ? `${group}.${key}` : key, val);
		}
	}

	load_value(name)
	{
		const	pos		= name.indexOf('.');
		var		value	= undefined;
		if (pos > 0 && this.usescope)
		{
			const	sec	= name.substr(0, pos);
			value	= this.values[sec] == undefined
					?	undefined
					:	this.values[sec][name.substr(pos + 1)];
		}
		else
		{
			value	= this.values[name];
		}
		if (value == undefined && this.parent)
		{
			value	= this.parent.load_value(name);
		}
		return	value;
	}


	get_value(name, defaultValue = undefined)
	{
		// load value
		var		value	= this.load_value(name);
		if (value == undefined)
		{
			if (defaultValue == undefined)
			{
				throw	this.filename + " Config '"+name+"' nothing.";
			}
			value	= defaultValue;
		}

		// rewrite variable
		if (typeof value === "string" || value instanceof String)
		{
			const	maxNest	= 10;
			for (var i = 0; i < maxNest; ++i)
			{
				const	m	= value.match('\\${(.+)}');
				if (!m)
				{
					break;
				}
				var	v	= this.load_value(m[1]);
				if (v == undefined)
				{
					const	pos	= name.indexOf('.');
					if (pos > 0)
					{
						v	= this.load_value(name.substr(0, pos+1) + m[1]);
					}
				}
				if (v == undefined)
				{
					throw	`${this.filename} Config '${name}' : reference to unkown variable '${m[1]}'.`;
				}
				value	= value.replace('\${'+m[1]+'}', v);
			}
		}
		return	value;
	}

	get_string(name, defaultValue = undefined)
	{
		return	"" + this.get_value(name, defaultValue);
	}

	get_filepath(name, defaultValue = undefined)
	{
		return	path.normalize(this.get_value(name, defaultValue));
	}

	get_integer(name, defaultValue = undefined)
	{
		const	val		= this.get_value(name, defaultValue);
		if (Number.isInteger(val))
		{
			return	val;
		}
		const	isNum	= (""+val).match("^\\d+$");
		if (isNum)
		{
			return	parseInt(val);
		}
		throw	`${name} = ${val} is not numerics.`;
	}

	get_boolean(name, defaultValue = undefined)
	{
		const	val		= this.get_value(name, defaultValue);
		if (val == '1' || val == 'true')
		{
			return	true;
		}
		if (val == '0' || val == 'false')
		{
			return	false;
		}
		throw	`${name} = ${val} is not boolean.`;
	}

	// 有効なディレクトリであれば値を返す
	// 	creating : true のときはディレクトリを作成する
	get_directory(name, creating, defaultValue = undefined)
	{
		let	val	= this.get_string(name, defaultValue);
		if (val.slice(-1) != '/')
		{
			val = val + '/';
		}
		if (fs.existsSync(val))
		{
			if (!fs.statSync(val).isDirectory())
			{
				throw	`'${name}' = '${val}' is not directory.`;
			}
			try
			{
				fs.accessSync(val, fs.constants.R_OK | fs.constants.W_OK);
				return	val;
			}
			catch (err)
			{
				throw	`'${name}' = '${val}' can't access directory.`;
			}
		}
		if (!creating)
		{
			throw	`'${name}' = '${val}' is not directory.`;
		}
		try
		{
			fs.mkdirSync(val);
			return	val;
		}
		catch (err)
		{
			throw	`'${name}' = '${val}' can not make directory.`;
		}
		return	val;
	}


	// 指定したキーの値から ini を読み取る
	//	required : false の時はファイルが存在しない場合は無視する
	load_inifile(prefix, name, parent, required = true)
	{
		let		val			= this.get_string(name);
		const	filename	= prefix + val;
		if (!fs.existsSync(filename))
		{
			if (required)
			{
				throw	`'${name}' = '${filename}' nothing ini file.`;
			}
			return	new Config(filename, "");
		}
		let	inifile;
		try
		{
			inifile	= fs.readFileSync(filename);
		}
		catch (err)
		{
			throw	`'${name}' = '${filename}' can't read ini file.`;
		}
		return	new Config(filename, inifile.toString(), parent);
	}

}
