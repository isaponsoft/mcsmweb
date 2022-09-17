const	fs					= require('fs');
const	archiver			= require('archiver');
const	path				= require('path');
const	Interface			= require(__dirname + '/interface/interface');
const	BackupController	= require(__dirname + '/interface/if_backup');
const	WorldController		= require(__dirname + '/interface/if_world');
const	Log					= require(__dirname + '/lib/log');
const	DS					= '/';

Interface.startup({
	broadcast:	null
});


const	backupsdir			= Interface.backupdir;
const	worldsdir			= Interface.worlddir;
const	worldId				= Interface.argv[0];
const	title				= Interface.argv[1];

// 名前は適当。かぶらなければOK
const	basename	= BackupController.make_basename();
const	zipfile		= path.join(backupsdir, basename+'.zip');

// Output file.
const	out			= fs.createWriteStream(zipfile);
out.on('close', () =>
{
});
out.on('end', () =>
{
});


const	archive		= archiver('zip', {
	zlib: { level: 9 }
});
archive.on('warning', (err) =>
{
	if (err.code === 'ENOENT')
	{
		return;
	}
});
archive.on('error', (err) =>
{
	BackupController.make_state(basename, title, BackupController.ST_ERROR, err.toString());
});
archive.on('finish', (err) =>
{
	BackupController.make_state(basename, title, BackupController.ST_OK, '');
});


function enumfiles(dirpath, files = [])
{
	for (const filename of fs.readdirSync(dirpath))
	{
		const	fullname	= path.join(dirpath, filename);
		const	state		= fs.statSync(fullname);
		if (state.isDirectory())
		{
			//files.push(fullname + DS);
			files	= enumfiles(fullname, files);
		}
		else
		{
			files.push(fullname);
		}
	}
	return	files;
};


BackupController.make_state(basename, title, BackupController.ST_ARCHIVING, `World ${worldId} archiving.`);
archive.pipe(out);
enumfiles(path.join(worldsdir, worldId)).forEach((fullpath) =>
{
	var	relpath	= fullpath.replace(worldsdir, '');
	if (relpath[0] == DS)
	{
		relpath	= relpath.substr(1);
	}
	archive.append(fs.createReadStream(fullpath), { name: relpath });
});
archive.finalize();
