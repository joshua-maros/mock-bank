// Arg 0 is node. Arg 1 is script name. This code will switch how the server runs depending on whether or not arg2 is 
// 'prod' (production mode)
// Arg 2 can also be 'noauth' (dev mode and disable all authentication)
global.productionMode = process.argv.indexOf('--prod') !== -1;
global.authDisabled = process.argv.indexOf('--noauth') !== -1;
if (global.productionMode && global.authDisabled) {
	throw new Error('Cannot have authorization disabled in production mode.')
}
global.forceHttp = process.argv.indexOf('--force-http') !== -1;
global.redirectHttp = process.argv.indexOf('--no-reroute-http') === -1 && !global.forceHttp;
global.port = global.productionMode ? (global.forceHttp ? 80 : 443) : 4200;
if (!global.productionMode && !global.redirectHttp) {
	throw new Error('HTTP Rerouting can only be disabled in production mode.');
}
if (process.argv.indexOf('--port') !== -1) {
	const portIndex = process.argv.indexOf('--port') + 1;
	if (portIndex >= process.argv.length) {
		throw new Error('--port must be followed by a port number to serve on.');
	}
	const port = process.argv[portIndex];
	const portNum = Number(port);
	if (!(portNum >= 0 && portNum <= 65535)) {
		throw new Error('--port must be followed by a valid port number, not ' + a + '.');
	}
	global.port = portNum;
}
global.privateSubdir = '';
if (process.argv.indexOf('--file-subdir') !== -1) {
	const subdirIndex = process.argv.indexOf('--file-subdir') + 1;
	if (subdirIndex >= process.argv.length) {
		throw new Error('--file-subdir must be followed by the name of a directory in /private.');
	}
	global.privateSubdir = process.argv[subdirIndex] + '/';
}

const fs = require('mz/fs');
const https = require('https');
const path = require('path');
const c = require('../common/constants.json');
//Express framework stuff
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');

const dbs = require('./databases');
const ledger = require('./ledger');
const sessionStorage = require('./sessionStorage');

const rootDir = path.resolve(__dirname + '/../dist'); // ../ causes problems, because it is susceptible to exploitation.

var app = express();
app.use(compression());
app.use(bodyParser.json({type:"*/*"}));
app.use(bodyParser.urlencoded({
	extended: true
}));

let requestLogger = function (req, res, next) {
	console.log(req.ip || req.ips, req.method, req.path);
	if (req.body && Object.keys(req.body).length != 0) console.log('body:', req.body);
	next();
}
app.use(requestLogger);

// Callback is passed the contents of the token in the authorization header of req if successful, null if not, and
// undefined if header is not present.
function validateSession(req) {
	const authorization = req.get('authorization') || req.query.sessionToken;
	if (!authorization) {
		return undefined;
	}
	const split = authorization.split(' ');
	let method, token;
	if (split.length === 1) {
		token = split[0];
	} else {
		method = split[0];
		token = split[1];
	}
	if (sessionStorage.sessionExists(token)) {
		return sessionStorage.getSessionByToken(token);
	} else {
		return null;
	}
}

// Returns a promise that will pass a member to then() if the access level required is greater than c.ACCESS.VISITOR
// Errors are automatically handled.
async function checkLogin(req, res, accessLevel) {
	if (accessLevel === c.access.VISITOR || authDisabled) {
		return;
	}
	const session = validateSession(req);
	if (!session || !session.memberId) {
		let e = 'A valid session token representing a session with an associated logged in user must be sent in '
				+ 'the Authorization header. Either the token was not present, or the session associated with the '
				+ 'token does not represent a logged in user.';
		res.status(401).send({error: e});
		throw e;
	}
	const member = await dbs.members.findItemWithValue('id', session.memberId);
	if (await session.isExpired()) {
		let e = 'The session token provided has expired. Another session must be begun to continue.';
		res.status(401).send({error: e});
		throw e;
	}
	if (member.accessLevel == c.access.LEADER) { // Leaders can access anything, no matter what.
		return member;
	} else if (member.accessLevel == c.access.MEMBER && accessLevel == c.access.MEMBER) {
		// Members can access member-level and below stuff. (Below stuff handled earlier.)
		return member;
	} else {
		let e = 'This action requires the current user to be a leader.';
		res.status(403).send({error: e});
		throw e;
	}
}

