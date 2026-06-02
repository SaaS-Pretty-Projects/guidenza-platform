# Guidenza — Course Commerce & Learning Features

**Date:** 2026-06-02
**Status:** Draft

## Overview

Add monetization (SafePay), deep learning features (quizzes, enhanced progress, certificates), and community features (discussions, messaging, leaderboards) to Guidenza — a React 19 + Firebase learning management platform.

The rollout is split into 3 independent phases, each deployable on its own.

---

## Phase 1 — Course Commerce (SafePay)

### Goal

Sell courses individually with lifetime access via SafePay payment gateway.

### Data Model

**New collection: `orders/{orderId}`**

| Field | Type | Description |
|---|---|---|
| userId | string | Buyer's Firebase UID |
| courseId | string | Purchased course ID |
| amount | number | Price paid |
| currency | string | "PKR" |
| status | string | "pending" | "confirmed" | "refunded" |
| safePayTransactionId | string | SafePay transaction reference |
| createdAt | Timestamp | Order timestamp |

**User doc addition (`users/{uid}`)**

Add `purchasedCourses: string[]` — list of course IDs the user has paid for.

### Checkout Flow

1. User clicks "Enroll for $X" on course preview
2. App creates a pending order in Firestore
3. User is redirected to SafePay checkout (configurable: embedded iframe or redirect)
4. SafePay processes payment, POSTs to a webhook URL
5. Webhook handler (Firebase Cloud Function or external endpoint):
   - Validates the transaction
   - Updates order status to "confirmed"
   - Adds course ID to user's `purchasedCourses`
   - Redirects user back to course page

### Content Gating

- **Non-purchasers:** See course description, module list, price, reviews, and 1 free preview module
- **Purchasers:** Full access to all modules
- **Firestore security rules:** Check `purchasedCourses` array before allowing reads on full module content

### Key Components

- `CheckoutButton` — initiates payment flow (replaces current free enroll button)
- `CourseContent` — gated component that renders modules only if purchased
- Webhook handler — processes SafePay confirmation

---

## Phase 2 — Deep Learning Experience

### Goal

Add per-module quizzes, enhanced progress tracking, and polished certificates.

### Data Model

**New subcollection: `courses/{courseId}/modules/{moduleId}/quizzes/{quizId}`**

| Field | Type | Description |
|---|---|---|
| title | string | e.g. "Module 1 Quiz" |
| passingScore | number | Percentage to pass (e.g., 70) |
| maxAttempts | number | Max attempts allowed (0 = unlimited) |
| questions | array | See below |

Question shape:
```
{ id: string, questionText: string, options: [string], correctAnswer: number }
```

**New subcollection: `users/{uid}/quizAttempts/{attemptId}`**

| Field | Type | Description |
|---|---|---|
| courseId | string | Course ID |
| moduleId | string | Module ID |
| quizId | string | Quiz ID |
| score | number | Percentage score |
| passed | boolean | Did they pass? |
| answers | array | `[{ questionId, selectedAnswer, correct }]` |
| completedAt | Timestamp | When submitted |

### Enhanced Progress

- Module completion now requires: "Mark done" + quiz passed
- Course progress % factors in both module completion and quiz scores
- Course completion: all modules done + all quizzes passed

### Certificates

- Already partially implemented (jsPDF, auto-creation on module completion)
- Polish: add course duration, instructor signature line, quiz score summary
- Only issued when all modules done AND all quizzes passed

### Key Components

- `QuizViewer` — renders quiz questions, handles submission, shows results
- `QuizAttemptHistory` — shows past attempts for a quiz
- `QuizEditor` — instructor UI to create/edit quizzes (in InstructorDashboard)
- `ProgressBar` — enhanced to show quiz/passing state

---

## Phase 3 — Community & Engagement

### Goal

Course discussions, direct messaging, leaderboards, review polish.

### Data Model

**New subcollection: `courses/{courseId}/discussions/{discussionId}`**

| Field | Type |
|---|---|
| title, body | string |
| authorId, authorName | string |
| tags | string[] |
| createdAt, lastActivityAt | Timestamp |

**Replies:** `discussions/{discussionId}/replies/{replyId}` — body, authorId, authorName, createdAt

**New collection: `conversations/{conversationId}`**

| Field | Type |
|---|---|
| participants | [string, string] |
| lastMessage | string |
| lastMessageAt | Timestamp |

**Messages:** `conversations/{conversationId}/messages/{messageId}` — fromUserId, body, createdAt

### Features

- **Discussions:** Per-course forum thread with threaded replies. Instructors can pin/sticky.
- **Messaging:** Simple inbox. Student can DM instructor of any course they're enrolled in.
- **Leaderboards:** Computed from existing data — top by learning time, courses completed, streak length. Shown on dashboard.
- **Review Polish:** Add verified-purchase badge, instructor reply capability, helpful vote count.

### Key Components

- `DiscussionBoard` — forum thread list per course
- `DiscussionThread` — single thread with replies
- `Inbox` / `ConversationView` — messaging UI
- `LeaderboardWidget` — dashboard section
- `ReviewCard` — enhanced with badges and replies

---

## Architecture Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Payment model | Redirect-based checkout | SafePay embed options vary; redirect is most reliable |
| Quiz storage | Subcollection under module | Clean data locality, easy to query per-module |
| Discussions | Subcollection under course | Course-scoped, easy Firestore rules |
| Messages | Top-level collection | Cross-course conversations need global scope |
| Content gating | Firestore security rules | No backend needed for read access control |
| Webhook | Cloud Function or external | To be decided (SafePay webhook requirements TBD) |

## Firestore Security Rules Impact

Each phase adds new rule assertions:

- **Phase 1:** Only purchasers can read module content; orders readable by owner
- **Phase 2:** Quiz answers readable by instructors; attempts writable by owner
- **Phase 3:** Discussions/messages readable by course participants

## Future Considerations

- Subscription model as a future phase
- Coupon/discount codes
- Bundled course purchases
- Gemini AI integration for quiz generation
