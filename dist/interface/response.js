module.exports	= class	Response
{
	api		= '';
	cmd		= '';
	status	= '';
	msg		= '';
	result	= {};

	constructor(api)
	{
		this.api	= api;
		this.status	= 'OK';
	}


	build(format)
	{
		let	r	= `${this.status} ${this.api} ${this.msg}`;
		r = r + "\n";
		if (this.result && (this.result.length > 0 || Object.keys(this.result).length > 0))
		{
			if (format == 'json')
			{
				r	= r + JSON.stringify(this.result);
			}
			else
			{
				let	list	= "";
				for (let name in this.result)
				{
					let	line 	= `[${name}]\n`;
					let		maxlen	= 0;
					for (let key in this.result[name])
					{
						maxlen	= key.length > maxlen ? key.length : maxlen;
					}
					for (let key in this.result[name])
					{
						line	= line
								+ key.padStart(maxlen, ' ') + " = " + this.result[name][key] + "\n";
					}
					list	= list + line;
				}
				r = r + list;
			}
		}
		return	r;		
	}
}