function getAuthHost(req) {
	return `http${productionMode ? 's' : ''}://${req.headers.host}`;
}

app.get('/api/v1/session/isValid', async (req, res) => {
	const session = await validateSession(req);
	if (session) {
		const member = await dbs.members.findItemWithValue('id', session.memberId);
		res.status(200).send({
			sessionToken: session.token,
			expires: await session.getExpirationDate(),
			loggedInMember: censorMember(member, true)
		});
	} else {
		res.status(404).send({error: 'Invalid session.'});
	}
});

app.get('/api/v1/session/login', async (req, res) => {
	await new Promise((resolve) => setTimeout(resolve, 2000));
	const name = req.query.name.toLowerCase().trim().split(' ');
	const firstName = name[0], lastName = name[name.length - 1];
	const pin = req.query.pin;
	const members = await dbs.members.getAllItems();
	for (let member of members) {
		if (firstName !== member.firstName.toLowerCase()) continue;
		if (lastName !== member.lastName.toLowerCase()) continue;
		if (pin === member.pin) {
			const session = sessionStorage.createNewSession(member.id);
			res.status(200).send({
				sessionToken: session.token,
				expires: await session.getExpirationDate(),
				loggedInMember: censorMember(member, true)
			});
			return;
		} else {
			res.status(401).send({error: 'Incorrect name or PIN.'});
			return;
		}
	}
	res.status(401).send({error: 'Incorrect name or PIN.'});
});

function censorMember(member, showMore) {
	const tr = {
		id: member.id,
		firstName: member.firstName,
		lastName: member.lastName,
		class: member.class,
		ownsDesks: member.ownsDesks,
		rentsDesks: member.rentsDesks,
		jobs: member.jobs,
		currentWealth: ledger.getBalance(member)
	};
	if (showMore) {
		tr.accessLevel = member.accessLevel
	}
	return tr;
}

app.get('/api/v1/members', async (req, res) => {
	const loggedInMember = checkLogin(req, res, c.access.MEMBER);
	const result = [];
	for (let member of await dbs.members.getAllItems()) {
		result.push(censorMember(member));
	}
	result.push({
		id: c.BANK_ID,
		firstName: '!',
		lastName: 'Bank',
		class: 'none',
		ownsDesks: [],
		rentsDesks: [],
		jobs: [],
		currentWealth: 1000000
	});
	await loggedInMember;
	res.status(200).send(result);
});

app.post('/api/v1/members', async (req, res) => {
	const loggedInMember = await checkLogin(req, res, c.access.LEADER);
	const newMember = dbs.members.createMember({
		firstName: req.body.firstName || undefined,
		lastName: req.body.lastName || undefined,
		class: req.body.class || undefined,
		pin: req.body.pin || undefined
	});
	let amount = 0;
	if (req.body.class === 'blue') {
		amount = c.BLUE_START
	} else if (req.body.class === 'orange') {
		amount = c.ORANGE_START;
	}
	if (amount) {
		ledger.createTransaction(c.BANK_ID, newMember, amount, 'Starting Balance');
	}
	res.status(201).send(censorMember(newMember, true));
});

app.patch('/api/v1/members/:id', async (req, res) => {
	const loggedInMember = await checkLogin(req, res, c.access.LEADER);
	const existingMember = await dbs.members.findItemWithValue('id', req.params.id);
	for (const key of ['firstName', 'lastName', 'class', 'ownsDesks', 'rentsDesks', 'jobs']) {
		if (req.body[key]) {
			existingMember[key] = req.body[key];
		}
	}
	res.status(200).send(existingMember);
});

