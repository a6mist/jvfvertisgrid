// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITRC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

interface IProjectToken {
    function transfer(address to, uint256 amount) external returns (bool);
}

contract IEFO_IDO {
    uint256 public constant START_PRICE = 50_000;
    uint256 public constant PRICE_INCREMENT = 1_000;
    uint256 public constant USDT_PER_TIER = 100_000 * 1e6;
    uint256 public constant MAX_TOKENS = 1_000_000_000 * 1e18;

    struct Invoice {
        bool exists;
        bool paid;
        string invoiceId;
        uint256 usdtAmount;
        uint256 tokenAmount;
        uint256 expiryDate;
        address recipientWallet;
        string notes;
        address payer;
        uint256 paidAt;
        uint256 usdtSpent;
    }

    address public owner;
    ITRC20 public usdt;
    IProjectToken public token;

    uint256 public currentTier;
    uint256 public totalSold;
    uint256 public totalUsdtCollected;
    uint256 public totalParticipants;
    uint256 public startTime;
    uint256 public endTime;

    bool public isBuyPaused;
    bool public isClaimPaused;

    mapping(address => uint256) public purchased;
    mapping(address => bool) public claimed;
    mapping(bytes32 => Invoice) private invoices;

    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 usdtSpent);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event InvoiceCreated(
        bytes32 indexed invoiceKey,
        string invoiceId,
        uint256 usdtAmount,
        uint256 tokenAmount,
        uint256 expiryDate,
        address indexed recipientWallet
    );
    event InvoicePaid(
        bytes32 indexed invoiceKey,
        string invoiceId,
        address indexed payer,
        uint256 tokenAmount,
        uint256 usdtSpent
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _usdt, address _token, uint256 _startTime, uint256 _endTime) {
        require(_usdt != address(0) && _token != address(0), "Invalid contract address");
        require(_endTime > _startTime, "Invalid sale window");

        owner = msg.sender;
        usdt = ITRC20(_usdt);
        token = IProjectToken(_token);
        startTime = _startTime;
        endTime = _endTime;
    }

    function getCurrentPrice() public view returns (uint256) {
        return START_PRICE + (currentTier * PRICE_INCREMENT);
    }

    function getAdmins() external view returns (address[] memory admins) {
        admins = new address[](1);
        admins[0] = owner;
    }

    function simulateBuyWithUSDT(uint256 usdtAmount)
        external
        view
        returns (
            uint256 totalTokens,
            uint256 finalTier,
            uint256[] memory tierAmounts,
            uint256[] memory tierPrices,
            uint256 totalUsdtUsed
        )
    {
        uint256 price = getCurrentPrice();
        totalTokens = (usdtAmount * 1e18) / price;
        finalTier = (totalUsdtCollected + usdtAmount) / USDT_PER_TIER;
        tierAmounts = new uint256[](1);
        tierPrices = new uint256[](1);
        tierAmounts[0] = totalTokens;
        tierPrices[0] = price;
        totalUsdtUsed = usdtAmount;
    }

    function buyWithExactUSDT(uint256 usdtAmount) external {
        require(!isBuyPaused, "Buy paused");
        require(block.timestamp >= startTime && block.timestamp <= endTime, "Sale not active");
        require(usdtAmount > 0, "Zero amount");

        uint256 tokensToReceive = (usdtAmount * 1e18) / getCurrentPrice();
        require(tokensToReceive > 0, "Amount too small");
        require(totalSold + tokensToReceive <= MAX_TOKENS, "Max token cap reached");

        bool ok = usdt.transferFrom(msg.sender, address(this), usdtAmount);
        require(ok, "USDT transfer failed");

        if (purchased[msg.sender] == 0) {
            totalParticipants += 1;
        }

        purchased[msg.sender] += tokensToReceive;
        totalSold += tokensToReceive;
        totalUsdtCollected += usdtAmount;
        currentTier = totalUsdtCollected / USDT_PER_TIER;

        emit TokensPurchased(msg.sender, tokensToReceive, usdtAmount);
    }

    function claim() external {
        require(!isClaimPaused, "Claim paused");
        require(block.timestamp > endTime, "Claim not open");
        require(!claimed[msg.sender], "Already claimed");

        uint256 amount = purchased[msg.sender];
        require(amount > 0, "Nothing to claim");

        claimed[msg.sender] = true;
        bool ok = token.transfer(msg.sender, amount);
        require(ok, "Token transfer failed");

        emit TokensClaimed(msg.sender, amount);
    }

    function createInvoice(
        string calldata invoiceId,
        uint256 usdtAmount,
        uint256 tokenAmount,
        uint256 expiryDate,
        address recipientWallet,
        string calldata notes
    ) external onlyOwner {
        require(bytes(invoiceId).length > 0, "Invalid invoice id");
        require(recipientWallet != address(0), "Invalid recipient");

        bytes32 invoiceKey = keccak256(bytes(invoiceId));
        require(!invoices[invoiceKey].exists, "Invoice exists");

        invoices[invoiceKey] = Invoice({
            exists: true,
            paid: false,
            invoiceId: invoiceId,
            usdtAmount: usdtAmount,
            tokenAmount: tokenAmount,
            expiryDate: expiryDate,
            recipientWallet: recipientWallet,
            notes: notes,
            payer: address(0),
            paidAt: 0,
            usdtSpent: 0
        });

        emit InvoiceCreated(invoiceKey, invoiceId, usdtAmount, tokenAmount, expiryDate, recipientWallet);
    }

    function payInvoice(string calldata invoiceId, uint256 maxUsdtAllowed) external {
        bytes32 invoiceKey = keccak256(bytes(invoiceId));
        Invoice storage invoice = invoices[invoiceKey];

        require(invoice.exists, "Invoice not found");
        require(!invoice.paid, "Invoice already paid");
        require(maxUsdtAllowed >= invoice.usdtAmount, "Slippage exceeded");
        require(invoice.expiryDate == 0 || block.timestamp <= invoice.expiryDate, "Invoice expired");

        bool ok = usdt.transferFrom(msg.sender, invoice.recipientWallet, invoice.usdtAmount);
        require(ok, "USDT transfer failed");

        invoice.paid = true;
        invoice.payer = msg.sender;
        invoice.paidAt = block.timestamp;
        invoice.usdtSpent = invoice.usdtAmount;

        emit InvoicePaid(invoiceKey, invoiceId, msg.sender, invoice.tokenAmount, invoice.usdtAmount);
    }

    function getInvoice(string calldata invoiceId)
        external
        view
        returns (
            bool exists,
            bool paid,
            string memory outInvoiceId,
            uint256 usdtAmount,
            uint256 tokenAmount,
            uint256 expiryDate,
            address recipientWallet,
            string memory notes,
            address payer,
            uint256 paidAt,
            uint256 usdtSpent
        )
    {
        Invoice storage invoice = invoices[keccak256(bytes(invoiceId))];
        return (
            invoice.exists,
            invoice.paid,
            invoice.invoiceId,
            invoice.usdtAmount,
            invoice.tokenAmount,
            invoice.expiryDate,
            invoice.recipientWallet,
            invoice.notes,
            invoice.payer,
            invoice.paidAt,
            invoice.usdtSpent
        );
    }

    function setBuyPaused(bool paused) external onlyOwner {
        isBuyPaused = paused;
    }

    function setClaimPaused(bool paused) external onlyOwner {
        isClaimPaused = paused;
    }

    function setSaleTimes(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_endTime > _startTime, "Invalid sale window");
        startTime = _startTime;
        endTime = _endTime;
    }

    function withdrawUSDT(uint256 amount, address to) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        bool ok = usdt.transfer(to, amount);
        require(ok, "USDT withdraw failed");
    }
}