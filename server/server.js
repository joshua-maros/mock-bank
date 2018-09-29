global.productionMode = (process.argv.length >= 3) && (process.argv[2].toLowerCase() == 'prod');

const fs = require('fs');
const https = require('https');
const path = require('path');
const c = require('../common/constants.json');
//Express framework stuff
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');

const dbs = require('./databases');

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
	if (accessLevel == c.access.VISITOR) {
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
	if (item.accessLevel == c.access.LEADER) { // Leaders can access anything, no matter what.
		return member;
	} else if ((item.accessLevel == c.access.MEMBER) && (accessLevel == c.access.MEMBER)) {
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
	const session = validateSession(req);
	const member = await checkLogin(req, res, c.access.MEMBER);
	if (member) {
		const asession = await session;
		res.status(200).send({
			sessionToken: asession.token,
			expires: await asession.getExpirationDate()
		});
	} else {
		res.status(500).send({error: 'Unknown internal error.'});
		throw new Error('Unknown internal error.');
	}
})

app.get('/api/v1/session/login', async (req, res) => {
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
				expires: await session.getExpirationDate()
			});
		} else {
			res.status(401).send({error: 'Incorrect name or PIN.'});
		}
	}
	res.status(401).send({error: 'Incorrect name or PIN.'});
}) 

app.get('/public/*', (req, res) => res.sendFile(rootDir + '/index.html'));
app.get('/private/*', (req, res) => res.sendFile(rootDir + '/index.html'));
app.get('/', (req, res) => res.sendFile(rootDir + '/index.html'));
app.get('/*', (req, res) => res.sendFile(rootDir + req.path));

// Arg 0 is node. Arg 1 is script name. This code will switch how the server runs depending on whether or not arg2 is 'prod' (production mode)
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