app.post('/api/v1/members/:id/switch', async (req, res) => {
	if (!req.body.other) {
		res.status(400).send({error: 'The parameter [other] must be provided in the request body.'});
		return;
	}

	await checkLogin(req, res, c.access.LEADER);
	
	const aid = req.params.id, bid = req.body.other;
	const aCopy = {};
	const a = dbs.members.findItemWithValue('id', aid), 
		  b = dbs.members.findItemWithValue('id', bid);
	// Switch their identifying information, but leave all their posession and status information.
	const aa = await a, ab = await b;
	const aFirst = aa.firstName, aLast = aa.lastName;
	aa.firstName = ab.firstName;
	aa.lastName = ab.lastName;
	ab.firstName = aFirst;
	ab.lastName = aLast;

	// Switch around their transactions.
	for (const transaction of await ledger.getTransactionHistory()) {
		if (transaction.from === aid) 
			transaction.from = bid;
		else if (transaction.from === bid) 
			transaction.from = aid;

		if (transaction.to === aid) 
			transaction.to = bid;
		else if (transaction.to === bid) 
			transaction.to = aid;
	}
	// A bunch of transactions were *edited*, the running tally of every account needs to be redone.
	await ledger.init(); 

	res.status(200).send({});
});

app.post('/api/v1/members/:id/promote', async (req, res) => {
	await checkLogin(req, res, c.access.LEADER);

	const orange = await dbs.members.findItemWithValue('id', req.params.id);
	if (orange.class !== 'orange') {
		res.status(400).send({error: 'Only oranges can be promoted.'});
		return;
	}
	const orangeBalance = ledger.getBalance(orange);
	if (orangeBalance < 550) {
		res.status(400).send({error: 'Oranges must have at least $550 to be promoted.'});
		return;
	}

	let blue;
	for (const member of await dbs.members.getAllItems()) {
		if (member.class === 'blue' && (!blue || ledger.getBalance(member) < ledger.getBalance(blue))) {
			blue = member;
		}
	}

	await ledger.createTransaction(blue, c.BANK_ID, ledger.getBalance(blue), 'Class Demotion');
	await ledger.createTransaction(c.BANK_ID, blue, c.ORANGE_START, 'Starting Balance');
	blue.class = 'orange';
	await ledger.createTransaction(orange, c.BANK_ID, orangeBalance, 'Class Promotion');
	await ledger.createTransaction(c.BANK_ID, orange, c.BLUE_START, 'Starting Balance');
	orange.class = 'blue';

	res.status(200).send(censorMember(orange));
})

app.post('/api/v1/members/:id/pin', async (req, res) => {
	const loggedInMember = await checkLogin(req, res, c.access.MEMBER);
	if (!req.body.oldPin || !req.body.newPin) {
		res.status(400).send({error: 'The parameters [oldPin, newPin] must be provided in the request body!'});
		return;
	}
	if (loggedInMember.id !== req.params.id) {
		res.status(403).send({error: 'Members can only change their own PINs!'});
		return;
	}
	// Artificial password check delay.
	await new Promise((res, rej) => {
		setTimeout(res, 2000);
	});
	const existingMember = await dbs.members.findItemWithValue('id', req.params.id);
	if (existingMember.pin !== req.body.oldPin) {
		res.status(403).send({error: 'Old PIN provided in request body does not match old PIN of user!'});
		return;
	}
	existingMember.pin = req.body.newPin;
	res.status(200).send({});
});

app.get('/api/v1/ledger', async (req, res) => {
	const loggedInMember = await checkLogin(req, res, c.access.MEMBER);
	const ledgerData = await ledger.getTransactionHistory();
	res.status(200).send(ledgerData);
});

