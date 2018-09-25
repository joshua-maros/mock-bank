global.productionMode = (process.argv.length >= 3) && (process.argv[2].toLowerCase() == 'prod');

const fs = require('fs');
const https = require('https');
const path = require('path');
const c = require('../common/constants.json');
//Express framework stuff
const bodyParser = require('body-parser');
const compression = require('compression');
const express = require('express');

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
function validateSession(req, callback) {
	const authorization = req.get('authorization') || req.query.sessionToken;
	if (!authorization) {
		callback(undefined);
		return;
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
		callback(sessionStorage.getSessionByToken(token));
	} else {
		callback(null);
	}
}

// Returns a promise that will pass a member to then() if the access level required is greater than ACCESS_LEVEL_VISITOR
// Errors are automatically handled.
function checkLogin(req, res, accessLevel) {
    return new Promise((resolve, reject) => {
        if (accessLevel == c.access.VISITOR) {
            resolve()
            return;
        }
        validateSession(req, (session) => {
            if (!session || !session.memberId) {
                res.status(401).send({error: 'A valid session token representing a session with an associated logged in user must be sent in the Authorization header. Either the token was not present, or the session associated with the token does not represent a logged in user.'});
                return;			
            }
            dbs.members.findItemWithValue('id', session.memberId, (item) => {
                if (item.accessLevel == c.access.LEADER) { // Leaders can access anything, no matter what.
                    resolve(item);
                } else if ((item.accessLevel == c.access.MEMBER) && (accessLevel == c.access.MEMBER)) {
                    // Members can access member-level and below stuff. (Below stuff handled earlier.)
                    resolve(item);
                } else {
                    res.status(403).send({error: 'This action requires the current user to be a leader.'});
                }
            });
        });
    });
}

function getAuthHost(req) {
	return `http${productionMode ? 's' : ''}://${req.headers.host}`;
}

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