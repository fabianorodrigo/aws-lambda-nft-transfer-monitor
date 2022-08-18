const ethers = require("ethers");
const getABI = require("./getABI");

module.exports = function getContract() {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ETH_PROVIDER
  );
  const signer = provider.getSigner(0);
  const contractAddress = process.env.CONTRACT_ADDRESS;
  const abi = getABI();
  const contract = new ethers.Contract(contractAddress, abi, signer);
  return contract;
};
