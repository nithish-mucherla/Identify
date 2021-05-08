var Inventories = artifacts.require("./Inventory");
var Resources = artifacts.require("./Resources");
var CredManager = artifacts.require("./CredentialManager");

module.exports = function (deployer) {
  deployer.deploy(Inventories);
  deployer.deploy(Resources, { overwrite: false });
  deployer.deploy(CredManager, { overwrite: false });
};
