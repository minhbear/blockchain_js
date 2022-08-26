const Blockchain = require('./blockchain');
const bitcoin = new Blockchain();

const bc1 = [
    {
        "index": 1,
        "timestamp": 1660226436849,
        "transactions": [],
        "nonce": 1904,
        "hash": "0",
        "previousBlockHash": "0"
    },
    {
        "index": 2,
        "timestamp": 1660226595293,
        "transactions": [],
        "nonce": 16441,
        "hash": "00009b2ef664890dbcd795344f8145bac1710db47cea457183f41c9ca24c3285",
        "previousBlockHash": "0"
    },
    {
        "index": 3,
        "timestamp": 1660226597928,
        "transactions": [
            {
                "amount": 19,
                "sender": "00",
                "recipient": "f9a7e610197d11edb17697649a5d41f6",
                "transactionId": "581cf5a0197e11edb17697649a5d41f6"
            }
        ],
        "nonce": 46934,
        "hash": "000060f13d03ed72e809a9d2bb02aedf7844f466918f60b987b3761f10e879ca",
        "previousBlockHash": "00009b2ef664890dbcd795344f8145bac1710db47cea457183f41c9ca24c3285"
    },
    {
        "index": 4,
        "timestamp": 1660226598719,
        "transactions": [
            {
                "amount": 19,
                "sender": "00",
                "recipient": "f9a7e610197d11edb17697649a5d41f6",
                "transactionId": "59ab0fb0197e11edb17697649a5d41f6"
            }
        ],
        "nonce": 2849,
        "hash": "000031ca789973b19c7bfb5f5144be521dac72451a3dcfa7367a110fae6e95c3",
        "previousBlockHash": "000060f13d03ed72e809a9d2bb02aedf7844f466918f60b987b3761f10e879ca"
    },
    {
        "index": 5,
        "timestamp": 1660226599714,
        "transactions": [
            {
                "amount": 19,
                "sender": "00",
                "recipient": "f9a7e610197d11edb17697649a5d41f6",
                "transactionId": "5a23e930197e11edb17697649a5d41f6"
            }
        ],
        "nonce": 6276,
        "hash": "00003c6954b6a823a8e36b17a5e00ab2190fbe357eb353a51869ad12ed153ead",
        "previousBlockHash": "000031ca789973b19c7bfb5f5144be521dac72451a3dcfa7367a110fae6e95c3"
    },
    {
        "index": 6,
        "timestamp": 1660226600755,
        "transactions": [
            {
                "amount": 19,
                "sender": "00",
                "recipient": "f9a7e610197d11edb17697649a5d41f6",
                "transactionId": "5abb6e40197e11edb17697649a5d41f6"
            }
        ],
        "nonce": 94316,
        "hash": "0000a6455f09b0af6f735ad192aacce21255f9ec239e5e91da1eedd5247e8b20",
        "previousBlockHash": "00003c6954b6a823a8e36b17a5e00ab2190fbe357eb353a51869ad12ed153ead"
    }
]

console.log(bitcoin.chainIsValid(bc1));