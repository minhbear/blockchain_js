const sha256 = require('sha256');
const currnetNodeUrl = process.argv[3];
var uuid = require('uuid');
var uuidv1 = uuid.v1;

function Blockchain() {
    this.chain = [];
    this.pendingTransactions = [];

    this.currnetNodeUrl = currnetNodeUrl;
    this.networkNodes = [];
    //build genesish block in blockchain
    this.createNewBlock(1904, '0', '0');
}

Blockchain.prototype.createNewBlock = function (nonce, previousBlockHash, hash) {
    const newBlock = {
        index: this.chain.length + 1,
        timestamp: Date.now(),
        transactions: this.pendingTransactions,
        nonce: nonce,
        hash: hash,
        previousBlockHash: previousBlockHash
    };

    this.pendingTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
}

Blockchain.prototype.getLastBlock = function () {
    return this.chain[this.chain.length - 1];
}

//create new transaction
Blockchain.prototype.createNewTransaction = function (amount, sender, recipient) {
    const newTransaction = {
        amount: amount,
        sender: sender,
        recipient: recipient,
        transactionId: uuidv1().split('-').join('')
    };

    return newTransaction
}

Blockchain.prototype.addTransactionToPendingTransactions = function (transactionObj) {
    this.pendingTransactions.push(transactionObj);

    return this.getLastBlock().index + 1;
}

Blockchain.prototype.hashBlock = function (previousBlockHash, currentBlockData, nonce) {
    const dataAsString = previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = sha256(dataAsString);
    return hash;
}

//proof of Work 
Blockchain.prototype.proofOfWork = function (previousBlockHash, currentBlockData) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== '0000') {
        nonce++;
        hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }
    return nonce;
}

Blockchain.prototype.chainIsValid = function (blockchain) {
    let validChain = true;

    for (let i = 1; i < blockchain.length; i++) {

        const currentBlock = blockchain[i];
        const preBlock = blockchain[i - 1];
        const blockHash = this.hashBlock(preBlock.hash, { "transaction": currentBlock.transactions, "index": currentBlock.index }, currentBlock.nonce);
        if (blockHash.substring(0, 4) !== '0000') validChain = false;
 
        if (currentBlock.previousBlockHash !== preBlock.hash) {
            //chain not valid
            validChain = false;
        }
    }
    const genesishBlock = blockchain[0];
    const correctNonce = genesishBlock["nonce"] === 1904;
    const correctPreBlock = genesishBlock.previousBlockHash === '0';
    const correctHash = genesishBlock.hash === '0';
    const correctTransactions = genesishBlock['transactions'].length === 0

    if(!correctNonce || !correctHash || !correctPreBlock || !correctTransactions) validChain = false;

    return validChain;
}

Blockchain.prototype.getBlock = function(blockHash) {
    let correctBlock = null;
    this.chain.forEach(block => {
        if(block.hash === blockHash){
            correctBlock = block;
        }
    });

    return correctBlock;
}

Blockchain.prototype.getTransaction = function(transactionId) {
    let correctTransaction = null;
    let correctBlock = null;
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.transactionId === transactionId) {
                correctTransaction = transaction
                correctBlock = block;
            }
        })
    });

    return {
        transaction: correctTransaction,
        block: correctBlock
    }
}

Blockchain.prototype.getAddressData = function(address) {
    const addressTransaction = [];
    this.chain.forEach(block => {
        block.transactions.forEach(transaction => {
            if(transaction.sender === address || transaction.recipient === address){
                addressTransaction.push(transaction);
            }
        })
    });

    let balance = 0;
    addressTransaction.forEach(transaction => {
        if(transaction.recipient === address){
            balance += transaction.amount;
        }else if(transaction.sender === address){
            balance -= transaction.amount;
        }
    });

    return {
        addressTransaction: addressTransaction,
        addressBalance: balance
    };
}

module.exports = Blockchain;