
import hre from "hardhat";

async function main() {
  const connection = await hre.network.create(); 
  const { ethers } = connection;

  console.log("Deploying CryptoGateway...");

  const Gateway = await ethers.getContractFactory("CryptoGateway");
  const gateway = await Gateway.deploy();

  await gateway.waitForDeployment();

  const address = await gateway.getAddress();
  console.log(`CryptoGateway deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});