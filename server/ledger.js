const changeGuard = require('./changeGuard');
const FileDatabase = require('./fileDatabase').FileDatabase;
const dbs = require('./databases');
const c = require('../common/constants.json');

const ledger = {
    balances: {},
    db: new FileDatabase('../private/' + global.privateSubdir + 'ledger.json'),
    _processTransaction: function(transaction) {
        if (transaction.amount <= 0) return false;
        if (this.balances[transaction.from] < transaction.amount) return false;
        if (transaction.from !== c.BANK_ID) this.balances[transaction.from] -= transaction.amount;
        if (transaction.to !== c.BANK_ID) {
            if (!this.balances[transaction.to]) {
                this.balances[transaction.to] = 0; // In case the user was recently created.
            }
            this.balances[transaction.to] += transaction.amount;
        }
        return true;
    },
    createTransaction: async function(from, to, amount, reason) {
        if (amount < 0) {
            throw new Error(`Transactions cannot transfer negative amounts of money.\nFrom: ${from}\nTo: ${to}`
                + `\nAmount: ${amount}`);
        }
        if (typeof(from) !== typeof('')) {
            from = from.id;
        }
        if (typeof(to) !== typeof('')) {
            to = to.id;
        }
        const transaction = {
            from: from,
            to: to,
            amount: amount,
            reason: reason
        };
        if (!this._processTransaction(transaction)) {
            throw new Error(`The transaction cannot be processed.\nFrom: ${from}\nTo: ${to}\nAmount: ${amount}`);
        }
        await this.db.push(transaction);
        return transaction;
    },
    getBalance: function(member) {
        if (typeof(member) !== typeof('')) {
            member = member.id;
        }
        return this.balances[member];
    },
    getTransactionHistory: async function() {
        return this.db.getAllItems();
    },
    init: async function() {
        let members = dbs.members.getAllItems();
        let transactions = this.db.getAllItems();
        for (let member of await members) {
            ledger.balances[member.id] = 0;
        }
        for (let transaction of await transactions) {
            this._processTransaction(transaction);
        }
    }
}

module.exports = ledger;