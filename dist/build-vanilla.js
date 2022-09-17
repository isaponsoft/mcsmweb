const	{ spawn }			= require('node:child_process')
const	fs					= require('node:fs');
const	path				= require('node:path');
const	process				= require('node:process');
const	axios				= require('axios');
const	admzip				= require("adm-zip");
const	lfs					= require(__dirname + '/lib/filesystem');
const	Interface			= require(__dirname + '/interface/interface');
const	ProgramController	= require(__dirname + '/interface/if_program');

Interface.startup({
	broadcast:	null
});
Interface.config.set('mcsm.log-level', -1)

const	destdir			= path.normalize(Interface.argv[0]);
const	sourceUrl		= Interface.argv[1];
const	zipfile			= path.join(destdir, 'server.jar');

function writeState(msg)
{
	try
	{
		fs.writeFileSync(path.join(destdir, 'state'), msg+"\n");
	}
	catch (err)
	{
	}
	console.log("**** CHANGE STATE ****");
}

function readState(msg)
{
	try
	{
		const	state	= fs.readFileSync(path.join(destdir, 'state')).toString();
		return	parseInt(state.substr(0, state.indexOf(' ')));
	}
	catch (err)
	{
		return	"";
	}
}


async function main()
{
	// Download
	if (readState() < ProgramController.STATE.DOWNLOADOK)
	{
		try
		{
			lfs.mkdir(destdir);
			writeState(`${ProgramController.STATE.DOWNLOADING} Download start from ${sourceUrl}`);

			const	r	= await	axios.get(sourceUrl, { responseType : 'arraybuffer' });
			if (r.status != 200)
			{
				writeState(`${ProgramController.STATE.DOWNLOADERROR} Download error : ${r.data.toString()}`);
				try { fs.unlinkSync(zipfile); } catch (err) {}
				process.exit(1);
			}
			fs.writeFileSync(zipfile, r.data);
			writeState(`${ProgramController.STATE.DOWNLOADOK} Download OK`);


			const	zip		= new admzip(zipfile);
			const	entries	= zip.getEntries();
			entries.forEach((e) =>
			{
				const	m	= e.entryName.match('.*version.json$');
				if (m)
				{
					zip.extractEntryTo(
						e.entryName,
						destdir,
						false,
						true,
						false,
						'version.json'
					);
				}
			});
		}
		catch (err)
		{
			writeState(`${ProgramController.STATE.DOWNLOADERROR} Download error : ${err.toString()}`);
			try { fs.unlinkSync(zipfile); } catch (err) {}
			process.exit(1);
		}
		process.exit(0);
	}

}
main();
