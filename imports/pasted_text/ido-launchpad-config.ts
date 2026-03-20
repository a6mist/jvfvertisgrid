Design a modern Web3 IDO launchpad web application called “wearelegend”.

Use a dark theme with neon purple (#6C5CE7) and aqua (#00F5D4) accents, glassmorphism UI, and a premium crypto dashboard layout.

IMPORTANT: This app must support real multi-wallet integration using trusted Web3 standards.

-------------------------------------
🔗 WALLET INTEGRATION (TRUSTED ONLY)
-------------------------------------

Support the following wallets:

Primary:
- MetaMask (browser extension & mobile)

Secondary (via WalletConnect):
- Trust Wallet
- OKX Wallet
- Binance Web3 Wallet
- Rainbow Wallet
- SafePal

Also include:
- Coinbase Wallet (direct or WalletConnect)

Use:
- WalletConnect v2 (for multi-wallet support)
- window.ethereum (for MetaMask detection)

-------------------------------------
🧠 WALLET CONNECTION FLOW
-------------------------------------

States:
- Disconnected
- Connecting
- Connected

UI:
- Wallet selection modal
- Show wallet icons + names
- Show address (0x123...abc)
- Copy button
- Disconnect button

Flow:
1. User clicks “Connect Wallet”
2. Modal shows wallet options
3. User selects wallet
4. Wallet opens (MetaMask / QR for mobile)
5. User approves connection
6. App reads wallet address and network

-------------------------------------
🌐 NETWORK HANDLING
-------------------------------------

- Detect network (Ethereum, BSC, etc.)
- Show warning if wrong network
- Add “Switch Network” button
- Auto prompt network switch

-------------------------------------
💰 SMART CONTRACT INTEGRATION
-------------------------------------

Connect to IDO contract (wearelegend):

Read:
- getCurrentPrice()
- currentTier()
- totalSold
- totalUsdtCollected
- purchased(user)
- claimed(user)

Write:
- buy()
- claim()

Simulation:
- simulateBuy()
- simulateBuyWithUSDT()

-------------------------------------
💳 TOKEN HANDLING (USDT)
-------------------------------------

- Detect USDT balance
- Check allowance
- Show “Approve USDT” button if needed
- Then enable “Buy Tokens”

-------------------------------------
🔐 TRANSACTION FLOW
-------------------------------------

For Buy:
- Approve USDT (if needed)
- Confirm buy() via wallet
- Show pending / success / fail states

For Claim:
- Confirm claim() via wallet
- Show success state

-------------------------------------
⚠️ SECURITY UX (CRITICAL)
-------------------------------------

Display warnings:
- “Never share your seed phrase”
- “We will never ask for private keys”
- “All transactions require wallet confirmation”

Prevent:
- Fake wallet popups
- Redirect-based phishing
- Manual private key input

-------------------------------------
🖥️ CORE SCREENS
-------------------------------------

- Landing Page
- Dashboard (IDO stats)
- Buy Screen (with simulation)
- Portfolio (user tokens)
- Claim Page
- Admin Panel (optional)
- Treasury / Multisig

-------------------------------------
✨ UI STYLE
-------------------------------------

- Glassmorphism cards
- Neon glow buttons
- Smooth transitions
- Real-time blockchain updates

-------------------------------------
📱 MOBILE UX
-------------------------------------

- WalletConnect QR modal
- Deep linking to wallet apps
- Sticky Buy button

-------------------------------------
⚙️ TECH STACK
-------------------------------------

- React / Next.js
- wagmi + viem (or ethers.js)
- WalletConnect v2 SDK
- MetaMask provider (window.ethereum)
- TailwindCSS

-------------------------------------