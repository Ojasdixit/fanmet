# Fan Meet Feature Implementation Plan

## Overview
This document outlines the implementation plan for 5 key features requested by the user.

## Feature 1: Show Creator's Profile Photo on Event Page
**Status**: Ready to implement

### Changes Required:
1. **Database**: Add `profile_photo_url` column to `profiles` table (if not exists)
2. **Context**: Update `CreatorProfileContext.tsx` to fetch and store profile photos
3. **Event Page**: Display creator's profile photo on `EventDetailPage.tsx`

### Implementation:
- Modify the profiles query to include `profile_photo_url`
- Update the `CreatorProfile` interface to include `profilePhotoUrl?: string`
- Add a circular avatar component showing the creator's photo on the event detail page

---

## Feature 2: Show Bidding History (Last 5 Bidders)
**Status**: Ready to implement

### Changes Required:
1. **EventContext**: Add function to fetch bid history for an event
2. **Event Page**: Display recent bid history in real-time
3. **Database Query**: Fetch last 5 bids with fan information

### Implementation:
- Create `getBidHistory(eventId: string)` function in EventContext
- Add real-time subscription to bids table for the event
- Display bidding history card showing:
  - Fan username/display name
  - B id amount
  - Time of bid
  - "Current leader" badge for highest bid

---

## Feature 3: Bidding Window Selector
**Status**: Skipped - User will provide alternative later

---

## Feature 4: Direct Payment Integration (No Wallet Pre-funding Required)
**Status**: Ready to implement

### Current Flow:
1. User wants to bid ₹500
2. Check wallet balance
3. If insufficient, redirect to wallet page
4. User adds funds
5. User returns to event page
6. User places bid

### New Flow:
1. User wants to bid ₹500
2. Check wallet balance
3. If insufficient:
   a. Calculate shortfall (e.g., have ₹200, need ₹300 more)
   b. Open Razorpay for the shortfall amount
   c. On successful payment:
      - Add ₹300 to wallet
      - Automatically place the ₹500 bid
      - Record both transactions (topup + bid)
4. If sufficient, place bid normally

### Implementation:
- Modify `placeBid` function in EventContext
- Create `placeBidWithDirectPayment` function that:
  - Checks wallet balance
  - If insufficient, calculates shortfall
  - Triggers Razorpay payment
  - On success, adds funds AND places bid in a single transaction
- Update EventDetailPage to use this new flow

---

## Feature 5: Cumulative Bid Total Display
**Status**: Ready to implement

### Changes Required:
1. **EventContext**: Track user's total bids for each event
2. **UI**: Show cumulative total when user enters a bid amount

### Current Behavior:
- User previously bid ₹50
- User enters ₹50 in the input
- Bid of ₹50 is placed (WRONG)

### New Behavior:
- User previously bid ₹50
- User enters ₹50 in the input
- UI shows: "Your total bid will be: ₹100"
- Bid of ₹100 is placed  (CORRECT)

### Implementation:
- Fetch user's current bid for the event
- When user types an amount, calculate: `userCurrentBid + newAmount`
- Display both the increment and the total prominently
- Place bid with the cumulative total

---

## Database Schema Updates Needed

```sql
-- Add profile photo column if not exists
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;
```

## File Changes Summary

### Files to Modify:
1. `apps/web/src/contexts/CreatorProfileContext.tsx` - Add profile photo support
2. `apps/web/src/contexts/EventContext.tsx` - Add bid history, cumulative bids, direct payment
3. `apps/web/src/pages/events/EventDetailPage.tsx` - Display all new features
4. `apps/web/src/pages/fan/FanWallet.tsx` - Extract Razorpay logic for reuse

### New Files to Create:
1. `apps/web/src/utils/razorpayHelpers.ts` - Shared Razorpay payment logic
2. `apps/web/src/components/BidHistoryCard.tsx` - Bidding history component

---

## Implementation Order:
1. Feature 1 (Profile Photos) - Simple, no complex logic
2. Feature 5 (Cumulative Bids) - Updates existing bid flow
3. Feature 2 (Bid History) - Requires real-time subscriptions
4. Feature 4 (Direct Payment) - Most complex, combines multiple systems
