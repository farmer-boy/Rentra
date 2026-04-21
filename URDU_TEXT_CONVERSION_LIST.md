# Urdu Text Conversion List - Rentra Project

**Comprehensive list of all Urdu text in the codebase that needs to be converted to English.**

---

## BACKEND - Authentication Service (Auth)

### File: [apps/backend/src/modules/auth/auth.service.ts](apps/backend/src/modules/auth/auth.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 26 | `Yeh email pehle se registered hai` | Email already registered error | `This email is already registered` |
| 33 | `Yeh phone number pehle se registered hai` | Phone already registered error | `This phone number is already registered` |
| 40 | `Yeh CNIC pehle se registered hai` | CNIC already registered error | `This CNIC is already registered` |
| 59 | `Registration successful! Rentra mein khush amdeed 🎉` | Registration success message | `Registration successful! Welcome to Rentra 🎉` |
| 71 | `Email ya password galat hai` | Invalid credentials error | `Invalid email or password` |
| 76 | `Aapka account suspend kar diya gaya hai` | Account suspended error | `Your account has been suspended` |
| 82 | `Email ya password galat hai` | Invalid credentials error (login) | `Invalid email or password` |
| 88 | `Login successful! Welcome back 👋` | Login success message | `Login successful! Welcome back 👋` (Keep English part) |
| 111 | `User nahi mila` | User not found error | `User not found` |

---

## BACKEND - Users Module

### File: [apps/backend/src/modules/users/users.service.ts](apps/backend/src/modules/users/users.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 90 | `User nahi mila` | User not found error | `User not found` |
| 115 | `User nahi mila` | User not found error | `User not found` |
| 177 | `User nahi mila` | User not found error | `User not found` |
| 198 | `User nahi mila` | User not found error | `User not found` |
| 217 | `User nahi mila` | User not found error | `User not found` |
| 236 | `User nahi mila` | User not found error | `User not found` |
| 255 | `User nahi mila` | User not found error | `User not found` |

