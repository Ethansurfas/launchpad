import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PUT /api/interviews/[id]/select-slot - Candidate selects a time slot
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { slotId } = data;

    if (!slotId) {
      return NextResponse.json({ error: "Slot ID required" }, { status: 400 });
    }

    // Get interview and verify candidate
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: true,
        timeSlots: true,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    if (interview.application.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (interview.status !== "PENDING_RESPONSE") {
      return NextResponse.json({ error: "Time already selected" }, { status: 400 });
    }

    // Verify slot belongs to this interview
    const slot = interview.timeSlots.find((s) => s.id === slotId);
    if (!slot) {
      return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
    }

    // Update the slot and interview
    await prisma.$transaction([
      prisma.interviewTimeSlot.update({
        where: { id: slotId },
        data: { selected: true },
      }),
      prisma.interview.update({
        where: { id },
        data: {
          scheduledAt: slot.startTime,
          status: "SCHEDULED",
        },
      }),
    ]);

    const updated = await prisma.interview.findUnique({
      where: { id },
      include: {
        timeSlots: true,
        application: {
          include: {
            job: {
              include: { company: true },
            },
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error selecting slot:", error);
    return NextResponse.json({ error: "Failed to select time slot" }, { status: 500 });
  }
}
