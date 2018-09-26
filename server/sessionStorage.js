const memberDatabase = require('./databases').members;
const c = require('../common/constants.json');

var sessions = [];

function generateRandomToken() {
	let token = '';
	const CHARS = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789';
	for (let i = 0; i < 64; i++) {
		token += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return token;
}

module.exports.createNewSession = function() {
	let session = {
		token: generateRandomToken(),
		memberId: null,
		started: Date.now(),
		lastRefresh: Date.now(),
		getAccessLevel: async function() {
			const member = await memberDatabase.findItemWithValue('id', this.memberId);
			return (member) ? member.level : c.access.VISITOR;
		},
	};
	sessions.push(session);
	return session;
}

if (!productionMode) {
	module.exports.createNewSession();
	ts = sessions[sessions.length - 1];
	ts.token = 'abc123def420';
	ts.memberId = 'OsISBaYSPgBT7fdvBQYCypXocBt2QgpGTdK6CQ1mNihO47jXElhG6Wcvj6gHLiQ1';
}

module.exports.getSessionByToken = function(token) {
	for (let session of sessions) {
		if (session.token === token) {
			return session;
		}
	}
	return undefined;
}

module.exports.sessionExists = function(token) {
	for (let session of sessions) {
		if (session.token === token) {
			return true;
		}
	}
	return false;
}

module.exports.storeDataInSession = function(sessionToken, key, data) {
	module.exports.getSessionByToken(sessionToken)[key] = data;
}

module.exports.retrieveDataFromSession = function(sessionToken, key) {
	return module.exports.getSessionByToken(sessionToken)[key];
}