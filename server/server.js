// Arg 0 is node. Arg 1 is script name. This code will switch how the server runs depending on whether or not arg2 is 
// 'prod' (production mode)
global.productionMode = process.argv.length >= 3 && process.argv[2].toLowerCase() == 'prod';
// Arg 2 can also be 'noauth' (dev mode and disable all authentication)
global.authDisabled= process.argv.length >= 3 && process.argv[2].toLowerCase() == 'noauth';

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
	} else if (req.body.class = 'orange') {
		amount = c.ORANGE_START;
	}
	if (amount) {
		ledger.createTransaction(c.BANK_ID, newMember, amount, 'Starting balance');
	}
	res.status(201).send(censorMember(newMember, true));
});

app.patch('/api/v1/members/:id', async (req, res) => {
	const loggedInMember = await checkLogin(req, res, c.access.MEMBER);
	const memberOkay = Object.keys(req.body)[0] === 'pin' && Object.keys(req.body).size === 1 
		|| loggedInMember.id === req.params.id;
	if (loggedInMember.accessLevel === c.access.MEMBER && !memberOkay) {
		res.status(403).send({error: 'This action requires the logged in user to be a leader.'});
		return;
	}
	const existingMember = await dbs.members.findItemWithValue('id', req.params.id);
	for (const key of ['firstName', 'lastName', 'class', 'ownsDesks', 'rentsDesks', 'jobs']) {
		if (req.body[key]) {
			existingMember[key] = req.body[key];
		}
	}
	res.status(200).send(existingMember);
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
	const loggedInMember = await checkLogin(req, res, c.access.LEADER);
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
		var redirector = express();
		redirector.get('*', (req, res) => {
			res.redirect('https://' + req.headers.host + req.url);
		});
		redirector.listen(80);

		https.createServer({
			key: fs.readFileSync('../private/key.pem'),
			cert: fs.readFileSync('../private/cert.pem')
		}, app).listen(443);	
	} else {
		console.log('Starting in development mode');
		app.listen(4200);
	}

	console.log('Initialization complete!');
})();
