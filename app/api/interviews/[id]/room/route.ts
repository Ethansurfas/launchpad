import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createDailyRoom, getDailyRoom } from "@/lib/daily";

// POST /api/interviews/[id]/room - Get or create Daily room for interview
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
            job: {
              include: {
                company: {
                  include: { employees: { select: { id: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!interview) {
      return NextResponse.json({ error: "Interview not found" }, { status: 404 });
    }

    // Check user has access
    const isCandidate = interview.application.userId === session.user.id;
    const isEmployer = interview.application.job.company.employees.some(
      (emp) => emp.id === session.user.id
    );

    if (!isCandidate && !isEmployer) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check interview is scheduled
    if (interview.status !== "SCHEDULED" && interview.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Interview not ready to join" },
        { status: 400 }
      );
    }

    // If room already exists, return it
    if (interview.roomUrl) {
      // Update status to IN_PROGRESS if first time joining
      if (interview.status === "SCHEDULED") {
        await prisma.interview.update({
          where: { id },
          data: { status: "IN_PROGRESS" },
        });
      }
      return NextResponse.json({
        roomUrl: interview.roomUrl,
        roomName: interview.roomName,
      });
    }

    // Create new Daily room
    const roomName = `interview-${id}`;

    try {
      // Check if room already exists on Daily
      let room = await getDailyRoom(roomName);

      if (!room) {
        room = await createDailyRoom(roomName);
      }

      // Save room info to database
      await prisma.interview.update({
        where: { id },
        data: {
          roomName: room.name,
          roomUrl: room.url,
          status: "IN_PROGRESS",
        },
      });

      return NextResponse.json({
        roomUrl: room.url,
        roomName: room.name,
      });
    } catch (dailyError) {
      console.error("Daily.co error:", dailyError);
      const message = dailyError instanceof Error ? dailyError.message : "Unknown error";
      return NextResponse.json(
        { error: `Failed to create video room: ${message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error creating room:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
