// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoGateway {
    //تعریف مالک (فقط این آدرس اجازه برداشت داره)
    address payable public owner;

    //تعریف رسید (Event) برای ثبت پرداخت‌ها
    event PaymentReceived(address indexed payer, uint256 amount, string orderId, uint256 timestamp);

    //سازنده: موقع آپلود قرارداد، آدرس دیپلوی‌کننده میشه مالک
    constructor() {
        owner = payable(msg.sender);
    }

    //تابع پرداخت: کاربر میاد و پول (ETH) می‌فرسته
    function payWithNativeToken(string memory orderId) external payable {
        require(msg.value > 0, "Amount must be > 0"); // چک میکنیم مبلغ صفر نباشه
        
        // ثبت رسید پرداخت
        emit PaymentReceived(msg.sender, msg.value, orderId, block.timestamp);
    }

    //تابع برداشت: فقط مالک می‌تونه موجودی قرارداد رو برداره
    function withdrawNative() external {
        require(msg.sender == owner, "Only owner can withdraw"); // چک میکنیم فقط مالک باشه

        uint256 balance = address(this).balance; // موجودی فعلی قرارداد
        require(balance > 0, "No funds to withdraw"); // چک میکنیم پولی وجود داره

        // انتقال امن پول با متد call (جلوگیری از حمله Reentrancy)
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Transfer failed");
    }
}