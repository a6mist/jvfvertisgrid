// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

/// @title WeareLegend Upgradeable Token (WLG)
/// @notice UUPS-upgradeable ERC20 token for the WeareLegend ecosystem.
/// @dev Access is role-based (no Ownable). Intended to be controlled by a multisig wallet.
contract WeareLegendTokenUpgradeable is
    Initializable,
    ERC20Upgradeable,
    ERC20BurnableUpgradeable,
    ERC20PausableUpgradeable,
    AccessControlUpgradeable,
    UUPSUpgradeable
{
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    uint256 public constant INITIAL_SUPPLY = 1_000_000_000 * 1e18;

    bool public burnEnabled;
    bool public pauseEnabled;

    event BurnEnabledSet(bool enabled);
    event PauseEnabledSet(bool enabled);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /// @notice Initializes the token proxy.
    /// @param adminMultisig Address that receives admin and operational roles.
    /// @param treasury Address that receives the initial 1,000,000,000 WLG supply.
    /// @param burnEnabled_ Whether burn/burnFrom are enabled on init.
    /// @param pauseEnabled_ Whether pause/unpause controls are enabled on init.
    function initialize(
        address adminMultisig,
        address treasury,
        bool burnEnabled_,
        bool pauseEnabled_
    ) external initializer {
        require(adminMultisig != address(0), "Invalid admin");
        require(treasury != address(0), "Invalid treasury");

        __ERC20_init("WeareLegend", "WLG");
        __ERC20Burnable_init();
        __ERC20Pausable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, adminMultisig);
        _grantRole(MINTER_ROLE, adminMultisig);
        _grantRole(PAUSER_ROLE, adminMultisig);
        _grantRole(UPGRADER_ROLE, adminMultisig);

        burnEnabled = burnEnabled_;
        pauseEnabled = pauseEnabled_;

        _mint(treasury, INITIAL_SUPPLY);
    }

    /// @notice Mints additional WLG to a target address.
    /// @dev Max supply is intentionally uncapped.
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(to != address(0), "Invalid recipient");
        _mint(to, amount);
    }

    /// @notice Enables or disables token burning.
    function setBurnEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        burnEnabled = enabled;
        emit BurnEnabledSet(enabled);
    }

    /// @notice Enables or disables pause functionality.
    function setPauseEnabled(bool enabled) external onlyRole(DEFAULT_ADMIN_ROLE) {
        pauseEnabled = enabled;
        emit PauseEnabledSet(enabled);
    }

    /// @notice Pauses token transfers.
    function pause() external onlyRole(PAUSER_ROLE) {
        require(pauseEnabled, "Pause disabled");
        _pause();
    }

    /// @notice Unpauses token transfers.
    function unpause() external onlyRole(PAUSER_ROLE) {
        require(pauseEnabled, "Pause disabled");
        _unpause();
    }

    /// @inheritdoc ERC20BurnableUpgradeable
    function burn(uint256 value) public override {
        require(burnEnabled, "Burn disabled");
        super.burn(value);
    }

    /// @inheritdoc ERC20BurnableUpgradeable
    function burnFrom(address account, uint256 value) public override {
        require(burnEnabled, "Burn disabled");
        super.burnFrom(account, value);
    }

    /// @dev Required by UUPS; restricted to UPGRADER_ROLE (multisig-controlled).
    function _authorizeUpgrade(address newImplementation) internal view override onlyRole(UPGRADER_ROLE) {
        require(newImplementation != address(0), "Invalid implementation");
    }

    /// @dev Resolves ERC20 + ERC20Pausable hook requirements.
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20Upgradeable, ERC20PausableUpgradeable)
    {
        super._update(from, to, value);
    }
}
