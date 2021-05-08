// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <=0.8.4;
import "./CredentialManager.sol";

contract Inventory {

    struct resourceTransaction {
        bytes32 id;
        address initiator;
        address receiver;
        string fromEntity; 
        string toEntity; 
        string entityLevel; 
        uint sentTimestamp; 
        uint receivedTimestamp;
        uint[] resourceQuantities; //array of quantities where index is id of the resource
        bool created;
    }

    mapping(bytes32=>resourceTransaction) public resourceTxns;
    
    event newTxn(
        bytes32 txnId,
        address indexed initiator,
        string indexed fromEntityIndex, //stores keccak256 hash of the string. To filter, filter using hash(key)
        string fromEntity,
        uint fromEntityId,
        string toEntity,
        uint toEntityId,
        string indexed entityLevel,
        uint sentTimestamp,
        uint receivedTimestamp,
        uint[] resources,
        uint statusCode
    );

    event AckTxn(
        bytes32 txnId,
        uint receivedTimestamp,
        address receiver,
        uint statusCode
    );

    event errorAckTxn (
        bytes32 txnId,
        uint receivedTimestamp,
        address receiver,
        uint statusCode
    );
    
    
    function sendTxn(string memory _fromEntity, uint _fromEntityId, string memory _toEntity, uint _toEntityId, string memory _level, uint  _sentTimestamp, uint _receivedTimestamp, uint[] memory _resourceQuantities, address _credManagerAddress) public {
        
        CredentialManager cm = CredentialManager(_credManagerAddress);
        require(bytes(_fromEntity).length>0, "Invalid fromEntity");
        
        bytes32 txnId = keccak256(abi.encode(_fromEntity,_toEntity,_level,_sentTimestamp));        
        string memory fromEntity = _fromEntity; 
        uint fromEntityId = _fromEntityId;
        string memory toEntity = _toEntity;
        uint toEntityId = _toEntityId;
        uint sentTimestamp = _sentTimestamp;
        uint[] memory resourceQuantities = _resourceQuantities;
        uint receivedTimestamp;
        if(keccak256(bytes(_level)) == keccak256(bytes("Distn. Point")))
            receivedTimestamp = _sentTimestamp;
        else    
            receivedTimestamp = _receivedTimestamp;
        
        if(!cm.authorizeSigner(_level, msg.sender, fromEntityId))
            emit newTxn(txnId, msg.sender, fromEntity, fromEntity, fromEntityId, toEntity, toEntityId, _level, sentTimestamp, receivedTimestamp, resourceQuantities, 401);

        else
        {
            resourceTxns[txnId] = resourceTransaction(txnId, msg.sender, address(0), fromEntity, toEntity, _level, sentTimestamp, receivedTimestamp, _resourceQuantities, true);
            emit newTxn(txnId, msg.sender, fromEntity, fromEntity, fromEntityId, toEntity, toEntityId, _level, sentTimestamp, receivedTimestamp, resourceQuantities, 200);
        }
    }
    
    function acknowledgeTxn(bytes32 _txnId, uint _recvdTimestamp, uint _entityId, string memory _level, address _credManagerAddress) public {
        require(_recvdTimestamp>0, "Invalid timestamp");
        if(!resourceTxns[_txnId].created)
            emit errorAckTxn(_txnId, _recvdTimestamp, msg.sender,400);
        else {
            if(resourceTxns[_txnId].receivedTimestamp!=0) 
                emit errorAckTxn(_txnId, _recvdTimestamp, msg.sender, 4010);
            CredentialManager cm = CredentialManager(_credManagerAddress);
            if(!cm.authorizeSigner(_level, msg.sender, _entityId))
                emit errorAckTxn(_txnId, _recvdTimestamp, msg.sender, 4011);
            else
            {
                resourceTransaction storage txn = resourceTxns[_txnId];
                txn.receivedTimestamp = _recvdTimestamp;
                txn.receiver = msg.sender;
                emit AckTxn(_txnId, _recvdTimestamp, msg.sender, 200);
            }
        }             
    }
    
    function getTxnResources(bytes32 _txnId) public view returns(uint[] memory) {
        require(resourceTxns[_txnId].created==true, "Invalid txn id");
        return resourceTxns[_txnId].resourceQuantities;
    }
}