### File: [apps/backend/src/modules/users/users.controller.ts](apps/backend/src/modules/users/users.controller.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 31 | `User create ho gaya` | API response message | `User created successfully` |
| 43 | `Tamam users list` | API response message | `All users list` or `Users list retrieved` |
| 56 | `User profile` | API response message | `User profile` (Keep as is, it's simple) |
| 66 | `User update ho gaya` | API response message | `User updated successfully` |
| 76 | `User update ho gaya` | API response message | `User updated successfully` |
| 91 | `Trust score update ho gaya` | API response message | `Trust score updated successfully` |
| 103 | `User suspend kar diya gaya` | API response message | `User suspended successfully` |
| 115 | `User unsuspend kar diya gaya` | API response message | `User unsuspended successfully` |
| 127 | `User verify kar diya gaya` | API response message | `User verified successfully` |
| 137 | `User delete kar diya gaya` | API response message | `User deleted successfully` |

---

## BACKEND - Reviews Module

### File: [apps/backend/src/modules/reviews/reviews.service.ts](apps/backend/src/modules/reviews/reviews.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 44 | `Review nahi mila` | Review not found error | `Review not found` |
| 70 | `Review delete nahi kar sakte` | Cannot delete review error | `Cannot delete this review` |

### File: [apps/backend/src/modules/reviews/reviews.controller.ts](apps/backend/src/modules/reviews/reviews.controller.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 35 | `Review post ho gaya` | API response message | `Review posted successfully` |
| 44 | `Tamam reviews` | API response message | `All reviews` or `Reviews list retrieved` |
| 54 | `Review details` | API response message | `Review details` (Keep as is) |
| 64 | `Listing ke reviews` | API response message | `Listing reviews` or `Reviews for this listing` |
| 77 | `Review delete kar diya` | API response message | `Review deleted successfully` |

---

## BACKEND - Agreements Module

### File: [apps/backend/src/modules/agreements/agreements.service.ts](apps/backend/src/modules/agreements/agreements.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 53 | `Agreement nahi mila` | Agreement not found error | `Agreement not found` |
| 59 | `Agreement nahi mila` | Agreement not found error | `Agreement not found` |
| 69 | `Agreement nahi mila` | Agreement not found error | `Agreement not found` |
| 79 | `Agreement nahi mila` | Agreement not found error | `Agreement not found` |

### File: [apps/backend/src/modules/agreements/agreements.controller.ts](apps/backend/src/modules/agreements/agreements.controller.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 44 | `Agreement create ho gaya` | API response message | `Agreement created successfully` |
| 55 | `Tamam agreements` | API response message | `All agreements` or `Agreements list retrieved` |
| 67 | `Agreement details` | API response message | `Agreement details` (Keep as is) |
| 78 | `Agreement approve ho gaya` | API response message | `Agreement approved successfully` |
| 89 | `Agreement reject kar diya` | API response message | `Agreement rejected` |
| 100 | `Agreement terminate kar diya` | API response message | `Agreement terminated successfully` |

---

## BACKEND - Payments Module

### File: [apps/backend/src/modules/payments/payments.service.ts](apps/backend/src/modules/payments/payments.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 43 | `Payment nahi mila` | Payment not found error | `Payment not found` |
| 49 | `Payment nahi mila` | Payment not found error | `Payment not found` |
| 59 | `Payment nahi mila` | Payment not found error | `Payment not found` |

### File: [apps/backend/src/modules/payments/payments.controller.ts](apps/backend/src/modules/payments/payments.controller.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 37 | `Payment create ho gaya` | API response message | `Payment created successfully` |
| 71 | `Payment complete ho gaya` | API response message | `Payment completed successfully` |
| 82 | `Payment fail ho gaya` | API response message | `Payment failed` |

---

## BACKEND - Listings Module

### File: [apps/backend/src/modules/listings/listings.service.ts](apps/backend/src/modules/listings/listings.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 48 | `Listing nahi mila` | Listing not found error | `Listing not found` |
| 57 | `Listing update nahi kar sakte` | Cannot update listing error | `Cannot update this listing` |
| 69 | `Listing delete nahi kar sakte` | Cannot delete listing error | `Cannot delete this listing` |

### File: [apps/backend/src/modules/listings/listings.controller.ts](apps/backend/src/modules/listings/listings.controller.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 33 | `Listing publish ho gaya` | API response message | `Listing published successfully` |
| 73 | `Listing update ho gaya` | API response message | `Listing updated successfully` |
| 87 | `Listing delete ho gaya` | API response message | `Listing deleted successfully` |

---

## BACKEND - Disputes Module

### File: [apps/backend/src/modules/disputes/disputes.service.ts](apps/backend/src/modules/disputes/disputes.service.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 55 | `Dispute nahi mila` | Dispute not found error | `Dispute not found` |
| 61 | `Dispute nahi mila` | Dispute not found error | `Dispute not found` |
| 71 | `Dispute nahi mila` | Dispute not found error | `Dispute not found` |

---

## BACKEND - Guards & Middleware

### File: [apps/backend/src/common/guards/roles.guard.ts](apps/backend/src/common/guards/roles.guard.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 31 | `Aapke paas yeh karne ki permission nahi hai` | Permission denied error | `You do not have permission to perform this action` |

---

## BACKEND - Main Application Setup

### File: [apps/backend/src/main.ts](apps/backend/src/main.ts)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 62 | `Pakistan ka pehla AI-powered transparent rental platform API` | Swagger API description | `Pakistan's first AI-powered transparent rental platform API` |
| 68 | `🚀 Rentra Backend chal raha hai!` | Console startup message | `🚀 Rentra Backend is running!` |

---

## FRONTEND - Tenant Pages

### File: [apps/web/src/pages/tenant/Disputes.tsx](apps/web/src/pages/tenant/Disputes.tsx)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 11 | `Jhagra app ke andar solve karo — thane jaane ki zaroorat nahi` | Page subtitle/description | `Resolve disputes within the app — no need to go to court` |
| 21 | `Security Deposit Nahi Mili` | Dispute title | `Security Deposit Not Returned` |
| 42 | `+ Naya Dispute File Karo` | Button text | `+ File New Dispute` |
| 51 | `Maine ghar 31 Dec ko khali kar diya tha. Aapko deposit 2 hafte mein deni thi agreement ke mutabiq.` | Chat message from tenant | `I vacated the property on 31 Dec. You were supposed to return the deposit within 2 weeks as per the agreement.` |
| 54 | `Ghar mein damage tha. Maine repair karwaya — Rs 15,000 kharch hua.` | Chat message from landlord | `There was damage to the property. I got it repaired — it cost Rs 15,000.` |
| 57 | `Damage ki koi proof nahi thi agreement mein. Main puri deposit maangta hon.` | Chat message from tenant | `There was no mention of damage in the agreement. I'm demanding the full deposit.` |
| 60 | `🤖 Platform Mediator: Dono parties se evidence maanga ja raha hai — 7 din mein submit karo` | Platform mediator message | `🤖 Platform Mediator: Evidence is being requested from both parties — submit within 7 days` |

### File: [apps/web/src/pages/tenant/Profile.tsx](apps/web/src/pages/tenant/Profile.tsx)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 11 | `Apni details aur trust score dekho` | Page subtitle | `View your details and trust score` |

### File: [apps/web/src/pages/tenant/BrowseListings.tsx](apps/web/src/pages/tenant/BrowseListings.tsx)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 41 | `Lahore mein available kiraye ke ghar` | Page subtitle | `Available rental properties in Lahore` |
| 48 | `🔍 Area ya property search karo...` | Search input placeholder | `🔍 Search area or property...` |
| 53 | `Sab` | Filter button | `All` |

### File: [apps/web/src/pages/tenant/TrustScores.tsx](apps/web/src/pages/tenant/TrustScores.tsx)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 11 | `Tenant aur landlord dono ke AI-generated trust scores` | Page subtitle | `AI-generated trust scores for tenants and landlords` |

### File: [apps/web/src/pages/tenant/AIDetector.tsx](apps/web/src/pages/tenant/AIDetector.tsx)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 11 | `Machine learning se fraudulent listings pakadta hai` | Page subtitle | `Machine learning detects fraudulent listings` |

---

## FRONTEND - Admin Pages

### File: [apps/web/src/pages/admin/AdminDashboard.tsx](apps/web/src/pages/admin/AdminDashboard.tsx)

| Line | Current Urdu Text | Context | Suggested English |
|------|------------------|---------|------------------|
| 12 | `Platform moderation, users, aur analytics` | Page subtitle | `Platform moderation, users, and analytics` |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Backend Error Messages | 46 |
| Backend API Response Messages | 26 |
| Frontend User-Facing Text | 13 |
| **Total Urdu Text Instances** | **85** |

---

## Priority Order for Conversion

### High Priority (User-Facing Text)
- Dispute chat messages and complaint titles
- User error messages on login/registration
- Page titles and descriptions visible in UI
- Button labels and form placeholders
- Platform mediator messages

### Medium Priority (API Responses)
- API response message text
- Toast notification messages
- Validation error messages

### Low Priority (Internal/Console)
- Swagger documentation strings
- Console log messages
- Code comments (if any in Urdu)

---

## Notes

1. **Naming Convention**: The Urdu expressions like "gaya", "kar diya", "nahi mila" are mixed with English in API responses. These should be standardized to proper English.

2. **User Experience**: High-priority items should be converted first as they directly impact user experience.

3. **Consistency**: Ensure consistent terminology across similar message types (e.g., all "not found" errors use the same English phrase).

4. **Formal vs. Casual**: Current Urdu text is conversational (Hindustani/Urdu mix). Consider formal English for professional tone.

5. **File Pattern**: Most Urdu text appears in:
   - Backend: `/src/modules/*/` service and controller files
   - Frontend: `/src/pages/*/` component files
