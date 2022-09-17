const	crypto			= require('crypto')
const	http			= require('https');
const	querystring		= require('querystring');
const	WebSocketServer	= require('websocket').server;
const	fs				= require('fs');
const 	Log				= require('./log')
const	Mime			= require('./mime')

class	Params
{
	url		= '';
	params	= {};
	files	= {};
};

class	Parser
{
	params	= new Params();
	tmpdir	= null;
	onEnd	= null;
	files	= [];

	static	randomname()
	{
		return 	crypto.createHash('sha256').update(new Date().getTime().toString(32) + Math.random().toString(16)).digest('hex');
	}

	constructor(request)
	{
		this.params.params	= {};
		if (request.headers.cookie)
		{
			const	cookies	= request.headers.cookie.split(';');
			cookies.forEach((v) =>
			{
				const	pos	= v.indexOf('=');
				const	key	= v.substr(0, pos);
				const	val	= v.substr(pos+1);
				this.params.params[key]	= val;
			});
		}

		const	pos		= request.url.indexOf('?');
		if (pos < 0)
		{
			this.params.url	= request.url;
		}
		else
		{
			const	qp	= querystring.parse(request.url.substr(pos + 1));
			for (var key in qp)
			{
				this.params.params[key]	= qp[key];
			}
			this.params.url		= request.url.substr(0, pos);
		}

		request.on("end", () =>
		{
			this.onEnd(this.params);
			this.close();
		});

		if (request.headers['content-type'] && request.headers['content-type'].startsWith('multipart/form-data;'))
		{
			const	boundary	= "--" + request.headers['content-type'].substr(request.headers['content-type'].indexOf('boundary=')+9);
			const	formData	= {};
			var		body		= '';
			var		mode		= 0;
			var		type		= '';
			var		name		= '';
			var		filename	= '';
			var  	stream		= null;

			request.on('data', chunk =>
			{
				try
				{
					body += chunk;
					while (body.length > 0)
					{
						// first boundary
						if (mode == 0)
						{
							const	pos1		= body.indexOf(boundary + "\r\n");
							const	pos2		= body.indexOf(boundary + "--\r\n");
							if (pos1 < 0 && pos2 < 0)
							{
								return;
							}
							const	pos			= pos1 < 0 ? pos2
												: pos2 < 0 ? pos1
												: pos1 < pos2 ? pos1 : pos2;
							if (pos == pos1)
							{
								body	= body.substr(pos + boundary.length + 2);
								mode	= 1;
							}
							else
							{
								body	= body.substr(pos + boundary.length + 4);
								mode	= -1;
							}
							continue;
						}

						// read headers
						if (mode == 1)
						{
							const	pos		= body.indexOf("\r\n\r\n");
							if (pos < 0)
							{
								return;
							}

							const	hblock	= body.substr(0, pos);
							body	= body.substr(pos + 4);
							const	headers	= {};
							type	= '';
							hblock.split("\r\n").forEach((line) =>
							{
								line.trim();
								const	pos		= line.indexOf(':');
								const	key		= line.substr(0, pos);
								const	data	= line.substr(pos+1).trim();
								headers[key]	= data;
								if (key == 'Content-Disposition')
								{
									const	m	= data.match('form-data; name="(.+?)"');
									name	= m[1];
								}
								if (key == 'Content-Type')
								{
									const	tmpname	= Parser.randomname();
									type		= data;
									filename	= this.tmpdir+"/"+tmpname;
									stream		= fs.createWriteStream(filename);
									this.files.push(filename);
								}
							});
							mode	= 2;
							continue;
						}

						// read body
						if (mode == 2)
						{
							if (body.length < boundary.length)
							{
								return;
							}
							const	pos		= body.indexOf(boundary);
							if (pos < 0)
							{
								if (stream)
								{
									const	len	= body.length - boundary.length;
									stream.write(body.substr(0, len));
									body	= body.substr(len);
								}
								return;
							}
							const	data	= body.substr(0, pos);
							body	= body.substr(pos);

							if (type == '')
							{
								this.params.params[name]	= data;
							}
							else
							{
								this.params.files[name]		= {
									'tmpfile':	filename,
									'type':		type
								};
								stream.write(data);
								stream.end();
							}

							mode	= 0;
							stream	= null;
							continue;
						}
					}
				}
				catch (err)
				{
					console.log("webserver : err : " + err.toString());
				}
			});
		}
	}

	close()
	{
		this.files.forEach((file) =>
		{
			try
			{
				fs.rmSync(file);
			}
			catch (err)
			{
				// 移動されている可能性もあるので削除できなくても無視する
			};
		});
	}
}


module.exports	= class	WebServer
{
	sslKey		= null;
	sslCert		= null;
	public_dir	= 'files';
	index_file	= 'index.html';
	port		= 443;
	tmpdir		= '/tmp/';

	httpd		= null;
	websock		= null;
	sockets		= [];

	onRequest	= (client) => {};
	onUrl		= (res, url, req) => { return null; };

	constructor(sslKey, sslCert)
	{
		try
		{
			this.sslKey	= fs.readFileSync(sslKey);
		}
		catch (err)
		{
			Log.err(sslKey + " : Can't read ssl private key.");
			process.exit(1);
		}
		try
		{
			this.sslCert	= fs.readFileSync(sslCert);
		}
		catch (err)
		{
			Log.err(sslCert + " : Can't read ssl cert key.");
			process.exit(1);
		}

		this.httpd	= http.createServer({ key: this.sslKey, cert: this.sslCert }, (request, response) =>
		{
			const	parser	= new Parser(request);
			parser.tmpdir	= this.tmpdir;
			parser.onEnd	= (params) =>
			{
				const url = (request.url == '/') ? ('/' + this.index_file) : request.url;
				try
				{
					const	res		= this.onUrl(response, params.url, params);
					if (res == true)
					{
						return;
					}
					if (res)
					{
						response.writeHead(res.status, { 'Content-Type': res.type, 'Content-Length': res.body.length });
						response.write(res.body, 'binary');
						response.end();
						return;
					}


				 	const	ext 		= /^.+\.([^.]+)$/.exec(url);
					const	fileextr	= ext == null ? "" : ext[1];
					fs.readFile(this.public_dir + '/' + url, 'binary', (error, data) =>
					{
						const	mime	= Mime.get(fileextr);
						if (!mime || error)
						{
							response.writeHead(404, { 'Content-Type': 'text/plain' });
							response.write("Not found");
							response.end();
							Log.info(`${url} not found.`);
							return;
						}
						const	header	= {
							'Content-Length':	data.length,
							'Content-Type':		mime
						};
						response.writeHead(200, header);
						response.write(data, 'binary');
						response.end();
					});
				}
				catch (err)
				{
					response.writeHead(404, { 'Content-Type': 'text/plain' });
					response.write(err.toString());
					response.end();
					Log.err(`${url} : ${err.toString()}`);
				}
			};
			request.resume();
		});

		this.websock	= new WebSocketServer(
		{
			httpServer: this.httpd
		});

		this.websock.on('request', (request) =>
		{
		 	const	client		= request.accept(null, request.origin);
			client.on('close', (reasonCode, description) =>
			{
				this.sockets	= this.sockets.filter((value, index, arr) =>
				{
			        return value != client;
		   		});
			});
			this.sockets.push(client);
			this.onRequest(client);
		});
	}


	close()
	{
		this.sockets.forEach( (s) => s.close() )
		this.httpd.close();
	}

	start()
	{
		this.httpd.listen(this.port);
	}

};
