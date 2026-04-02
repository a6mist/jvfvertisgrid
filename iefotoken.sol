// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract IEFO is ERC20, ERC20Burnable, ERC20Pausable, AccessControl {
    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 1e18;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    mapping(address => bool) public blacklist;
    mapping(address => uint256) public lastTxTime;

    uint256 public cooldown = 10; // seconds
    bool public burnEnabled = true;
    bool public pauseEnabled = true;

    constructor(address owner_) ERC20("IEFO", "IEFO") {
        require(owner_ != address(0), "Invalid owner");

        _grantRole(DEFAULT_ADMIN_ROLE, owner_);
        _grantRole(MINTER_ROLE, owner_);
        _grantRole(PAUSER_ROLE, owner_);

        _mint(owner_, INITIAL_SUPPLY);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        require(pauseEnabled, "Pause feature disabled");
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        require(pauseEnabled, "Pause feature disabled");
        _unpause();
    }

    function setBlacklist(address user, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        blacklist[user] = status;
    }

    function setCooldown(uint256 _cooldown) external onlyRole(DEFAULT_ADMIN_ROLE) {
        cooldown = _cooldown;
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Invalid recipient");
        _mint(to, amount);
    }

    function setBurnEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        burnEnabled = enabled;
    }

    function setPauseEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pauseEnabled = enabled;
    }

    function burn(uint256 value) public override {
        require(burnEnabled, "Burn feature disabled");
        super.burn(value);
    }

    function _update(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Pausable)
    {
        require(!blacklist[from] && !blacklist[to], "Blacklisted");

        if (from != address(0) && to != address(0)) {
            require(block.timestamp > lastTxTime[from] + cooldown, "Cooldown active");
            lastTxTime[from] = block.timestamp;
        }

        super._update(from, to, amount);
    }
}