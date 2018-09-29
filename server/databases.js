const changeGuard = require('./changeGuard');
const FileDatabase = require('./fileDatabase').FileDatabase;
const c = require('../common/constants.json');

function generateRandomToken() {
	let token = '';
	const CHARS = 'qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM0123456789';
	for (let i = 0; i < 64; i++) {
		token += CHARS.charAt(Math.floor(Math.random() * CHARS.length));
	}
	return token;
}

function generateRandomPIN() {
	// Yeah, it's cryptographically insecure. But this is for 30 people who are clueless about cryptography.
	return Math.random().toString().substr(2, 5); // Random 5-digit PIN with leading zeroes.
}

module.exports.members = new FileDatabase('../private/members.json');
module.exports.members.createMember = function(options) {
	let member = {
		id: generateRandomToken(),
		pin: generateRandomPIN(),
		firstName: null,
		lastName: null,
		ownsDesks: [],
		rentsDesks: [],
		jobs: [],
		startWealth: 0,
		accessLevel: c.access.MEMBER
	};
	for (let key in options) {
		member[key] = options[key];
	}
	this.push(member);
	return changeGuard(member, () => this._markDirty());
}

module.exports.jobs = new FileDatabase('../private/jobs.json');
module.exports.jobs.createJob = function(options) {
	let job = {
		id: generateRandomToken(),
		title: null,
		orangeSalary: 0,
		blueSalary: 0
	};
	for (let key in options) {
		job[key] = options[key];
	}
	this.push(job);
	return changeGuard(job, () => this._markDirty());
}

module.exports.miscConfig = new FileDatabase('../private/miscConfig.json');
module.exports.miscConfig.get = function(key, callback) {
	this.getItem(0, (item) => {
		callback(item[key]);
	})
}
module.exports.miscConfig.set = function(key, value, callback) {
	this.getItem(0, (item) => {
		item[key] = value;
		callback();
	})
}