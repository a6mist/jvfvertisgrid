// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract wearelegend is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token;
    IERC20 public immutable usdt;

    uint256 public startTime;
    uint256 public endTime;
    bool public saleHasEnd;
    bool public released;

    uint256 public constant TOKEN_DECIMALS = 1e18;
    uint256 public constant USDT_DECIMALS = 1e6;
    uint256 public constant START_PRICE = 50_000; // 0.05 USDT (6 decimals)
    uint256 public constant PRICE_INCREMENT = 20_000; // 0.02 USDT
    uint256 public constant USDT_PER_TIER = 2_000_000 * USDT_DECIMALS;
    uint256 public constant MAX_TIERS_TRACKED = 64;
    uint256 public constant MAX_TOKENS = 244_000_000 * TOKEN_DECIMALS;

    bool public isBuyPaused;
    bool public isClaimPaused;

    uint256 public totalSold;
    uint256 public totalUsdtCollected;
    uint256 public totalParticipants;
    uint256 public totalPurchaseTransactions;

    mapping(address => uint256) public purchased;
    mapping(address => bool) public claimed;
    mapping(address => bool) public hasParticipated;

    struct TierBreakdown {
        uint256 tier;
        uint256 amount;
        uint256 price;
    }

    struct InvoiceData {
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

    mapping(address => TierBreakdown[]) public tierHistory;
    mapping(bytes32 => InvoiceData) private invoices;

    struct WithdrawRequest {
        uint256 id;
        address token;
        uint256 amount;
        address to;
        uint256 approvals;
        bool executed;
        uint256 createdAt;
        string purpose;
    }

    struct SignerApproval {
        address signer;
        bool approved;
    }

    address[] public signers;
    address[] public admins;
    uint256 public requiredApprovals;
    uint256 public requestCount;

    mapping(uint256 => WithdrawRequest) public requests;
    mapping(uint256 => mapping(address => bool)) public hasApproved;

    event TokensPurchased(address indexed buyer, uint256 tokenAmount, uint256 usdtSpent);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event TierPurchase(address indexed buyer, uint256 tier, uint256 amount, uint256 price);
    event Released();
    event SaleTimesUpdated(uint256 start, uint256 end);
    event SaleEndModeUpdated(bool hasEnd);

    event RequestCreated(uint256 indexed id, address indexed token, uint256 amount, address indexed to, string purpose);
    event Approved(uint256 indexed id, address indexed signer);
    event Executed(uint256 indexed id, address indexed token, uint256 amount, address indexed to);

    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);
    event Deposit(address indexed sender, uint256 amount);
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

    modifier onlySigner() {
        require(isSigner(msg.sender), "Not signer");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin(msg.sender), "Not admin");
        _;
    }

    constructor(
        address _token,
        address _usdt,
        address[] memory _signers,
        uint256 _required
    ) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token");
        require(_usdt != address(0), "Invalid usdt");
        require(_required > 0, "Required approvals is zero");
        require(_signers.length >= _required, "Too few signers");

        token = IERC20(_token);
        usdt = IERC20(_usdt);

        startTime = block.timestamp;
        endTime = block.timestamp + 180 days;
        saleHasEnd = true;

        for (uint256 i = 0; i < _signers.length; i++) {
            address signer = _signers[i];
            require(signer != address(0), "Zero signer");

            for (uint256 j = i + 1; j < _signers.length; j++) {
                require(signer != _signers[j], "Duplicate signer");
            }

            signers.push(signer);
        }

        requiredApprovals = _required;

        admins.push(msg.sender);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    function setBuyPaused(bool paused) external onlyOwner {
        isBuyPaused = paused;
    }

    function setClaimPaused(bool paused) external onlyOwner {
        isClaimPaused = paused;
    }

    function setSaleTimes(uint256 _startTime, uint256 _endTime) external onlyOwner {
        require(_startTime < _endTime, "Start must be before end");
        startTime = _startTime;
        endTime = _endTime;
        emit SaleTimesUpdated(_startTime, _endTime);
    }

    function setSaleHasEnd(bool hasEnd) external onlyOwner {
        saleHasEnd = hasEnd;
        emit SaleEndModeUpdated(hasEnd);
    }

    function release() external onlyOwner {
        released = true;
        emit Released();
    }

    function getTierPrice(uint256 tier) public pure returns (uint256) {
        return START_PRICE + (PRICE_INCREMENT * tier);
    }

    function getCurrentPrice() external view returns (uint256) {
        return getTierPrice(currentTier());
    }

    function currentTier() public view returns (uint256) {
        return totalUsdtCollected / USDT_PER_TIER;
    }

    function debugSaleTimestamps()
        external
        view
        returns (
            uint256 currentTime,
            uint256 saleStart,
            uint256 saleEnd,
            bool isSaleActive,
            uint256 totalTokens,
            uint256 totalUSDT
        )
    {
        currentTime = block.timestamp;
        saleStart = startTime;
        saleEnd = endTime;
        isSaleActive = (currentTime >= saleStart && currentTime <= saleEnd);
        if (!saleHasEnd) {
            isSaleActive = (currentTime >= saleStart);
        }
        totalTokens = totalSold;
        totalUSDT = totalUsdtCollected;
    }

    function _isSaleActive() internal view returns (bool) {
        if (block.timestamp < startTime) {
            return false;
        }

        if (!saleHasEnd) {
            return true;
        }

        return block.timestamp <= endTime;
    }

    function _recordPurchase(address buyer, uint256 usdtSpent) internal {
        totalPurchaseTransactions += 1;

        if (!hasParticipated[buyer]) {
            hasParticipated[buyer] = true;
            totalParticipants += 1;
        }

        if (usdtSpent > 0) {
            totalUsdtCollected += usdtSpent;
        }
    }

    function getAveragePurchasePerTransaction() external view returns (uint256) {
        if (totalPurchaseTransactions == 0) {
            return 0;
        }

        return totalUsdtCollected / totalPurchaseTransactions;
    }

    function getAveragePurchasePerParticipant() external view returns (uint256) {
        if (totalParticipants == 0) {
            return 0;
        }

        return totalUsdtCollected / totalParticipants;
    }

    function simulateBuy(uint256 desiredTokens)
        public
        view
        returns (
            uint256 totalCost,
            uint256 finalTier,
            uint256[] memory tierAmounts,
            uint256[] memory tierPrices
        )
    {
        require(desiredTokens > 0, "Must buy > 0");
        require(totalSold + desiredTokens <= MAX_TOKENS, "Exceeds max cap");

        uint256 remaining = desiredTokens;
        uint256 tier;
        uint256 sold = totalSold;
        uint256 runningUsdt = totalUsdtCollected;

        tierAmounts = new uint256[](MAX_TIERS_TRACKED);
        tierPrices = new uint256[](MAX_TIERS_TRACKED);

        while (remaining > 0 && sold < MAX_TOKENS) {
            tier = runningUsdt / USDT_PER_TIER;
            require(tier < MAX_TIERS_TRACKED, "Tier overflow");

            uint256 usedInTier = runningUsdt % USDT_PER_TIER;
            uint256 availableUsdtInTier = USDT_PER_TIER - usedInTier;

            uint256 price = getTierPrice(tier);
            uint256 maxTokensByTierUsdt = (availableUsdtInTier * TOKEN_DECIMALS) / price;
            uint256 remainingCap = MAX_TOKENS - sold;

            uint256 toBuy = remaining;
            if (toBuy > maxTokensByTierUsdt) {
                toBuy = maxTokensByTierUsdt;
            }
            if (toBuy > remainingCap) {
                toBuy = remainingCap;
            }

            uint256 cost = (toBuy * price) / TOKEN_DECIMALS;
            if (toBuy == 0 || cost == 0) {
                break;
            }

            totalCost += cost;
            runningUsdt += cost;

            tierAmounts[tier] += toBuy;
            tierPrices[tier] = price;

            remaining -= toBuy;
            sold += toBuy;
        }

        finalTier = totalCost > 0 ? ((runningUsdt - 1) / USDT_PER_TIER) : currentTier();
    }

    function simulateBuyWithUSDT(uint256 usdtAmount)
        public
        view
        returns (
            uint256 totalTokens,
            uint256 finalTier,
            uint256[] memory tierAmounts,
            uint256[] memory tierPrices,
            uint256 totalUsdtUsed
        )
    {
        require(usdtAmount > 0, "Must input > 0 USDT");

        uint256 remainingUSDT = usdtAmount;
        uint256 sold = totalSold;
        uint256 runningUsdt = totalUsdtCollected;

        tierAmounts = new uint256[](MAX_TIERS_TRACKED);
        tierPrices = new uint256[](MAX_TIERS_TRACKED);

        while (remainingUSDT > 0 && sold < MAX_TOKENS) {
            uint256 tier = runningUsdt / USDT_PER_TIER;
            require(tier < MAX_TIERS_TRACKED, "Tier overflow");

            uint256 price = getTierPrice(tier);
            uint256 spendableInTier = remainingUSDT;
            uint256 tierRoomUsdt = USDT_PER_TIER - (runningUsdt % USDT_PER_TIER);
            if (spendableInTier > tierRoomUsdt) {
                spendableInTier = tierRoomUsdt;
            }

            uint256 toBuy = (spendableInTier * TOKEN_DECIMALS) / price;
            uint256 remainingCap = MAX_TOKENS - sold;
            if (toBuy > remainingCap) {
                toBuy = remainingCap;
            }

            uint256 cost = (toBuy * price) / TOKEN_DECIMALS;
            if (toBuy == 0 || cost == 0) {
                break;
            }

            totalTokens += toBuy;
            totalUsdtUsed += cost;
            runningUsdt += cost;

            tierAmounts[tier] += toBuy;
            tierPrices[tier] = price;

            remainingUSDT -= cost;
            sold += toBuy;
        }

        finalTier = totalUsdtUsed > 0 ? ((runningUsdt - 1) / USDT_PER_TIER) : currentTier();
    }

    function buy(uint256 desiredTokens, uint256 maxUsdtAllowed) external nonReentrant {
        require(!isBuyPaused, "Buying is paused");
        require(_isSaleActive(), "Sale inactive");
        require(desiredTokens > 0, "Invalid amount");
        require(totalSold + desiredTokens <= MAX_TOKENS, "Exceeds max cap");

        (uint256 usdtCost, , uint256[] memory tierAmounts, uint256[] memory tierPrices) = simulateBuy(desiredTokens);
        require(usdtCost <= maxUsdtAllowed, "Slippage too high");

        usdt.safeTransferFrom(msg.sender, address(this), usdtCost);

        purchased[msg.sender] += desiredTokens;
        totalSold += desiredTokens;
        _recordPurchase(msg.sender, usdtCost);

        for (uint256 i = 0; i < tierAmounts.length; i++) {
            if (tierAmounts[i] > 0) {
                tierHistory[msg.sender].push(
                    TierBreakdown({
                        tier: i,
                        amount: tierAmounts[i],
                        price: tierPrices[i]
                    })
                );

                emit TierPurchase(msg.sender, i, tierAmounts[i], tierPrices[i]);
            }
        }

        emit TokensPurchased(msg.sender, desiredTokens, usdtCost);
    }

    function createInvoice(
        string calldata invoiceId,
        uint256 usdtAmount,
        uint256 tokenAmount,
        uint256 expiryDate,
        address recipientWallet,
        string calldata notes
    ) external onlyAdmin {
        require(bytes(invoiceId).length > 0, "Invalid invoice id");
        require(usdtAmount > 0, "Invalid amount");
        require(tokenAmount > 0, "Invalid token amount");
        require(expiryDate > block.timestamp, "Invalid expiry");

        bytes32 invoiceKey = keccak256(bytes(invoiceId));
        require(!invoices[invoiceKey].exists, "Invoice already exists");

        invoices[invoiceKey] = InvoiceData({
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

    function payInvoice(string calldata invoiceId, uint256 maxUsdtAllowed) external nonReentrant {
        require(!isBuyPaused, "Buying is paused");
        require(_isSaleActive(), "Sale inactive");

        bytes32 invoiceKey = keccak256(bytes(invoiceId));
        InvoiceData storage invoice = invoices[invoiceKey];

        require(invoice.exists, "Invoice not found");
        require(!invoice.paid, "Invoice already paid");
        require(block.timestamp <= invoice.expiryDate, "Invoice expired");

        if (invoice.recipientWallet != address(0)) {
            require(msg.sender == invoice.recipientWallet, "Wallet not authorized for invoice");
        }

        uint256 desiredTokens = invoice.tokenAmount;
        require(desiredTokens > 0, "Invalid invoice token amount");
        require(totalSold + desiredTokens <= MAX_TOKENS, "Exceeds max cap");

        (uint256 usdtCost, , uint256[] memory tierAmounts, uint256[] memory tierPrices) = simulateBuy(desiredTokens);
        require(usdtCost <= maxUsdtAllowed, "Slippage too high");
        require(usdtCost <= invoice.usdtAmount, "Invoice amount exceeded");

        usdt.safeTransferFrom(msg.sender, address(this), usdtCost);

        purchased[msg.sender] += desiredTokens;
        totalSold += desiredTokens;
        _recordPurchase(msg.sender, usdtCost);

        for (uint256 i = 0; i < tierAmounts.length; i++) {
            if (tierAmounts[i] > 0) {
                tierHistory[msg.sender].push(
                    TierBreakdown({
                        tier: i,
                        amount: tierAmounts[i],
                        price: tierPrices[i]
                    })
                );

                emit TierPurchase(msg.sender, i, tierAmounts[i], tierPrices[i]);
            }
        }

        invoice.paid = true;
        invoice.payer = msg.sender;
        invoice.paidAt = block.timestamp;
        invoice.usdtSpent = usdtCost;

        emit TokensPurchased(msg.sender, desiredTokens, usdtCost);
        emit InvoicePaid(invoiceKey, invoiceId, msg.sender, desiredTokens, usdtCost);
    }

    function getInvoice(string calldata invoiceId) external view returns (InvoiceData memory) {
        return invoices[keccak256(bytes(invoiceId))];
    }

    function claim() external nonReentrant {
        require(!isClaimPaused, "Claiming is paused");
        if (saleHasEnd) {
            require(block.timestamp > endTime, "Sale not ended");
        }
        require(released, "Tokens not released");
        require(!claimed[msg.sender], "Already claimed");

        uint256 amount = purchased[msg.sender];
        require(amount > 0, "No tokens to claim");

        claimed[msg.sender] = true;
        token.safeTransfer(msg.sender, amount);

        emit TokensClaimed(msg.sender, amount);
    }

    function getUserTierHistory(address user) external view returns (TierBreakdown[] memory) {
        return tierHistory[user];
    }

    function getTotalUsdtCollected() external view returns (uint256) {
        return totalUsdtCollected;
    }

    function isAdmin(address account) public view returns (bool) {
        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == account) {
                return true;
            }
        }
        return false;
    }

    function addAdmin(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!isAdmin(account), "Already admin");
        admins.push(account);
        emit AdminAdded(account);
    }

    function removeAdmin(address account) external onlyOwner {
        require(account != owner(), "Cannot remove owner");
        require(isAdmin(account), "Not admin");

        for (uint256 i = 0; i < admins.length; i++) {
            if (admins[i] == account) {
                admins[i] = admins[admins.length - 1];
                admins.pop();
                emit AdminRemoved(account);
                break;
            }
        }
    }

    function getAdmins() external view returns (address[] memory) {
        return admins;
    }

    function createWithdrawRequest(
        address _token,
        uint256 amount,
        address to,
        string calldata _purpose
    ) external onlyAdmin {
        require(_token != address(0), "Invalid token");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 id = requestCount++;
        requests[id] = WithdrawRequest({
            id: id,
            token: _token,
            amount: amount,
            to: to,
            approvals: 0,
            executed: false,
            createdAt: block.timestamp,
            purpose: _purpose
        });

        emit RequestCreated(id, _token, amount, to, _purpose);
    }

    function approveWithdraw(uint256 requestId) external onlySigner {
        require(requestId < requestCount, "Invalid request");

        WithdrawRequest storage req = requests[requestId];
        require(!req.executed, "Already executed");
        require(!hasApproved[requestId][msg.sender], "Already approved");

        hasApproved[requestId][msg.sender] = true;
        req.approvals++;

        emit Approved(requestId, msg.sender);
    }

    function withdrawToken(uint256 requestId) external onlyOwner nonReentrant {
        require(requestId < requestCount, "Invalid request");

        WithdrawRequest storage req = requests[requestId];
        require(!req.executed, "Already executed");
        require(req.approvals >= requiredApprovals, "Not enough approvals");

        req.executed = true;
        IERC20(req.token).safeTransfer(req.to, req.amount);

        emit Executed(requestId, req.token, req.amount, req.to);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function isSigner(address account) public view returns (bool) {
        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == account) {
                return true;
            }
        }
        return false;
    }

    function getSigners() external view returns (address[] memory) {
        return signers;
    }

    function getRequests(uint256 start, uint256 count)
        external
        view
        returns (WithdrawRequest[] memory result, uint256 nextStart)
    {
        if (start >= requestCount) {
            return (new WithdrawRequest[](0), requestCount);
        }

        uint256 end = start + count;
        if (end > requestCount) {
            end = requestCount;
        }

        result = new WithdrawRequest[](end - start);
        for (uint256 i = start; i < end; i++) {
            result[i - start] = requests[i];
        }

        nextStart = end;
    }

    function getRequest(uint256 id) external view returns (WithdrawRequest memory) {
        require(id < requestCount, "Invalid request");
        return requests[id];
    }

    function getApprovalStatus(uint256 requestId) external view returns (SignerApproval[] memory) {
        require(requestId < requestCount, "Invalid request");

        SignerApproval[] memory statusList = new SignerApproval[](signers.length);
        for (uint256 i = 0; i < signers.length; i++) {
            address signer = signers[i];
            statusList[i] = SignerApproval({
                signer: signer,
                approved: hasApproved[requestId][signer]
            });
        }

        return statusList;
    }
}
