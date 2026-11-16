import { expect } from "chai";
import { ethers } from "hardhat";

describe("CryptoGateway Contract Tests", function () {
  let cryptoGateway;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();
    const CryptoGateway = await ethers.getContractFactory("CryptoGateway");
    cryptoGateway = await CryptoGateway.deploy();
  });

  it("Should accept payment", async function () {
    const amount = ethers.parseEther("1.0"); 
    const orderId = "ORDER-123";

    await expect(cryptoGateway.connect(addr1).payWithNativeToken(orderId, { value: amount }))
      .to.emit(cryptoGateway, "PaymentReceived");

    const contractBalance = await ethers.provider.getBalance(await cryptoGateway.getAddress());
    expect(contractBalance).to.equal(amount);
  });

  it("Should allow owner to withdraw", async function () {
    const amount = ethers.parseEther("1.0");
    await cryptoGateway.connect(addr1).payWithNativeToken("ORDER-123", { value: amount });

    await expect(cryptoGateway.connect(owner).withdrawNative())
      .to.changeEtherBalances([owner, cryptoGateway], [amount, -amount]);
  });

  it("Should reject withdraw from non-owner", async function () {
    const amount = ethers.parseEther("1.0");
    await cryptoGateway.connect(addr1).payWithNativeToken("ORDER-123", { value: amount });

    await expect(cryptoGateway.connect(addr1).withdrawNative())
      .to.be.revertedWith("only owner");
  });
});