// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.5.0 <=0.8.4;
import "./CredentialManager.sol";

contract Inventory {

    struct resourceTransaction {
        bytes32 id;
        string initiator;
        string receiver;
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
        string initiator,
        string indexed initiatorIndex,
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
        string receiver,
        uint statusCode
    );

    event errorAckTxn (
        bytes32 txnId,
        uint receivedTimestamp,
        string receiver,
        uint statusCode
    );
    
    struct TempTxn {
        bytes32 txnId;
        string initiator;
        string fromEntity;
        uint fromEntityId;
        string toEntity;
        uint toEntityId;
        string level;
        uint sentTimestamp;
        uint[] resourceQuantities;
        uint receivedTimestamp;
        string password;
    }
    
    function sendTxn(
        string memory _initiator, 
        string memory _password, 
        string memory _fromEntity,
        uint _fromEntityId, 
        string memory _toEntity, 
        uint _toEntityId, 
        string memory _level,
        uint  _sentTimestamp, 
        uint _receivedTimestamp, 
        uint[] memory _resourceQuantities, 
        address _credManagerAddress
    ) public {
        
        CredentialManager cm = CredentialManager(_credManagerAddress);
        require(bytes(_fromEntity).length>0, "Invalid fromEntity");
        
        TempTxn memory tempTxn = TempTxn(
            keccak256(abi.encode(_fromEntity,_toEntity,_level,_sentTimestamp)), 
            _initiator,
            _fromEntity,
            _fromEntityId,
            _toEntity,
            _toEntityId,
            _level,
            _sentTimestamp,
            _resourceQuantities,
            _receivedTimestamp,
            _password
        );
        
        uint receivedTimestamp;
        bool isAuthorized;
        if(keccak256(bytes(_level)) == keccak256(bytes("Distn. Point"))) 
        {
            receivedTimestamp = tempTxn.sentTimestamp;
            isAuthorized = cm.authorizeSigner(tempTxn.level, tempTxn.initiator, tempTxn.fromEntityId, tempTxn.password);
        }
        else
        {
            receivedTimestamp = tempTxn.receivedTimestamp;
            isAuthorized = cm.authorizeSigner(tempTxn.level, tempTxn.initiator, tempTxn.fromEntityId);
        }
        
        uint statusCode;
        
        if(!isAuthorized)
        {
            statusCode=401;
        }
        else {
            resourceTxns[tempTxn.txnId] = resourceTransaction(
                tempTxn.txnId, 
                tempTxn.initiator, 
                '', 
                tempTxn.fromEntity, 
                tempTxn.toEntity, 
                tempTxn.level, 
                tempTxn.sentTimestamp, 
                receivedTimestamp, 
                tempTxn.resourceQuantities, 
                true
            );
            statusCode = 200;
        }
        
        emit newTxn(
            tempTxn.txnId, 
            tempTxn.initiator, 
            tempTxn.initiator, 
            tempTxn.fromEntity, 
            tempTxn.fromEntity, 
            tempTxn.fromEntityId, 
            tempTxn.toEntity, 
            tempTxn.toEntityId, 
            tempTxn.level, 
            tempTxn.sentTimestamp, 
            receivedTimestamp, 
            tempTxn.resourceQuantities,
            statusCode
        );
    }
    
    function acknowledgeTxn(
        string memory _reciever, 
        bytes32 _txnId, 
        uint _recvdTimestamp, 
        uint _entityId, 
        string memory _level, 
        address _credManagerAddress
    ) public {
        require(_recvdTimestamp>0, "Invalid timestamp");
        if(!resourceTxns[_txnId].created)
            emit errorAckTxn(_txnId, _recvdTimestamp, _reciever,400);
        else {
            if(resourceTxns[_txnId].receivedTimestamp!=0) 
                emit errorAckTxn(_txnId, _recvdTimestamp, _reciever, 4010);
            CredentialManager cm = CredentialManager(_credManagerAddress);
            if(!cm.authorizeSigner(_level, _reciever, _entityId))
                emit errorAckTxn(_txnId, _recvdTimestamp, _reciever, 4011);
            else
            {
                resourceTransaction storage txn = resourceTxns[_txnId];
                txn.receivedTimestamp = _recvdTimestamp;
                txn.receiver = _reciever;
                emit AckTxn(_txnId, _recvdTimestamp, _reciever, 200);
            }
        }             
    }
    
    function getTxnResources(bytes32 _txnId) public view returns(uint[] memory) {
        require(resourceTxns[_txnId].created==true, "Invalid txn id");
        return resourceTxns[_txnId].resourceQuantities;
    }
}