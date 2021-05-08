// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <=0.8.4; 

contract CredentialManager {
    constructor() {
        string[28] memory statesList=['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', "Uttar Pradesh", "Uttarakhand", "West Bengal"];
        
        uint i=0;
        for(i=0;i<28;i++)
        addState(statesList[i]);  
    }
    
    struct State {
        uint id;
        mapping(address=>bool) authorities;
        string name;
    }
    
    struct District {
        uint id;
        uint stateId;
        mapping(address=>bool) authorities;
        string name;
    }
    
    struct DistributionPoint {
        uint id;
        uint districtId;
        uint[] beneficiaryIds;
        mapping(address=>bool) authorities;
        string name;
    }
    
    struct Beneficiary {
        uint id;
        uint dstnId;
        string credentials;
    }
    
    address public centralAuthId = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    Beneficiary[] public beneficiaries;
    DistributionPoint[] public dstnPoints;
    District[] public districts;
    State[] public states;
    
    event NewState(uint _id, string _name);
    event NewDistrict(uint _id, string _name,uint _stateId);
    event NewDstnPoint(uint _id, string _name, uint _districtId);
    event NewAuthority(uint _level, uint _entityId, address _authorityId);
    event NewBeneficiary(uint _id, string _credentials, address _registeredBy, uint _dstnId);
    
    function addState(string memory _name) public{
        states.push();
        State storage s = states[states.length-1];
        s.id = states.length;
        s.name = _name;
        emit NewState(s.id, _name);
    }
    
    function addDistrict(string memory _districtName, uint _stateId) public {
        districts.push();   
        District storage d = districts[districts.length-1];
        d.id = districts.length;
        d.name = _districtName;
        d.stateId=_stateId;
        emit NewDistrict(d.id,_districtName, _stateId);
    }
    
    function addDstnPoint(string memory _dstnPointName, uint _districtId) public {
        dstnPoints.push();
        DistributionPoint storage dp = dstnPoints[dstnPoints.length-1];
        dp.id=dstnPoints.length;
        dp.name = _dstnPointName;
        dp.districtId = _districtId;
        emit NewDstnPoint(dp.id, _dstnPointName, _districtId);
    }
    
    function addBeneficiary(uint _id, string memory _credentials, uint _dstnId) public{
        dstnPoints[_dstnId].beneficiaryIds.push(_id);
        beneficiaries.push(Beneficiary(_id, _dstnId, _credentials));
        emit NewBeneficiary(_id, _credentials, msg.sender, _dstnId);
    }
    
    
    function getBeneficiaries(uint _dstnPointId) public view returns(uint[] memory) {
        require(beneficiaries.length>0, "No Beneficiary registered");
        require(_dstnPointId>=0 && _dstnPointId<dstnPoints.length, "Invalid DistributionPoint id");
        return dstnPoints[_dstnPointId].beneficiaryIds;
        //returns beneficiary Ids of a dstn point
    }
    
    function getBeneficiaryList() public view returns(Beneficiary[] memory) {
        return beneficiaries;
    }
    
    function addAuthority(uint _level, uint _entityId, address _authority) public{
        require(_level>0 && _level<4, "invalid level");
        if(_level==1)
        states[_entityId].authorities[_authority] = true;
        else if(_level==2)
        districts[_entityId].authorities[_authority] = true;
        else if(_level==3)
        dstnPoints[_entityId].authorities[_authority] = true;
        emit NewAuthority(_level, _entityId, _authority);
    }
    
    function authorizeSigner(string memory _type, address _signer, uint _entityId) public view returns(bool){
        
        bool isAuthorized;

        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("Central")))
        isAuthorized = centralAuthId == _signer;
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("State")))
        isAuthorized = states[_entityId].authorities[_signer];
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("District")))
        isAuthorized = districts[_entityId].authorities[_signer];
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("Distn. Point")))
        isAuthorized = dstnPoints[_entityId].authorities[_signer];
       
        return isAuthorized;
        
    }
}