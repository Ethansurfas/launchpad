import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/interviews/[id] - Get interview details
export async function GET(
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
            user: { select: { id: true, name: true, email: true } },
            job: {
              include: {
                company: { select: { id: true, name: true, logo: true } },
              },
            },
          },
        },
        timeSlots: { orderBy: { startTime: "asc" } },
        feedback: {
          where: { recipientId: session.user.id },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check user has access (is the candidate or employer)
    const isCandidate = interview.application.userId === session.user.id;
    const isEmployer = session.user.role === "EMPLOYER";

    if (!isCandidate && !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Error fetching interview:", error);
    return NextResponse.json({ error: "Failed to fetch interview" }, { status: 500 });
  }
}

// PUT /api/interviews/[id] - Update interview (cancel, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { status } = data;

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Allow cancellation or completion
    if (status === "CANCELLED" || status === "COMPLETED") {
      const updated = await prisma.interview.update({
        where: { id },
        data: { status },
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  } catch (error) {
    console.error("Error updating interview:", error);
    return NextResponse.json({ error: "Failed to update interview" }, { status: 500 });
  }
}
