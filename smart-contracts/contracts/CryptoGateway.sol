// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoGateway{
    address payable public owner;
    event PaymentRecived(address indexed payer, uint256 amount,string orderId,uint256 timestamp);
    constructor(){
        owner = payable (msg.sender);
    }
    function payForOrder(string memory orderId) external payable  {
        require(msg.value > 0 , "amount must be >0");
        emit PaymentRecived(msg.sender, msg.value , orderId, block.timestamp);
    }
    function withdraw () external {
        require (msg.sender == owner , "only owner");
        (bool success, ) = owner.call{value:address(this).balance}("");
        require(success,"transfer failed");

    }
}