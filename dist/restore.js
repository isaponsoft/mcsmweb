#!env node
const	fs					= require('node:fs');
const	path				= require('node:path');
const	process				= require('node:process');
const	admzip				= require("adm-zip");
const	Interface			= require(__dirname+'/interface/interface');
const	World				= require(__dirname+'/interface/world');
const	lfs					= require(__dirname+'/lib/filesystem');

Interface.startup({
	broadcast:	null
});
const	destDir				= Interface.argv[0];
const	srcZipFile			= Interface.argv[1];

function saveState(code, msg)
{
	fs.writeFileSync(path.join(destDir, 'state'), `${code} ${msg}\n`);
}


try
{

	lfs.mkdir(destDir);
	saveState(World.PROCESS.RESTORE, 'Restore starting.');

	const	zip		= new admzip(srcZipFile);
	const	entries	= zip.getEntries();

	var		topdir	= '';
	entries.forEach((e) =>
	{
		if (e.isDirectory)
		{
			return;
		}

		if (!topdir)
		{
			const	m	= e.entryName.match('^(.+\\/)*server.properties$');
			if (m)
			{
				topdir	= m[1];
			}
		}
	});

	saveState(World.PROCESS.RESTORE, 'Restore files.');
	entries.forEach((e) =>
	{
		const	destname	= e.entryName.replace(topdir, '');
		if (e.isDirectory || destname == 'state')
		{
			return;
		}
		zip.extractEntryTo(
			e.entryName,
			destDir,
			false,
			true,
			false,
			destname
		);
	});
	saveState(World.PROCESS.ACTIVE, '');

	process.exit(0);
}
catch (err)
{
	saveState(World.PROCESS.ERROR, err.toString());
	process.exit(1);
}
