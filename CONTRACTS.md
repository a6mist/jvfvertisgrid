# WeareLegend Contracts

## Active deployment set
- WeareLegendTokenUpgradeable.sol
- WeareLegendIDO.sol

## Legacy contract
- wearelegend.sol is kept for history/reference and is deprecated for new deployments.

## Recommended deployment order
1. Deploy WeareLegendTokenUpgradeable implementation.
2. Deploy UUPS proxy and call initialize(adminMultisig, treasury, burnEnabled, pauseEnabled).
3. Deploy WeareLegendIDO with token address, USDT address, signer list, required approvals.
4. Prefund WeareLegendIDO with enough WLG before enabling release/claim.
