Design a modern Web3 Invoice & Payment Gateway system for a crypto IDO platform called “wearelegend”.

Use a dark theme (#0B0F1A) with neon purple (#6C5CE7) and aqua (#00F5D4) accents. Apply glassmorphism UI, soft glow buttons, and a premium crypto fintech design.

The system must support crypto payments via wallet connection (MetaMask, WalletConnect) and display real-time transaction states.

-------------------------------------
🧾 INVOICE PAYMENT PAGE (PUBLIC LINK)
-------------------------------------

Frame: Invoice Payment Page (Desktop + Mobile)

Sections:

1. Header
- Logo: wearelegend
- Secure badge: “Blockchain Verified Payment”
- Network indicator

2. Invoice Card
- Invoice ID (INV-XXXX)
- Status badge:
  - Pending
  - Paid
  - Expired
- Amount (USDT)
- Equivalent Tokens (auto-calculated)
- Expiry countdown timer

3. Wallet Connection
- Connect Wallet button
- Show connected wallet address (0x123...abc)
- Display USDT balance

4. Payment Section
- Required Amount (USDT)
- Token amount preview
- Slippage / tolerance display (optional)

Buttons:
- Approve USDT
- Pay Now

5. Transaction Status UI
- Waiting for approval
- Pending transaction
- Success confirmation
- Failed transaction

6. Success State
- “Payment Successful”
- Transaction Hash (clickable)
- Tokens allocated confirmation
- Button: “View Portfolio”

-------------------------------------
🔗 INVOICE GENERATOR (ADMIN PANEL)
-------------------------------------

Frame: Admin → Create Invoice

Fields:
- Invoice Amount (USDT)
- Token Amount (optional auto-calc)
- Expiry Date / Time
- Recipient Wallet (optional)
- Notes / Purpose

Buttons:
- Generate Invoice
- Copy Link
- Share Link

Output:
- Unique URL (wearelegend.app/pay/INV-XXXX)

-------------------------------------
📋 INVOICE MANAGEMENT DASHBOARD
-------------------------------------

Frame: Admin → Invoices

Table/List:
- Invoice ID
- Amount
- Wallet (if assigned)
- Status (Pending / Paid / Expired)
- Created Date
- Expiry Date

Actions:
- View
- Copy Link
- Cancel / Expire

-------------------------------------
📱 MOBILE EXPERIENCE
-------------------------------------

- WalletConnect QR modal
- Deep linking to wallet apps
- Sticky “Pay Now” button
- Fullscreen transaction status

-------------------------------------
🔐 SECURITY UX
-------------------------------------

Display warnings:

- “All payments are processed via your wallet”
- “We never ask for private keys or seed phrases”
- “Always verify this domain before paying”

Add:
- Lock icon + HTTPS indicator
- Anti-phishing notice banner

-------------------------------------
🎨 UI STYLE
-------------------------------------

- Glass cards with blur
- Neon glow buttons
- Smooth loading animations
- Animated success checkmark
- Progress indicators

-------------------------------------
⚙️ TECH HANDOFF NOTES
-------------------------------------

- Wallet integration:
  - MetaMask (window.ethereum)
  - WalletConnect v2

- Smart contract:
  - Call simulateBuy() for preview
  - Call buy() for payment

- Token:
  - USDT approval + transfer flow

-------------------------------------