Design a modern Web3 Admin Panel for an IDO platform called “wearelegend”.

Use a dark theme (#0B0F1A) with neon purple (#6C5CE7) and aqua (#00F5D4) accents. Apply glassmorphism UI, soft glow effects, and a premium crypto dashboard style.

The Admin Panel must control a live smart contract and reflect real blockchain state.

-------------------------------------
🔐 ACCESS CONTROL UI
-------------------------------------

Show role-based access:

Roles:
- Owner
- Admin
- Signer

UI Elements:
- Role badge (Owner / Admin / Signer)
- Wallet address display
- Access warning if unauthorized

-------------------------------------
📊 OVERVIEW DASHBOARD
-------------------------------------

Display real-time contract stats:

- Total Tokens Sold
- Total USDT Collected
- Current Tier
- Current Token Price
- Sale Status:
  - Not Started
  - Active
  - Ended

Include:
- Progress bar (MAX_TOKENS)
- Sale countdown timer

-------------------------------------
⚙️ SALE CONTROL PANEL
-------------------------------------

Controls mapped to contract:

- Toggle: Pause Buying (isBuyPaused)
- Toggle: Pause Claiming (isClaimPaused)

- Set Sale Time:
  - Start Time input
  - End Time input
  - Update button

- Release Tokens:
  - Button: “Release Tokens”
  - Confirmation modal before execution

-------------------------------------
👥 ADMIN MANAGEMENT
-------------------------------------

- Add Admin (input wallet address)
- Remove Admin
- List of current admins

UI:
- Admin cards with address + remove button

-------------------------------------
🏦 TREASURY (MULTISIG SYSTEM)
-------------------------------------

SECTION 1: Create Withdraw Request

Fields:
- Token Address
- Amount
- Recipient Address
- Purpose (text input)

Button:
- “Create Request”

-------------------------------------

SECTION 2: Requests List

Each request card shows:
- Request ID
- Token
- Amount
- Recipient
- Purpose
- Created timestamp
- Approval count (e.g. 2 / 3)
- Status:
  - Pending
  - Approved
  - Executed

-------------------------------------

SECTION 3: Actions

- Approve Button (visible to signers only)
- Execute Button (visible to owner only if approvals met)

-------------------------------------

SECTION 4: Approval Tracker

For each request:
- List all signers
- Show:
  - Approved ✅
  - Pending ⏳

-------------------------------------
📜 ACTIVITY LOG / EVENTS
-------------------------------------

Display recent contract events:

- TokensPurchased
- TokensClaimed
- TierPurchase
- RequestCreated
- Approved
- Executed

UI:
- Table or timeline
- Filter by event type

-------------------------------------
🧪 DEBUG PANEL (DEV MODE)
-------------------------------------

Optional section:

Display:
- Current timestamp
- Sale start/end
- isSaleActive
- totalSold
- totalUsdtCollected

-------------------------------------
⚠️ SECURITY UX
-------------------------------------

Always show warnings:

- “All actions require wallet confirmation”
- “Transactions are irreversible”
- “Never share private keys”

Add:
- Confirmation modals for critical actions:
  - Release tokens
  - Withdraw execution
  - Remove admin

-------------------------------------
🎨 UI STYLE
-------------------------------------

- Glass cards with blur
- Neon glow buttons
- Clean spacing (8pt grid)
- Rounded corners (16–24px)
- Subtle animations

-------------------------------------
📱 RESPONSIVE DESIGN
-------------------------------------

Mobile layout:
- Collapsible sections
- Bottom navigation:
  - Dashboard
  - Controls
  - Treasury
  - Logs

-------------------------------------
⚙️ TECH HANDOFF NOTES
-------------------------------------

- Connect using MetaMask / WalletConnect
- Use contract functions:
  - setBuyPaused()
  - setClaimPaused()
  - setSaleTimes()
  - release()
  - createWithdrawRequest()
  - approveWithdraw()
  - withdrawToken()

-------------------------------------