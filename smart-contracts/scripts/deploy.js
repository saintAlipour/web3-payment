import { network } from "hardhat";

async function main() {
  console.log("Deploying CryptoGateway...");

  // اتصال به شبکه محلی و دریافت ethers
  const { ethers } = await network.connect({
    network: "localhost",
  });

  // deployContract
  const gateway = await ethers.deployContract("CryptoGateway");

  await gateway.waitForDeployment();

  const address = await gateway.getAddress();
  console.log("-----------------------------------------");
  console.log("Contract deployed to:", address);
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});