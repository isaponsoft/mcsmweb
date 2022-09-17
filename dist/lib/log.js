const	fs		= require('fs');
const	util	= require('util');
module.exports	= class	Log
{
	static	config		= null;
	static	logdir		= null;
	static	logfile		= null;
	static	lastlogfile	= null;
	static	loghandle	= null;


	static get Lv()
	{return{
		none		: 0,
		alert		: 1,
		cri			: 2,
		err			: 3,
		warn		: 4,
		note		: 5,
		info		: 6,
		debug		: 7,
		trace		: 8
	}}


	static none	(...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.none , ...msg); } }
	static alert(...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.alert, ...msg); } }
	static cri  (...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.cri ,  ...msg); } }
	static err  (...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.err ,  ...msg); } }
	static warn (...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.warn,  ...msg); } }
	static note (...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.note,  ...msg); } }
	static info (...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.info,  ...msg); } }
	static debug(...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.debug, ...msg); } }
	static trace(...msg) { try { throw new Error(""); } catch (e) { Log.out(e, 1, Log.Lv.trace, ...msg); } }

	static e_alert	(e, ...msg) { Log.out(e, 0, Log.Lv.alert, ...msg); }
	static e_cri	(e, ...msg) { Log.out(e, 0, Log.Lv.cri  , ...msg); }
	static e_err	(e, ...msg) { Log.out(e, 0, Log.Lv.err  , ...msg); }
	static e_warn	(e, ...msg) { Log.out(e, 0, Log.Lv.warn , ...msg); }


	static	level()
	{
		return	Log.config
				? Log.config.get_integer('mcsm.log-level', Log.Lv.warn)
				: Log.Lv.warn;
	}

	static	location()
	{
		return	Log.config
				? Log.config.get_boolean('mcsm.log-location', false)
				: false;
	}

	static	is_time()
	{
		return	Log.config
				? Log.config.get_boolean('mcsm.log-time', false)
				: false;
	}

	static out(e, depth, level, ...msg)
	{
		if (level > 0 && level <= Log.level())
		{
			let	prefix	= "";
			if (Log.is_time())
			{
				const	time	= new Date();
				const	year	= (""+time.getFullYear())	.padStart(4, '0');
				const	mon		= (""+(time.getMonth()+1))	.padStart(2, '0');
				const	mday	= (""+time.getDate())		.padStart(2, '0');
				const	hour	= (""+time.getHours())		.padStart(2, '0');
				const	min		= (""+time.getMinutes())	.padStart(2, '0');
				const	sec		= (""+time.getSeconds())	.padStart(2, '0');

				prefix	= prefix + `[${year}/${mon}/${mday} ${hour}:${min}:${sec}] `;
			}

			if (Log.location())
			{
				let	targetDepth	= depth;
				const	lines	= e.stack.split("\n");
				const	line	= lines[1 + targetDepth];
				const	m		= line.match("\\(.+/(.+):(\\d+):(\\d+)\\)");
				const	source	= m
								? m[1] + '(' + m[2] + ')'
								: 'unkown source';
				prefix	= prefix + source.padEnd(22, ' ') + " : ";
			}

			switch (level)
			{
				case 1 :	prefix = prefix + '[ALT] '; break;
				case 2 :	prefix = prefix + '[CRI] '; break;
				case 3 :	prefix = prefix + '[ERR] '; break;
				case 4 :	prefix = prefix + '[WRN] '; break;
				case 5 :	prefix = prefix + '[NOT] '; break;
				case 6 :	prefix = prefix + '[INF] '; break;
				case 7 :	prefix = prefix + '[DEB] '; break;
				case 8 :	prefix = prefix + '[TRC] '; break;
			}

			if (!Log.logdir || !Log.logfile)
			{
				console.log(prefix, msg);
			}
			else
			{
				const	date		= new Date();
				const	filename	= Log.logdir + '/'
									 + (
										Log.logfile
										. replace('%Y', (""+date.getFullYear()).padStart(4, '0'))
										. replace('%m', (""+(date.getMonth()+1)).padStart(2, '0'))
										. replace('%d', (""+date.getDate()).padStart(2, '0'))
										. replace('%H', (""+date.getHours()).padStart(2, '0'))
										. replace('%I', (""+date.getMinutes()).padStart(2, '0'))
										. replace('%S', (""+date.getSeconds()).padStart(2, '0'))
									);
				if (Log.lastlogfile != filename)
				{
					if (Log.loghandle)
					{
						fs.closeSync(Log.loghandle);
					}
					Log.lastlogfile	= filename;
					Log.loghandle	= fs.openSync(filename, "a");
				}
				var	v	= msg[0];
				if (typeof v !== 'string')
				{
					v	= util.format(msg).replace(/^\[[ \t\r\n]+/, '').replace(/[ \t\r\n]+\]$/, '');
				}
				fs.writeFileSync(Log.loghandle, `${prefix} ${v}\n`);
			}
		}
	}
}
