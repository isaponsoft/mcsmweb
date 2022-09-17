function sha256(message)
{
	const	msg	= new TextEncoder("utf-8").encode(message);
	return	crypto.subtle.digest('SHA-256', msg);
}

document.getElementById('btn-login').addEventListener('click', () =>
{
	document.getElementById('dialog-loading').showModal();

	var	user	= '';
	var	pass	= '';
	var	inputs	= document.getElementById('dialog-login').querySelectorAll('input');
	for (var i = 0; i < inputs.length; i++)
	{
		if (inputs[i].name == 'user')
		{
			user	= inputs[i].value;
		}
		if (inputs[i].name == 'pass')
		{
			pass	= inputs[i].value;
		}
	}
	connect(user, pass);
});
