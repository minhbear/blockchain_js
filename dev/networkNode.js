var express = require('express');
var app = express();
const Blockchain = require('./blockchain');
//for get unique miner
var uuid = require('uuid');
var uuidv1 = uuid.v1;
const port = process.argv[2];
const rp = require('request-promise');

const nodeAddress = uuidv1().split('-').join('');

const bitcoin = new Blockchain();

//form data when to send
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/blockchain', (req, res) => {
    res.send(bitcoin);
});

app.post('/transaction', (req, res) => {
    const newTransaction = req.body;
    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({ note: `Transaction will be added in block ${blockIndex}` });
});

app.post('/transaction/broadcast', function (req, res) {
    const newTransaction = bitcoin.createNewTransaction(req.body.amount, req.body.sender, req.body.recipient);
    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            url: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        }
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ note: "Transaction create and broadcast successfully" });
        })
});

app.get('/mine', (req, res) => {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock.hash;
    const currentBlockData = {
        transaction: bitcoin.pendingTransactions,
        index: lastBlock.index + 1,
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);

    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, blockHash);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOption = {
            url: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        }

        requestPromises.push(rp(requestOption));
    })

    Promise.all(requestPromises)
        .then(data => {
            const requestOption = {
                url: bitcoin.currnetNodeUrl + '/transaction/broadcast',
                method: 'POST',
                body: {
                    //reward for mining
                    //00 (signature to know this is - the sender give reward)
                    amount: 19,
                    sender: "00",
                    recipient: nodeAddress
                },
                json: true
            }
            return rp(requestOption)
        })
        .then(data => {
            res.json({
                note: "New block mined & broadcast successfully",
                block: newBlock
            })
        })
});

app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock.index + 1 === newBlock.index;

    if (correctHash && correctIndex) {
        bitcoin.chain.push(newBlock);
        bitcoin.pendingTransactions = [];

        res.json({
            note: "New block received and accepted",
            newBlock: newBlock
        })
    }else{
        res.json({ 
            note: "New block rejected",
            newBlock: newBlock
         })
    }
});

//register a node and broadcats it the network
app.post('/register-and-broadcast-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1)
        bitcoin.networkNodes.push(newNodeUrl);

    const registerNodesPromises = [];

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        //register node
        const requrestOptions = {
            url: networkNodeUrl + '/register-node',
            method: 'POST',
            body: { newNodeUrl: newNodeUrl },
            json: true
        };

        registerNodesPromises.push(rp(requrestOptions));
    });

    Promise.all(registerNodesPromises)
        .then(data => {
            const bulkRegisterOptions = {
                url: newNodeUrl + '/register-nodes-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currnetNodeUrl] },
                json: true
            }

            return rp(bulkRegisterOptions);
        })
        .then(data => {
            res.json({ note: "New node register with network successfully." })
        })
});

//register a node with a network
app.post('/register-node', (req, res) => {
    const newNodeUrl = req.body.newNodeUrl;
    const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    const notCurrentNode = bitcoin.currnetNodeUrl !== newNodeUrl;
    if (nodeNotAlreadyPresent && notCurrentNode) {
        bitcoin.networkNodes.push(newNodeUrl);
    }
    res.json({ note: 'New Node register successfully with node.' });
});

//register multiple nodes at once
app.post('/register-nodes-bulk', (req, res) => {
    const allNetworkNodes = req.body.allNetworkNodes;
    allNetworkNodes.forEach(networkNodeUrl => {
        const nodeNotAlreadyPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        const notCurrentNode = bitcoin.currnetNodeUrl !== networkNodeUrl;
        if (nodeNotAlreadyPresent && notCurrentNode)
            bitcoin.networkNodes.push(networkNodeUrl);
    });

    res.json({ note: "Bulk registration successfull" });
});

//consensus
app.get('/consensus', (req, res) => {
    const requestPromises = []

    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            'url': networkNodeUrl + '/blockchain',
            method: 'GET',
            json: true
        }
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(blockchains => {
            const currentChainLength = bitcoin.chain.length;
            let maxChainLength = currentChainLength;
            let newLongestChain = null;
            let newPendingTransactions = null;
            blockchains.forEach(blockchain => {
                if(blockchain.chain.length > maxChainLength){
                    maxChainLength = blockchain.chain.length;
                    newLongestChain = blockchain.chain;
                    newPendingTransactions = blockchain.pendingTransactions;
                }
            })

            if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
                res.json({
                    note: 'current chain has not been replaced',
                    chain: bitcoin.chain
                })
            }else if( newLongestChain && bitcoin.chainIsValid(newLongestChain)){
                bitcoin.chain = newLongestChain;
                bitcoin.pendingTransactions = newPendingTransactions;
                res.json({
                    note: "This chain has been replaced",
                    chain: bitcoin.chain
                })
            }
        })
})

app.get('/block/:blockHash', function(req, res){
    //localhost:3001/block/blockhash
    const {blockHash} = req.params;
    const correctBlock = bitcoin.getBlock(blockHash);
    res.json({ 
        block: correctBlock
     })
});

app.get('/transaction/:transactionId', function(req, res) {
    const {transactionId} = req.params;
    const transactionData = bitcoin.getTransaction(transactionId);
    res.json({
        transaction: transactionData.transaction,
        block: transactionData.block
    })
});

app.get('/address/:address', function(req, res) {
    const {address} = req.params;
    const addressData = bitcoin.getAddressData(address);
    res.json({
        addressData: addressData
    });
});

app.get('/block-explore', function(req, res) {
    res.sendFile('./block-explore/index.html', {root: __dirname})
})

app.listen(port, () => {
    console.log(`Listening on port ${port}...`);
});
