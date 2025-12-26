# Review System Design

## Overview

A three-sided review system that creates accountability in the recruiting process. Students review employers after interviews, career center admins review employer partnerships, and aggregate scores become public—creating pressure for employers to treat candidates well.

This is the platform's competitive moat against Handshake.

## Key Decisions

- **Who reviews:** Students + Career Center Admins review employers
- **Visibility:** Tiered—aggregate scores public, detailed reviews for logged-in users, analytics for career centers
- **Timing:** Students can review 7 days after interview OR when application closes

---

## Data Model

### New Models

```prisma
model University {
  id        String   @id @default(cuid())
  name      String
  domain    String   @unique  // e.g. "nyu.edu"
  createdAt DateTime @default(now())

  users     User[]
}

model Review {
  id            String      @id @default(cuid())
  reviewer      User        @relation(fields: [reviewerId], references: [id])
  reviewerId    String
  company       Company     @relation(fields: [companyId], references: [id])
  companyId     String
  application   Application @relation(fields: [applicationId], references: [id])
  applicationId String      @unique  // One review per application

  // Ratings (1-5 scale)
  responsiveness      Int
  transparency        Int
  professionalism     Int
  interviewExperience Int
  overall             Int

  wasGhosted Boolean
  comment    String?

  createdAt DateTime @default(now())
}

model CareerCenterReview {
  id         String   @id @default(cuid())
  reviewer   User     @relation(fields: [reviewerId], references: [id])
  reviewerId String
  company    Company  @relation(fields: [companyId], references: [id])
  companyId  String

  // Ratings (1-5 scale)
  studentTreatment    Int
  feedbackTimeliness  Int
  hiringSuccess       Int
  wouldRecommend      Int

  comment   String?
  createdAt DateTime @default(now())

  @@unique([reviewerId, companyId])  // One review per admin per company
}
```

### User Changes

```prisma
enum Role {
  STUDENT
  EMPLOYER
  ADMIN      // NEW - Career center staff
}

model User {
  // ... existing fields
  university   University? @relation(fields: [universityId], references: [id])
  universityId String?

  reviews             Review[]
  careerCenterReviews CareerCenterReview[]
}
```

---

## Student Review Flow

### When Reviews Unlock

A student can leave a review when:
1. Interview status is COMPLETED, OR
2. 7 days have passed since the interview date

This captures both completed interviews and ghosting scenarios.

### Review Form

**Ratings (all required, 1-5 stars):**
- Responsiveness: "Did they communicate promptly?"
- Transparency: "Were they clear about role, salary, timeline?"
- Professionalism: "Respectful and prepared?"
- Interview Experience: "Fair process, relevant questions?"
- Overall: "Overall impression"

**Additional fields:**
- Ghosted checkbox (required): "I was ghosted (no response after interview)"
- Comment (optional): Free text

### Rules

- One review per application
- Cannot edit after 48 hours (prevents retaliation pressure)
- Review tied to specific application for authenticity

---

## Career Center Admin Flow

### Admin Registration

- Register at `/register` and select "Career Center Staff"
- Must use .edu email matching a registered university
- Auto-approve based on email domain match

### Admin Dashboard (`/admin`)

Shows:
- Number of employers recruiting from their university
- Employers awaiting review
- Employers flagged for high ghosting rates
- Employer rankings table with student ratings and ghost rates

### Admin Review Form

**Ratings (1-5 stars):**
- Student Treatment: "Do they treat our students well?"
- Feedback Timeliness: "Provide timely responses?"
- Hiring Follow-through: "Do they actually hire?"
- Would Recommend: "Recommend to peer institutions?"

**Notes:** Internal comments (visible only to admins)

---

## Public Display

### Job Listings

Each job card shows company rating badge:
```
Company Name ★ 4.2 (23 reviews)
```

Companies with >25% ghosting rate show warning indicator to logged-in users.

### Company Profile Page (`/companies/[id]`)

Public:
- Overall rating and review count
- Ratings breakdown by dimension
- Ghosting rate

Logged-in users only:
- Individual review comments
- Ghosted flags on reviews

### Employer Self-View (`/employer/reviews`)

Employers see their own ratings and reviews to understand how to improve.

---

## Routes

### Pages
- `/companies/[id]` - Public company profile with ratings
- `/reviews` - Student's pending & submitted reviews
- `/admin` - Career center dashboard (ADMIN only)
- `/admin/reviews` - Admin's employer reviews
- `/employer/reviews` - Employer sees their own ratings

### API
- `GET/POST /api/reviews` - Student reviews
- `GET/POST /api/admin/reviews` - Career center reviews
- `GET /api/companies/[id]` - Company profile with aggregate ratings
- `GET /api/admin/employers` - Employer analytics for career center

---

## Build Order

1. Schema changes + University model + ADMIN role
2. Student review submission flow
3. Company profile page with ratings
4. Rating badges on job listings
5. Career center admin dashboard
6. Admin review flow
7. Employer self-view of ratings
