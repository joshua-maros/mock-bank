const changeGuard = require('./changeGuard');
const FileDatabase = require('./fileDatabase').FileDatabase;
const dbs = require('./databases');
const c = require('../common/constants.json');

const ledger = {
    balances: {},
    db: new FileDatabase('../private/ledger.json'),
    _processTransaction: function(transaction) {
        if (transaction.amount <= 0) return false;
        if (this.balances[transaction.from] < transaction.amount) return false;
        this.balances[transaction.from] -= transaction.amount;
        this.balances[transaction.to] += transaction.amount;
        return true;
    },
    performTransaction: async function(from, to, amount, reason) {
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
        this.db.push(transaction);
        return transaction;
    },
    getBalance: function(member) {
        if (typeof(member) !== typeof('')) {
            member = member.id;
        }
        return this.balances[member];
    },
    init: async function() {
        let members = dbs.members.getAllItems();
        let transactions = this.db.getAllItems();
        for (let member of await members) {
            ledger.balances[member.id] = member.startWealth;
        }
        for (let transaction of await transactions) {
            this._processTransaction(transaction);
        }
    }
}

module.exports = ledger;