app.post('/api/v1/ledger', async (req, res) => {
	if (!(req.body.from && req.body.to && req.body.amount)) {
		res.status(400).send({error: 'The parameters [from, to, amount] are required to be sent in the request body.'});
		return;
	}
	const loggedInMember = await checkLogin(req, res, c.access.MEMBER);
	if (loggedInMember.id !== req.body.from && loggedInMember.accessLevel !== c.access.LEADER) {
		res.status(403).send({error: 'Members can only send money from their own account.'});
		return;
	}
	const transaction = await ledger.createTransaction(req.body.from, req.body.to, req.body.amount, 
		req.body.reason || undefined);
	res.status(201).send(transaction);
});

app.post('/api/v1/ledger/paySalaries', async (req, res) => {
	await checkLogin(req, res, c.access.LEADER);
	for (const member of await dbs.members.getAllItems()) {
		for (const jobId of member.jobs) {
			const job = await dbs.jobs.findItemWithValue('id', jobId);
			let amount = 0;
			if (member.class === 'blue') {
				amount = job.blueSalary;
			} else if (member.class === 'orange') {
				amount = job.orangeSalary;
			} else {
				continue;
			}
			await ledger.createTransaction(c.BANK_ID, member.id, amount, c.reason.SALARY);
		}
	}
	res.status(201).send({});
});

app.get('/api/v1/jobs', async (req, res) => {
	await checkLogin(req, res, c.access.MEMBER);
	res.status(201).send(await dbs.jobs.getAllItems());
});

app.post('/api/v1/jobs', async (req, res) => {
	if (!(req.body.title && req.body.orangeSalary && req.body.blueSalary)) {
		res.status(400).send({error: 'The parameters [title, orangeSalary, blueSalary] are required in the request body.'});
		return;
	}
	await checkLogin(req, res, c.access.LEADER);
	const job = dbs.jobs.createJob({
		title: req.body.title,
		blueSalary: req.body.blueSalary,
		orangeSalary: req.body.orangeSalary
	});
	res.status(201).send(job);
});

app.delete('/api/v1/jobs/:id', async (req, res) => {
	await checkLogin(req, res, c.access.LEADER);
	const job = await dbs.jobs.findItemWithValue('id', req.params.id);
	if (!job) {
		res.status(404).send({error: 'No such job with id ' + req.params.id + '.'});
		return;
	}
	await dbs.jobs.removeItem(job);
	// TODO: Remove job from members that used to have it.
	res.status(200).send({});
})

app.get('/public/*', (req, res) => res.sendFile(rootDir + '/index.html'));
app.get('/private/*', (req, res) => res.sendFile(rootDir + '/index.html'));
app.get('/', (req, res) => res.sendFile(rootDir + '/index.html'));
app.get('/*', async (req, res) => {
	try {
		await fs.stat(rootDir + req.path);
		res.sendFile(rootDir + req.path);
	} catch (e) {
		res.sendFile(rootDir + '/index.html');
	}
});

// Begin Testing Area

// End Testing Area

// Initialization function.
(async function() {
	await ledger.init();
	if (authDisabled) {
		console.log('WARNING: ALL AUTHORIZATION CHECKS ARE DISABLED.');
	}
	if (productionMode) {
		// Just bumps the user to HTTPS. Serves no content.
		console.log('Starting in production mode.');
		if (redirectHttp) {
			var redirector = express();
			redirector.get('*', (req, res) => {
				res.redirect('https://' + req.headers.host + req.url);
			});
			redirector.listen(80);
		}
		
		if (forceHttp) {
			console.log('WARNING: Serving over HTTP in production mode! This should only be used in conjunction with an'
					+ 'HTTPS proxy or HTTPS Virtual Hosting server.');
			app.listen(port);
		} else {
			https.createServer({
				key: fs.readFileSync('../private/key.pem'),
				cert: fs.readFileSync('../private/cert.pem')
			}, app).listen(port);	
		}
	} else {
		console.log('Starting in development mode');
		app.listen(port);
	}

	console.log('Initialization complete!');
})();
