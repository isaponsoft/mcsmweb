const	Log				= require('../lib/log')
const 	Command			= require('./command')
const	Response		= require('./response')

/*
 * 接続中のクライアントとのセッション情報を保存する箱
 */
module.exports = class	Session
{
	id		= '';

	config		= null;

	socket		= null;
	format		= 'text';		// 現在のレスポンスの形式
	world		= null;			// 現在選択中のワールド
	send		= null;
	broadcast	= null;

	authToken	= null;
	auth		= 0;		// 認証済みなら 1、認証失敗なら -1
	user		= null;
	endpoint	= null;

	constructor(config, endpoint)
	{
		this.config		= config;
		this.endpoint	= endpoint;
		this.id			= Date.now().toString(16) + Math.floor(2000 * Math.random()).toString(16);
	}

	onMessage(message)
	{
		const	s	= message.utf8Data;
		const	cmd	= new Command(s);
		const	api	= cmd.api.trim(' /');
		Log.trace(`WS ${api}`);
		try
		{
			if (this.endpoint[api] == undefined)
			{
				Log.info(`${api} api not found.`);
				throw	"Not found";
			}

			const	e	= this.endpoint[api];
			const	res	= new Response(api);
			if ((!api.startsWith('auth/')) && this.auth != 1)
			{
				throw	"Auth error";
			}
			e(res, cmd, this);
			this.send(res);
		}
		catch (err)
		{
			Log.e_err(err, `${api} ${err.toString()}`);
			var	msg	= "";
			if (typeof (err) === "string")
			{
				msg	= err.toString();
			}
			else
			{
				msg	= 'Internal server error';
			}
			this.send(`NG ${api} ${msg}`);
		}
	}


	finish()
	{
	}
};
