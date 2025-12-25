# Interview Scheduling & Video Conferencing Design

## Overview

Add interview scheduling and in-app video conferencing with AI-powered feedback to Launchpad.

## Core Features

1. **Interview Scheduling**: Employer proposes 2-3 time slots, candidate picks one
2. **In-app Video**: Daily.co embedded video rooms with automatic recording
3. **AI Coaching**: Transcribe calls with Whisper, analyze with Claude, provide feedback on clarity/pacing/engagement to both parties

---

## Data Model

### Interview
```prisma
model Interview {
  id            String           @id @default(cuid())
  application   Application      @relation(fields: [applicationId], references: [id], onDelete: Cascade)
  applicationId String
  scheduledAt   DateTime?        // Confirmed time (set when candidate picks)
  duration      Int              @default(30) // minutes: 30, 45, or 60
  status        InterviewStatus  @default(PENDING_RESPONSE)
  roomName      String?          // Daily.co room name
  roomUrl       String?          // Daily.co room URL
  recordingUrl  String?          // URL to recording for AI analysis
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  timeSlots     InterviewTimeSlot[]
  feedback      InterviewFeedback[]
}

enum InterviewStatus {
  PENDING_RESPONSE  // Waiting for candidate to pick time
  SCHEDULED         // Time confirmed, waiting for interview
  IN_PROGRESS       // Interview happening now
  COMPLETED         // Interview finished
  CANCELLED         // Cancelled by either party
}

model InterviewTimeSlot {
  id          String    @id @default(cuid())
  interview   Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  interviewId String
  startTime   DateTime
  selected    Boolean   @default(false)
}

model InterviewFeedback {
  id              String    @id @default(cuid())
  interview       Interview @relation(fields: [interviewId], references: [id], onDelete: Cascade)
  interviewId     String
  recipientId     String    // User ID who receives this feedback
  recipientRole   Role      // STUDENT or EMPLOYER
  clarityScore    Int?      // 1-10
  pacingScore     Int?      // 1-10
  engagementScore Int?      // 1-10
  suggestions     String?   // AI-generated improvement tips
  createdAt       DateTime  @default(now())
}
```

### Update Application model
```prisma
model Application {
  // ... existing fields ...
  interviews Interview[]
}
```

---

## User Flows

### Employer Side
1. Views applicant → clicks "Schedule Interview"
2. Picks duration (30/45/60 min) and proposes 2-3 time slots
3. System sends notification to candidate
4. Once candidate picks, employer sees confirmed time on their dashboard
5. At interview time, clicks "Join Interview" → enters video room
6. After call ends, receives AI feedback

### Candidate Side
1. Sees interview invite on their dashboard/notifications
2. Picks one of the offered time slots
3. Confirmed interview appears in their schedule
4. At interview time, clicks "Join Interview" → enters video room
5. After call ends, receives AI feedback

### Video Room
- Both parties join same Daily.co room
- Recording starts automatically (with consent banner)
- Either party can end the call
- Recording sent to AI for analysis → feedback generated

---

## Pages

| Route | Description |
|-------|-------------|
| `/employer/interviews` | Employer's list of scheduled interviews |
| `/interviews` | Candidate's interview schedule |
| `/interviews/[id]` | Video room page (shared by both roles) |
| `/interviews/[id]/feedback` | View AI feedback after interview |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/interviews` | Create interview with time slots (employer) |
| GET | `/api/interviews` | List interviews for current user |
| GET | `/api/interviews/[id]` | Get interview details |
| PUT | `/api/interviews/[id]/select-slot` | Candidate picks a time slot |
| POST | `/api/interviews/[id]/room` | Get or create Daily.co room |
| PUT | `/api/interviews/[id]/status` | Update interview status |
| POST | `/api/webhooks/daily` | Handle Daily.co webhooks (recording ready) |
| POST | `/api/interviews/[id]/analyze` | Trigger AI analysis of recording |

---

## External Services

### Daily.co (Video)
- Free tier: 10,000 participant minutes/month
- React SDK for embedding video
- Built-in recording
- Webhook for recording completion
- **Env var**: `DAILY_API_KEY`

### OpenAI Whisper (Transcription)
- ~$0.006 per minute of audio
- Converts recording to text for AI analysis
- **Env var**: `OPENAI_API_KEY`

### Claude/Anthropic (AI Feedback)
- Analyzes transcript
- Generates feedback on clarity, pacing, engagement
- Provides improvement suggestions
- **Env var**: `ANTHROPIC_API_KEY`

---

## AI Feedback Prompt (Draft)

```
You are an interview coach analyzing a recorded interview.

Participants:
- Interviewer (employer): [name]
- Candidate (student): [name]

Transcript:
[transcript]

For each participant, provide:
1. Clarity score (1-10): How clear and understandable was their communication?
2. Pacing score (1-10): Was their speaking pace appropriate?
3. Engagement score (1-10): Did they seem engaged and attentive?
4. 2-3 specific suggestions for improvement

Format as JSON:
{
  "interviewer": {
    "clarityScore": X,
    "pacingScore": X,
    "engagementScore": X,
    "suggestions": "..."
  },
  "candidate": {
    "clarityScore": X,
    "pacingScore": X,
    "engagementScore": X,
    "suggestions": "..."
  }
}
```

---

## Implementation Order

1. **Database**: Add Interview, InterviewTimeSlot, InterviewFeedback models
2. **Scheduling API**: Create/list interviews, select time slots
3. **Employer UI**: Schedule interview button, interview list
4. **Candidate UI**: Interview invites, select time, interview list
5. **Daily.co Integration**: Create rooms, embed video player
6. **Video Room Page**: Join interview, recording consent
7. **Webhooks**: Handle recording completion
8. **AI Pipeline**: Transcribe → Analyze → Store feedback
9. **Feedback UI**: Display AI feedback to both parties

---

## Environment Variables Needed

```
DAILY_API_KEY=xxx
OPENAI_API_KEY=xxx
ANTHROPIC_API_KEY=xxx
```

Add to both local `.env` and Vercel environment variables.
