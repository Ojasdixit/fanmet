# FanMeet Critical Issues & Fixes

## Issues from User Feedback (June 12, 2026)

### 1. Ghost Payments — Bids Too Close to Deadline
**Problem**: Users can place bids right before the deadline (e.g., 2:44 for a 2:45 close). Payment gets deducted but the bid isn't counted because the event finalizes at the deadline.  
**Fix**: Block bidding **1 minute before** `bidding_closes_at`. Frontend validation + backend enforcement.

### 2. Bid Visibility for Unauthenticated Users
**Problem**: Bids table RLS only allows authenticated users to read. Unauthenticated users see empty bid history.  
**Fix**: Show a prominent "Sign up as a fan to see bids" message on the event page for logged-out users.

### 3. Missing Bidding Countdown Timer
**Problem**: No visual countdown showing how much time is left to bid.  
**Fix**: Add a live countdown timer on the event detail page.

### 4. Partial Refund Bug (CRITICAL)
**Problem**: User paid ₹100 (base) + ₹150 (increment) = ₹250 total. Only ₹150 was refunded. The first ₹100 payment was missed.  
**Root Cause**: `refundLosingBidders` in `meeting-lifecycle-cron` uses `.maybeSingle()` to find payments, which only returns ONE payment per bid. With incremental bidding, a user has MULTIPLE `bid_payments` rows.  
**Fix**: Fetch ALL payments by `event_id + fan_id` and refund each one. Sum total refund and update bid + send one notification.

### 5. Deploy Edge Function
**Task**: Deploy the updated `meeting-lifecycle-cron` after all fixes.

---

## Status Tracker

| # | Issue | Status |
|---|-------|--------|
| 1 | 1-min bid cutoff | **DONE** |
| 2 | Sign up to see bids | **DONE** |
| 3 | Countdown timer | **DONE** |
| 4 | Full refund for all payments | **DONE** |
| 5 | Deploy edge function | **DONE** |
