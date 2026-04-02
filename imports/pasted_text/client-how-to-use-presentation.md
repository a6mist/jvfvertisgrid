# WeAreLegend Client Guide
## Donation Intake and Crypto Release Flow

---

## Slide 1: Title
**WeAreLegend Charity Operations Flow**  
Client Walkthrough: Receive in USD, Release in USDT (TRC20)

Presenter notes:
- Explain this is the operational model for intake and payout.
- Keep language simple for non-technical stakeholders.

---

## Slide 2: Scope (Client Setup)
1. Receiving Model: Donation/Charity via **2D Ink** (not merchant link)
2. Receiving Currency: **USD**
3. Releasing Wallet Type: **Crypto Wallet - Trust Wallet (TRC20)**
4. Releasing Currency: **USDT (TRC20)**

Presenter notes:
- This slide confirms the agreed business configuration.

---

## Slide 3: End-to-End Flow
1. Donor pays in USD through donation intake channel (2D Ink).
2. Team validates successful receipt of USD.
3. Release request is prepared for beneficiary wallet.
4. USDT (TRC20) is sent to beneficiary Trust Wallet.
5. Transaction hash is recorded as payout proof.

Presenter notes:
- Emphasize that intake and payout are different rails/currencies.

---

## Slide 4: Receiving Side (USD via 2D Ink)
- Use donation/charity intake flow only.
- Do not use merchant checkout link.
- Confirm payer details and amount in USD.
- Mark transaction as received before release action.

Presenter notes:
- Intake must be finalized before creating payout request.

---

## Slide 5: Release Side (USDT TRC20)
- Network: **TRC20 (Tron)**
- Wallet destination: **Trust Wallet (TRC20 USDT address)**
- Asset: **USDT**
- Confirm destination address format and owner before sending.

Presenter notes:
- Never send TRC20 USDT to non-TRC20 addresses.

---

## Slide 6: Operational Checklist Before Release
- USD intake status is confirmed.
- Beneficiary wallet address is verified twice.
- Wallet is confirmed to support USDT TRC20.
- Payout amount is reviewed and approved.
- Internal reference ID is attached.

Presenter notes:
- Double verification prevents irreversible mis-sends.

---

## Slide 7: Release Execution Steps
1. Copy beneficiary Trust Wallet TRC20 address.
2. Paste and verify first 6 and last 6 characters.
3. Enter USDT amount.
4. Send on TRC20 network.
5. Save tx hash and timestamp.

Presenter notes:
- Read back address and amount before final submit.

---

## Slide 8: Post-Release Proof
- Provide beneficiary with:
	- Payout amount
	- Network (TRC20)
	- Transaction hash
	- Time sent
- Keep internal release log for audit.

Presenter notes:
- Tx hash is the official proof of payout.

---

## Slide 9: Common Mistakes to Avoid
- Sending to wrong network address.
- Releasing before USD intake is confirmed.
- Typing wallet address manually (copy-paste only).
- Missing transaction reference and proof logging.

Presenter notes:
- Most payout incidents come from avoidable manual errors.

---

## Slide 10: Security and Control
- Never share seed phrase/private keys.
- Use dedicated operations wallet access controls.
- Restrict who can approve and send payouts.
- Review suspicious or unusual payout requests manually.

Presenter notes:
- Keep least-privilege access for payout operations.

---

## Slide 11: Escalation Template
When raising support/internal escalation, include:
- Intake reference ID
- USD amount received
- Beneficiary wallet address
- USDT amount released
- TRC20 tx hash
- Error screenshot (if failed)

Presenter notes:
- Complete details reduce resolution time.

---

## Slide 12: Closing
**Operational model confirmed:**  
Receive in USD (2D Ink donation flow) -> Release in USDT TRC20 (Trust Wallet)

Questions?

---

## Appendix: One-Minute Quick Reference
- Receive donation in USD via 2D Ink.
- Validate receipt.
- Release USDT on TRC20 to Trust Wallet.
- Save and share tx hash proof.
