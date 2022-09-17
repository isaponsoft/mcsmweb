var		lang		= window.navigator.language;
var		translate	= translates['en-US'];	// default
const	savedLang	= localStorage.getItem("language");
if (savedLang)
{
	lang	= savedLang;
}
if (translates[lang])
{
	translate	= translates[lang];
}

function updateTranslated()
{
	document.querySelectorAll('.translated').forEach((e) =>
	{
		const	k	= e.innerText;
		if (translate[k])
		{
			e.innerText	= translate[k];
		}
	});
}

function updateTranslateSelector()
{
	const	box	= document.querySelector('#language-list');
	for (var lang in translates)
	{
		const	sel		= lang;
		const	item	= document.createElement('li');
		item.innerText	= translates[sel]['Language'];
		item.addEventListener('click', () =>
		{
			localStorage.setItem("language", sel);
			location.reload();
		});
		box.appendChild(item);
	}
}

updateTranslateSelector();
updateTranslated();
