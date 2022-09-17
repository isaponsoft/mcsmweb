const	{ spawn }			= require('node:child_process')
const	fs					= require('node:fs');
const	path				= require('node:path');
const	process				= require('node:process');
const	axios				= require('axios');
const	lfs					= require(__dirname + '/lib/filesystem');
const	Interface			= require(__dirname + '/interface/interface');
const	ProgramController	= require(__dirname + '/interface/if_program');

Interface.startup({
	broadcast:	null
});
Interface.config.set('mcsm.log-level', -1)

const	destdir				= path.normalize(Interface.argv[0]);
const	version				= Interface.argv[1];
const	javacmd				= Interface.config.get_string('mcsm.java-cmd');
const	buildtool			= path.join(destdir, 'BuildTools.jar');

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
			writeState(`${ProgramController.STATE.DOWNLOADING} Download start to ${buildtool}`);

			const	r	= await	axios.get('https://hub.spigotmc.org/jenkins/job/BuildTools/lastSuccessfulBuild/artifact/target/BuildTools.jar', { responseType : 'arraybuffer' });
			if (r.status != 200)
			{
				writeState(`${ProgramController.STATE.DOWNLOADERROR} Download error : ${r.data.toString()}`);
				try { fs.unlinkSync(buildtool); } catch (err) {}
				process.exit(1);
			}
			fs.writeFileSync(buildtool, r.data);
			writeState(`${ProgramController.STATE.DOWNLOADOK} Download OK`);
		}
		catch (err)
		{
			writeState(`${ProgramController.STATE.DOWNLOADERROR} Download error : ${err.toString()}`);
			try { fs.unlinkSync(buildtool); } catch (err) {}
			process.exit(1);
		}
	}

	// Build
	if (readState() < ProgramController.STATE.BUILDOK)
	{
		writeState(`${ProgramController.STATE.BUILDING} Build start version = ${version}`);


		const	r	= await new Promise(resolve => {
			console.log("change directory : " + destdir);
			process.chdir(destdir);
			process.env[process.platform == "win32" ? "USERPROFILE" : "HOME"]	= destdir;
			fs.writeFileSync('.gitconfig', "[user]\n  name=mcsmnj\n  email=\n");

			const	fp	= fs.openSync('build.log', "w");
			const	cmds	= [];
			cmds.push('-jar');
			cmds.push('BuildTools.jar');
			cmds.push('--rev');
			cmds.push(version);
			const	proc 	= spawn(javacmd, cmds);
			proc.stdout.on('data', (line) => { fs.writeFileSync(fp, line); console.log(line.toString().trim()); });
			proc.stderr.on('data', (line) => { fs.writeFileSync(fp, line); console.log(line.toString().trim()); });
			proc.on('spawn', (code) => { });
			proc.on('error', () => { });
			proc.on('close', (code) => { fs.closeSync(fp); });
			proc.on('disconnect', (code) => { });
			proc.on('exit', (code) =>
			{
				if (code)
				{
					writeState(`${ProgramController.STATE.BUILDERROR} Build error version = ${version}`);
				}
				else
				{
					writeState(`${ProgramController.STATE.BUILDOK} Build OK version = ${version}`);
				}
				resolve(code);
			});
		});
		console.log(`Exit code ${r}.`);
	}
}
main();
