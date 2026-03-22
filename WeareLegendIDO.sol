// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title WeareLegend IDO Contract
/// @notice USDT-based token sale with tiered pricing, invoice purchases, claim-after-release, and signer-based treasury approvals.
/// @dev
/// Security model notes:
/// - This contract is PREFUNDED distribution (not mint-on-claim). Claims transfer tokens held by this contract.
/// - If treasury does not deposit enough WLG, claims can fail (inventory insolvency risk).
/// - Owner has privileged controls (pause/release/admin ops), so ownership should be a multisig in production.
/// - Signer approvals in this contract are custom on-chain checks and are NOT equivalent to a full external multisig wallet governance stack.
/// - Future hardening option: replace custom signer/admin controls with explicit multisig-controlled admin modules.
contract WeareLegendIDO is Ownable, ReentrancyGuard {
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
    uint256 public totalClaimed;
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

    event RequestCreated(
        uint256 indexed id,
        address indexed token,
        uint256 amount,
        address indexed to,
        string purpose
    );
    event Approved(uint256 indexed id, address indexed signer);
    event Executed(uint256 indexed id, address indexed token, uint256 amount, address indexed to);

    event AdminAdded(address indexed account);
    event AdminRemoved(address indexed account);
    event SignerAdded(address indexed account);
    event SignerRemoved(address indexed account);
    event RequiredApprovalsUpdated(uint256 previousRequiredApprovals, uint256 newRequiredApprovals);
    event Deposit(address indexed sender, uint256 amount);

    /// @notice Emitted when tokens are deposited via fundTokenInventory.
    /// @dev This is informational only; direct ERC20 transfers to this contract are also valid prefunding.
    event TokenInventoryFunded(address indexed sender, uint256 amount, uint256 newBalance);

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
        address tokenAddress_,
        address usdtAddress_,
        address[] memory initialSigners,
        uint256 requiredApprovals_
    ) Ownable(msg.sender) {
        require(tokenAddress_ != address(0), "Invalid token");
        require(usdtAddress_ != address(0), "Invalid usdt");
        require(requiredApprovals_ > 0, "Required approvals is zero");
        require(initialSigners.length >= requiredApprovals_, "Too few signers");

        token = IERC20(tokenAddress_);
        usdt = IERC20(usdtAddress_);

        startTime = block.timestamp;
        endTime = block.timestamp + 180 days;
        saleHasEnd = true;

        for (uint256 i = 0; i < initialSigners.length; i++) {
            address signer = initialSigners[i];
            require(signer != address(0), "Zero signer");

            for (uint256 j = i + 1; j < initialSigners.length; j++) {
                require(signer != initialSigners[j], "Duplicate signer");
            }

            signers.push(signer);
        }

        requiredApprovals = requiredApprovals_;
        admins.push(msg.sender);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }

    /// @notice Optional helper to prefund claim inventory using transferFrom.
    /// @dev Treasury may also transfer tokens directly to this contract without calling this helper.
    function fundTokenInventory(uint256 amount) external {
        require(amount > 0, "Invalid amount");
        token.safeTransferFrom(msg.sender, address(this), amount);
        emit TokenInventoryFunded(msg.sender, amount, token.balanceOf(address(this)));
    }

    function setBuyPaused(bool paused) external onlyOwner {
        isBuyPaused = paused;
    }

    function setClaimPaused(bool paused) external onlyOwner {
        isClaimPaused = paused;
    }

    function setSaleTimes(uint256 startTime_, uint256 endTime_) external onlyOwner {
        require(startTime_ < endTime_, "Start must be before end");
        startTime = startTime_;
        endTime = endTime_;
        emit SaleTimesUpdated(startTime_, endTime_);
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

            uint256 usedInTier = runningUsdt % USDT_PER_TIER;
            uint256 availableUsdtInTier = USDT_PER_TIER - usedInTier;

            uint256 spend = remainingUSDT;
            if (spend > availableUsdtInTier) {
                spend = availableUsdtInTier;
            }

            uint256 price = getTierPrice(tier);
            uint256 tokens = (spend * TOKEN_DECIMALS) / price;

            uint256 remainingCap = MAX_TOKENS - sold;
            if (tokens > remainingCap) {
                tokens = remainingCap;
                spend = (tokens * price) / TOKEN_DECIMALS;
            }

            if (tokens == 0 || spend == 0) {
                break;
            }

            tierAmounts[tier] += tokens;
            tierPrices[tier] = price;

            totalTokens += tokens;
            totalUsdtUsed += spend;

            runningUsdt += spend;
            sold += tokens;
            remainingUSDT -= spend;
        }

        finalTier = totalUsdtUsed > 0 ? ((runningUsdt - 1) / USDT_PER_TIER) : currentTier();
    }

    function buyWithUSDT(uint256 desiredTokens) external nonReentrant {
        require(!isBuyPaused, "Buy paused");
        require(_isSaleActive(), "Sale inactive");
        require(desiredTokens > 0, "Must buy > 0");

        (uint256 totalCost,, uint256[] memory tierAmounts, uint256[] memory tierPrices) = simulateBuy(desiredTokens);
        require(totalCost > 0, "Invalid purchase");

        usdt.safeTransferFrom(msg.sender, address(this), totalCost);

        for (uint256 i = 0; i < MAX_TIERS_TRACKED; i++) {
            if (tierAmounts[i] > 0) {
                tierHistory[msg.sender].push(
                    TierBreakdown({ tier: i, amount: tierAmounts[i], price: tierPrices[i] })
                );
                emit TierPurchase(msg.sender, i, tierAmounts[i], tierPrices[i]);
            }
        }

        purchased[msg.sender] += desiredTokens;
        totalSold += desiredTokens;

        _recordPurchase(msg.sender, totalCost);

        emit TokensPurchased(msg.sender, desiredTokens, totalCost);
    }

    function buyWithExactUSDT(uint256 usdtAmount) external nonReentrant {
        require(!isBuyPaused, "Buy paused");
        require(_isSaleActive(), "Sale inactive");
        require(usdtAmount > 0, "Must input > 0 USDT");

        (
            uint256 totalTokens,
            ,
            uint256[] memory tierAmounts,
            uint256[] memory tierPrices,
            uint256 totalUsdtUsed
        ) = simulateBuyWithUSDT(usdtAmount);

        require(totalTokens > 0 && totalUsdtUsed > 0, "Invalid purchase");

        usdt.safeTransferFrom(msg.sender, address(this), totalUsdtUsed);

        for (uint256 i = 0; i < MAX_TIERS_TRACKED; i++) {
            if (tierAmounts[i] > 0) {
                tierHistory[msg.sender].push(
                    TierBreakdown({ tier: i, amount: tierAmounts[i], price: tierPrices[i] })
                );
                emit TierPurchase(msg.sender, i, tierAmounts[i], tierPrices[i]);
            }
        }

        purchased[msg.sender] += totalTokens;
        totalSold += totalTokens;

        _recordPurchase(msg.sender, totalUsdtUsed);

        emit TokensPurchased(msg.sender, totalTokens, totalUsdtUsed);
    }

    function claim() external nonReentrant {
        require(!isClaimPaused, "Claim paused");
        require(released, "Not released");
        require(!claimed[msg.sender], "Already claimed");

        uint256 amount = purchased[msg.sender];
        require(amount > 0, "Nothing to claim");

        claimed[msg.sender] = true;
        totalClaimed += amount;
        token.safeTransfer(msg.sender, amount);

        emit TokensClaimed(msg.sender, amount);
    }

    function getPurchased(address account) external view returns (uint256) {
        return purchased[account];
    }

    function getTierHistory(address account) external view returns (TierBreakdown[] memory) {
        return tierHistory[account];
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

    function setRequiredApprovals(uint256 newRequiredApprovals) external onlyOwner {
        require(newRequiredApprovals > 0, "Required approvals is zero");
        require(newRequiredApprovals <= signers.length, "Required > signers");

        uint256 previousRequiredApprovals = requiredApprovals;
        requiredApprovals = newRequiredApprovals;

        emit RequiredApprovalsUpdated(previousRequiredApprovals, newRequiredApprovals);
    }

    function addSigner(address account) external onlyOwner {
        require(account != address(0), "Invalid address");
        require(!isSigner(account), "Already signer");

        signers.push(account);
        emit SignerAdded(account);
    }

    function removeSigner(address account) external onlyOwner {
        require(isSigner(account), "Not signer");
        require(signers.length > 1, "At least one signer required");

        for (uint256 i = 0; i < signers.length; i++) {
            if (signers[i] == account) {
                signers[i] = signers[signers.length - 1];
                signers.pop();
                emit SignerRemoved(account);
                break;
            }
        }

        if (requiredApprovals > signers.length) {
            uint256 previousRequiredApprovals = requiredApprovals;
            requiredApprovals = signers.length;
            emit RequiredApprovalsUpdated(previousRequiredApprovals, requiredApprovals);
        }
    }

    function createWithdrawRequest(
        address token_,
        uint256 amount,
        address to,
        string calldata purpose
    ) external onlyAdmin {
        require(token_ != address(0), "Invalid token");
        require(to != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");

        uint256 id = requestCount++;
        requests[id] = WithdrawRequest({
            id: id,
            token: token_,
            amount: amount,
            to: to,
            approvals: 0,
            executed: false,
            createdAt: block.timestamp,
            purpose: purpose
        });

        emit RequestCreated(id, token_, amount, to, purpose);
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

    function createInvoice(
        string calldata invoiceId,
        uint256 usdtAmount,
        uint256 tokenAmount,
        uint256 expiryDate,
        address recipientWallet,
        string calldata notes
    ) external onlyAdmin {
        require(bytes(invoiceId).length > 0, "Invalid invoiceId");
        require(usdtAmount > 0, "Invalid usdtAmount");
        require(tokenAmount > 0, "Invalid tokenAmount");
        require(expiryDate > block.timestamp, "Invalid expiry");

        bytes32 invoiceKey = keccak256(bytes(invoiceId));
        require(!invoices[invoiceKey].exists, "Invoice exists");

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

    function payInvoice(string calldata invoiceId) external nonReentrant {
        bytes32 invoiceKey = keccak256(bytes(invoiceId));
        InvoiceData storage inv = invoices[invoiceKey];

        require(inv.exists, "Invoice not found");
        require(!inv.paid, "Invoice already paid");
        require(block.timestamp <= inv.expiryDate, "Invoice expired");

        if (inv.recipientWallet != address(0)) {
            require(inv.recipientWallet == msg.sender, "Not authorized payer");
        }

        require(totalSold + inv.tokenAmount <= MAX_TOKENS, "Exceeds max cap");

        usdt.safeTransferFrom(msg.sender, address(this), inv.usdtAmount);

        inv.paid = true;
        inv.payer = msg.sender;
        inv.paidAt = block.timestamp;
        inv.usdtSpent = inv.usdtAmount;

        purchased[msg.sender] += inv.tokenAmount;
        totalSold += inv.tokenAmount;

        _recordPurchase(msg.sender, inv.usdtAmount);

        emit TokensPurchased(msg.sender, inv.tokenAmount, inv.usdtAmount);
        emit InvoicePaid(invoiceKey, inv.invoiceId, msg.sender, inv.tokenAmount, inv.usdtAmount);
    }

    function getInvoice(string calldata invoiceId)
        external
        view
        returns (
            bool exists,
            bool paid,
            string memory id,
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
        InvoiceData storage inv = invoices[keccak256(bytes(invoiceId))];

        return (
            inv.exists,
            inv.paid,
            inv.invoiceId,
            inv.usdtAmount,
            inv.tokenAmount,
            inv.expiryDate,
            inv.recipientWallet,
            inv.notes,
            inv.payer,
            inv.paidAt,
            inv.usdtSpent
        );
    }

    function getInvoiceByKey(bytes32 invoiceKey) external view returns (InvoiceData memory) {
        return invoices[invoiceKey];
    }

    function claimableInventory() external view returns (uint256) {
        return token.balanceOf(address(this));
    }

    function remainingClaimLiability() public view returns (uint256) {
        return totalSold - totalClaimed;
    }

    function hasSufficientClaimInventory() public view returns (bool) {
        return token.balanceOf(address(this)) >= remainingClaimLiability();
    }
}
