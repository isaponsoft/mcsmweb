const	Session	= require('./session')
const	Log		= require('../lib/log');
const	crypto	= require('crypto')


module.exports	= class	AuthController
{
	static	randomkey()
	{
		return 	crypto.createHash('sha256').update(new Date().getTime().toString(32) + Math.random().toString(16)).digest('hex');
	}

	static session(res, cmd, session)
	{
		session.authToken	= AuthController.randomkey();
		res.msg				= session.authToken;
	}

	static login(res, cmd, session)
	{
		const	token	= cmd.argv_string('TOKEN');
		const	user	= cmd.argv_string('USERNAME');
		const	pass	= cmd.argv_string('PASSWORD');

		var		matchUser	= session.config.get_string('mcsm.admin-user');
		var		matchPass	= session.config.get_string('mcsm.admin-pass');
		if (matchUser == user)
		{
			const	match	= crypto.createHash('sha256').update(token + session.authToken + user + matchPass).digest('hex');
			if (pass == match)
			{
				Log.trace(`Login user='${user}'`);
				session.auth		= 1;
				session.user		= user;
				session.authToken	= AuthController.randomkey();
				res.msg	= session.authToken;
				return;
			}
		}
		Log.trace(`Login error ${user} : ${match} != ${pass}`);
		session.auth	= -1;
		res.status	= "NG";
		res.msg		= 'Auth error';
	}
}
