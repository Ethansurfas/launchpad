import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRecordings, getRecordingAccessLink } from "@/lib/daily";
import { transcribeAudio, analyzeInterview } from "@/lib/ai-feedback";

// POST /api/interviews/[id]/analyze - Trigger AI analysis of the interview
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
          include: {
            user: { select: { id: true, name: true } },
            job: {
              include: {
                company: {
                  include: { employees: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
        feedback: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check if feedback already exists
    if (interview.feedback.length > 0) {
      return NextResponse.json({ message: "Feedback already generated" });
    }

    // Get the recording from Daily.co
    if (!interview.roomName) {
      return NextResponse.json({ error: "No room found for this interview" }, { status: 400 });
    }

    const recordings = await getRecordings(interview.roomName);

    if (recordings.length === 0) {
      return NextResponse.json({ error: "No recording found" }, { status: 400 });
    }

    // Get the most recent recording
    const recording = recordings[0];
    const downloadUrl = await getRecordingAccessLink(recording.id);

    // Transcribe the recording
    console.log("Transcribing interview...");
    const transcript = await transcribeAudio(downloadUrl);

    // Save transcription
    await prisma.interview.update({
      where: { id },
      data: { transcription: transcript },
    });

    // Get participant names
    const candidateName = interview.application.user.name;
    const employerName = interview.application.job.company.employees[0]?.name || "Interviewer";

    // Analyze with Claude
    console.log("Analyzing with AI...");
    const analysis = await analyzeInterview(transcript, employerName, candidateName);

    // Save feedback for both participants
    const candidateFeedback = await prisma.interviewFeedback.create({
      data: {
        interviewId: id,
        recipientId: interview.application.user.id,
        recipientRole: "STUDENT",
        clarityScore: analysis.candidate.clarityScore,
        pacingScore: analysis.candidate.pacingScore,
        engagementScore: analysis.candidate.engagementScore,
        suggestions: analysis.candidate.suggestions,
      },
    });

    // Find employer ID
    const employerId = interview.application.job.company.employees[0]?.id;
    if (employerId) {
      await prisma.interviewFeedback.create({
        data: {
          interviewId: id,
          recipientId: employerId,
          recipientRole: "EMPLOYER",
          clarityScore: analysis.interviewer.clarityScore,
          pacingScore: analysis.interviewer.pacingScore,
          engagementScore: analysis.interviewer.engagementScore,
          suggestions: analysis.interviewer.suggestions,
        },
      });
    }

    return NextResponse.json({
      message: "Feedback generated successfully",
      feedback: candidateFeedback,
    });
  } catch (error) {
    console.error("Error analyzing interview:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `Analysis failed: ${message}` }, { status: 500 });
  }
}
