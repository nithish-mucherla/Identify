// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.5.0 <=0.8.4; 

contract CredentialManager {
    constructor() {
        string[28] memory statesList=['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', "Uttar Pradesh", "Uttarakhand", "West Bengal"];
        
        uint i=0;
        for(i=0;i<28;i++)
        addState(statesList[i]);  

        string[4] memory distList = ["d1","d2","d3","d4"];
        for(i=0;i<4;i++)
        addDistrict(distList[i], 1);

        string[4] memory distPoint = ["dp-1","dp-2","dp-3","dp-4"];
        for(i=0;i<4;i++)
        addDstnPoint(distPoint[i],(i+1));
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
        bool isRegistered;
    }
    
    string private secret = "identify@capstone";
    address public centralAuthId = 0xf17f52151EbEF6C7334FAD080c5704D77216b732;
    mapping(uint=>Beneficiary) public beneficiaries;
    uint public beneficiaryCount;
    DistributionPoint[] public dstnPoints;
    District[] public districts;
    State[] public states;
    
    event NewState(uint _id, string _name);
    event NewDistrict(uint _id, string _name,uint _stateId);
    event NewDstnPoint(uint _id, string _name, uint _districtId);
    event NewAuthority(uint _level, uint _entityId, address _authorityId);
    event NewBeneficiary(uint _id, string _credentials, address _registeredBy, uint _dstnId, uint _statusCode);
    
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
    
    function addBeneficiary(uint _id, string memory _credentials, uint _dstnId, bytes32 _token) public{
        if(authorizeSigner("Distn. Point", msg.sender, _dstnId))
        {
            if(beneficiaries[_id].isRegistered)
                emit NewBeneficiary(_id, _credentials, msg.sender, _dstnId, 409); //Beneficiary already registered
            else {
                
                if(keccak256(abi.encodePacked(_id,_dstnId,_credentials,secret)) == _token)
                {
                    dstnPoints[_dstnId-1].beneficiaryIds.push(_id);
                    beneficiaries[_id] = Beneficiary(_id, _dstnId, _credentials, true);
                    beneficiaryCount+=1;
                    emit NewBeneficiary(_id, _credentials, msg.sender, _dstnId, 200); //200 succesfully added
                }
                else
                    emit NewBeneficiary(_id, _credentials, msg.sender, _dstnId, 403); // 403 :  Forbidden action as tokens mismatch 
            }
        }
        else
            emit NewBeneficiary(_id, _credentials, msg.sender, _dstnId, 401);  //401 authority not authorized to add Beneficiary
    }
    
    
    function getBeneficiaries(uint _dstnPointId) public view returns(uint[] memory) {
        if(beneficiaryCount<=0)
        return new uint[](0);
        require(_dstnPointId>=0 && _dstnPointId<dstnPoints.length, "Invalid DistributionPoint id");
        return dstnPoints[_dstnPointId-1].beneficiaryIds;
        //returns beneficiary Ids of a dstn point
    }
    
    function addAuthority(uint _level, uint _entityId, address _authorityId) public{
        require(_level>0 && _level<4, "invalid level");
        if(_level==1)
        states[_entityId-1].authorities[_authorityId] = true;
        else if(_level==2)
        districts[_entityId-1].authorities[_authorityId] = true;
        else if(_level==3)
        dstnPoints[_entityId-1].authorities[_authorityId] = true;
        emit NewAuthority(_level, _entityId, _authorityId);
    }

    function authorizeSigner(string memory _type, address _signer, uint _entityId) public view returns(bool){
        
        bool isAuthorized;

        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("Central")))
        isAuthorized = centralAuthId == _signer;
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("State")))
        isAuthorized = states[_entityId-1].authorities[_signer];
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("District")))
        isAuthorized = districts[_entityId-1].authorities[_signer];
        
        if(keccak256(abi.encode(_type)) == keccak256(abi.encode("Distn. Point")))
        isAuthorized = dstnPoints[_entityId-1].authorities[_signer];
       
        return isAuthorized;
        
    }
}