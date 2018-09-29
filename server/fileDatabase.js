const changeGuard = require('./changeGuard');
const fs = require('fs/promises');

const STALE_INTERVAL = 30 * 1000; // After 30 seconds, reload data from the file
const PUSH_DELAY = 2000; // After 2 seconds of inactivity, save contents to file.

class FileDatabase {
	constructor(fileName) {
		this.fileName = fileName;
		this.cacheOpInProgress = false;
		this.lastCacheGet = 0;
		this.lastCacheChange = 0;
		this.lastCacheFlush = 0;
		this.queuedPush = null;
		this.onCacheOpFinished = null;
		this.finishCacheOp = null;
		this._getFromSource(() => {
			// So that the code will know we have an up-to-date copy.
			this.lastCacheFlush = Date.now();
		});
	}
	
	_startCacheOp() {
		if (this.cacheOpInProgress) {
			return {proceed: false, promise: this.onCacheOpFinished}; // Do not start another one.
		}
		this.cacheOpInProgress = true;
		this.onCacheOpFinished = new Promise((resolve, reject) => {
			this.finishCacheOp = resolve;
		})
		return {proceed: true, promise: this.onCacheOpFinished};
	}
	
	_endCacheOp() {
		this.finishCacheOp();
		this.onCacheOpFinished = null;
		this.finishCacheOp = null;
		this.cacheOpInProgress = false;
	}
	
	async _getFromSource() {
		let a = this._startCacheOp();
		if (!a.proceed) return a.promise;
		this.data = [];
		let status;
		try {
			status = await fs.stat(this.fileName);
		} catch (e) {
			fs.writeFile(this.fileName, '[]', (err, status) => 0);
			this.lastCacheGet = Date.now();
			this._endCacheOp();
			return;
		}
		let data;
		try {
			data = await fs.readFile(this.fileName);
			this.data = JSON.parse(data);
			this.lastCacheGet = Date.now();
			this._endCacheOp();
		} catch (e) {
			this._endCacheOp();
			throw e;
		}
	}
	
	async _flushToSource() {
		let a = this._startCacheOp();
		if (!a.proceed) return a.promise;
		// If there is an error, it will automatically be thrown.
		await fs.writeFile(this.fileName, JSON.stringify(this.data));
		this.lastCacheFlush = Date.now();
		this._endCacheOp();
	}
	
	_queueFlush() {
		if(this.queuedPush) {
			clearTimeout(this.queuedPush);
		}
		this.queuedPush = setTimeout(() => {
			this.queuedPush = null;
			this._flushToSource(() => null);
		}, PUSH_DELAY);
	}
	
	async _checkStaleness() { // If we haven't made local changes yet, but the local copy is old, update it.
		if (Date.now() > this.lastCacheGet + STALE_INTERVAL) {
			// If the cache was modified after last updating the source
			if(this.lastCacheChange > this.lastCacheFlush) {
				// Local copy is old, but changes are in progress.
				// Later, flushChanges() should be called to update the source.
				console.warn('Local cache of database file ' + this.fileName + ' is ' + (Date.now() - this.lastCacheGet) + 'ms old but still has unflushed changes!');
				return;
			} else {
				// Grab a more recent copy
				return this._getFromSource();
			}
		}
	}
	
	_markDirty() {
		this.lastCacheChange = Date.now();
		this._queueFlush();		
	}
	
	async getAllItems() {
		await this._checkStaleness();
		let result = [];
		for (let item of this.data) {
			// Make everything proxied so that changes will trigger cache update.
			result.push(changeGuard(item, () => this._markDirty())); 
		}
		return result;
	}

	async getItems(startIndex, stopIndex) {
		await this._checkStaleness();
		let result = [];
		for (let item of this.data.slice(startIndex, stopIndex)) {
			// Make everything proxied so that changes will trigger cache update.
			result.push(changeGuard(item, () => this._markDirty())); 
		}
		return result;
	}

	async getItem(index) {
		await this._checkStaleness();
		// Make everything proxied so that changes will trigger cache update.
		return changeGuard(this.data[index], () => this._markDirty()); 
	}

	async get(index, key) {
		await this._checkStaleness();
		return this.data[index][key];
	}

	async getAllValues(key) {
		await this._checkStaleness();
		let values = [];
		for (let item of this.data) {
			values.push(changeGuard(item[key], () => this._markDirty()));
		}
		return values;
	}

	async getSize() {
		await this._checkStaleness();
		return this.data.length;
	}

	async findItemWithValue(key, value) {
		await this._checkStaleness();
		for (let item of this.data) {
			if(item[key] === value) {
				// Make everything proxied so that changes will trigger cache update.
				return changeGuard(item, () => this._markDirty());
			}
		}
		return undefined;
	}

	async setItems(startIndex, items) {
		await this._checkStaleness();
		for (let i = 0; i < items.length; i++) {
			this.data[i + startIndex] = items[i];
		}
		this._markDirty();
	}

	async setItem(index, item) {
		await this._checkStaleness();
		this.data[index] = item;
		this._markDirty();
	}

	async set(index, key, value) {
		await this._checkStaleness();
		this.data[index][key] = value;
		this._markDirty();
	}

	async push(item) {
		await this._checkStaleness();
		this.data.push(item);
		this._markDirty();
	}
}

module.exports.FileDatabase = FileDatabase;
