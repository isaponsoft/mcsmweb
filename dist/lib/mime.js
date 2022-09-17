module.exports = class	Mime
{
	static get(extr)
	{
		switch (extr)
		{
			case 'css'	: return	'text/css';
			case 'gif'	: return	'image/gif';
			case 'html'	: return	'text/html';
			case 'ini'	: return	'text/plain';
			case 'js'	: return	'text/javascript';
			case 'jar'	: return	'application/java-archive';
			case 'jpeg'	: return	'image/jpeg';
			case 'jpg'	: return	'image/jpeg';
			case 'json'	: return	'application/json';
			case 'png'	: return	'image/png';
			case 'txt'	: return	'text/plain';
			case 'zip'	: return	'application/zip';
			default		: return	null;
		}
	}
};
