const 	Log		= require('./log')
const	net		= require('net');

module.exports	= class Minecraft
{
	socket	= null;
	name	= null;
	address	= null;
	port	= null;
	buff	= null;
	callback	= null;


	ping(name, address, port, callback)
	{
		this.address	= address;
		this.port		= port;
		this.callback	= callback;

		this.socket	= new net.Socket();
		this.socket.connect(port, address, () =>
		{
			try
			{
				this.send_ping();
			}
			catch (err)
			{}
		});
		this.socket.on('data', (buff) =>
		{
			try
			{
				var	data	= new ArrayBuffer(buff.length);
			    var view	= new Uint8Array(data);
				for (var i = 0; i < buff.length; ++i)
				{
					view[i] = buff[i];
				}
				if (this.buff == null)
				{
					this.buff	= new ArrayBuffer(0);
				}
				this.buff	= Minecraft.concat(this.buff, data);
				this.msg();
			}
			catch (err)
			{}
		});
		this.socket.on('close', () =>
		{
			this.buff	= null;
			this.socket	= null;
		});
		this.socket.on('error', (error) =>
		{
			Log.trace("ping failed");
		});
	}

	close()
	{
		if (this.socket)
		{
			this.buff	= null;
			this.socket.close();
			this.socket	= null;
		}
	}


	static load_skin(uid, callback)
	{
		const	url	= "https://sessionserver.mojang.com/session/minecraft/profile/" + uid.replaceAll('-', '');
		fetch(url, { method: "GET" })
		.then((resp) => resp.json())
		.then((data) => Buffer.from(data.properties[0].value, 'base64').toString())
		.then((data) => JSON.parse(data))
		.then((data) => data['textures']['SKIN']['url'])
		.then((data) => fetch(data, { method: 'GET'}))
		.then((resp) => resp.blob())
		.then((data) => data.arrayBuffer())
		.then((data) => callback(new Uint8Array(data)))
		//.then((data) => fs.writeFileSync("/usr/home/foo/bar.png", data))
		.catch((response) =>
		{});
	}

	msg()
	{
		var	data	= this.buff;
		try
		{
			var	[ length, data ] = Minecraft.read_varint(data);
			var	[ zero,   data ] = Minecraft.read_varint(data);
			var	[ json,   data ] = Minecraft.read_string(data);
			const	info	=
			{
				'server'	: {
					'name'		: this.name,
					'address'	: this.address,
					'port'		: this.port
				},
				'status'	: JSON.parse(json)
			};
			this.callback(info);
			this.close();
		}
		catch (err)
		{
		}
	}

	send_ping()
	{
		var	cmd	= new Uint8Array([0x00, 0x04]);
		cmd	= Minecraft.append_string(cmd, this.address);
		cmd	= Minecraft.append_ushort(cmd, this.port);
		cmd	= Minecraft.append_varint(cmd, 1);

		cmd	= Minecraft.concat(Minecraft.mk_varint(cmd.byteLength), cmd);		// Add length header.
		cmd	= Minecraft.concat(cmd, new Uint8Array([0x01, 0x00]));				// Add terminate

		this.socket.write(Buffer.from(cmd))
	}


	static read_varint(buff)
	{
		const	buf	= new Uint8Array(buff);
		var		val	= 0;
		var		len	= 0;
		var		idx	= 0;
		while (true)
		{
			var	c	=  buf[idx++];
			val	|= (c & 0x7F) << len++ * 7;
			if (len > 5)
			{
				return	[ 0, 0];
			}
			if ((c & 0x80) != 128)
			{
				break;
			}
		}
		return	[val, Minecraft.subary(buff, idx)];
	}

	static read_string(buff)
	{
		var	[ len, buff ]	= Minecraft.read_varint(buff);
		if (len == 0)
		{
			return	[ "", buff ];
		}
		if (buff.byteLength < len)
		{
			throw	"buffer underfllow";
		}
		const	s	= buff.slice(0, len);
		const	r	= new TextDecoder('utf-8').decode(s);
		return	[ r, Minecraft.subary(buff, len) ];
	}

	static append_string(a, s)
	{
		return	Minecraft.concat(a, Minecraft.mk_string(s));
	}

	static append_varint(a, n)
	{
		return	Minecraft.concat(a, Minecraft.mk_varint(n));
	}

	static append_ushort(a, n)
	{
		return	Minecraft.concat(a, Minecraft.mk_ushort(n));
	}

	static mk_string(s)
	{
		const	str	= new Uint8Array(new TextEncoder('utf-8').encode(s));
		return	Minecraft.concat(Minecraft.mk_varint(str.byteLength), str);
	}

	static mk_ushort(n)
	{
		const	r	= new Uint8Array([(n>>8) & 0xff, n & 0xff]);
	    return	r;
	}

	static	SEGMENT_BITS	= 0x7f;
	static	CONTINUE_BIT	= 0x80;

	static mk_varint(n)
	{
		var	ret	= new ArrayBuffer(0);
		while (true)
		{
			if ((n & ~Minecraft.SEGMENT_BITS) == 0)
			{
				const	append	= new Uint8Array(new ArrayBuffer(1));
				append[0]	= n;
			    return	Minecraft.concat(ret, append);
			}
			const	append	= new Uint8Array(new ArrayBuffer(1))
			append[0]		= (n & Minecraft.SEGMENT_BITS) | Minecraft.CONTINUE_BIT;
			ret				= Minecraft.concat(ret, append);
			n	>>= 7;
		}
		return	ret;
	}


	static concat(a1, a2)
	{
		const	tmp = new Uint8Array(a1.byteLength + a2.byteLength);
		tmp.set(new Uint8Array(a1), 0);
		tmp.set(new Uint8Array(a2), a1.byteLength);
		return	tmp.buffer;
	};

	static subary(a, off)
	{
		const	r	= a.slice(off);
		return	r;
	};
};
