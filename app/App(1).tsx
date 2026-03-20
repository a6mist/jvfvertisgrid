import { RouterProvider } from "react-router";
import { router } from "./routes";

/**
 * wearelegend IDO Admin Panel
 * 
 * A modern Web3 admin interface for managing IDO (Initial DEX Offering) operations.
 * 
 * Features:
 * - Dashboard: Real-time stats, progress tracking, countdown timer
 * - Controls: Pause/unpause buying/claiming, sale time management, token release, admin management
 * - Treasury: Multisig withdrawal system (3/3 approvals required)
 * - Logs: Activity timeline with event filtering
 * - Debug Panel: Development mode data viewer
 * 
 * Design: Dark theme (#0B0F1A) with neon purple (#6C5CE7) and aqua (#00F5D4) accents
 * UI Style: Glassmorphism with glow effects and smooth animations
 * 
 * For Web3 Integration:
 * Replace mock data with ethers.js/wagmi hooks to interact with smart contract
 * Contract functions to implement:
 * - setBuyPaused(), setClaimPaused()
 * - setSaleTimes()
 * - release()
 * - createWithdrawRequest()
 * - approveWithdraw()
 * - withdrawToken()
 */

export default function App() {
  return <RouterProvider router={router} />;
}