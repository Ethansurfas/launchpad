import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/interviews - List interviews for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isEmployer = session.user.role === "EMPLOYER";

    let interviews;

    if (isEmployer) {
      // Employer sees interviews for their company's job applications
      interviews = await prisma.interview.findMany({
        where: {
          application: {
            job: {
              company: {
                employees: {
                  some: { id: session.user.id },
                },
              },
            },
          },
        },
        include: {
          application: {
            include: {
              user: { select: { id: true, name: true, email: true } },
              job: { select: { id: true, title: true } },
            },
          },
          timeSlots: { orderBy: { startTime: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Student sees their own interviews
      interviews = await prisma.interview.findMany({
        where: {
          application: {
            userId: session.user.id,
          },
        },
        include: {
          application: {
            include: {
              job: {
                include: {
                  company: { select: { id: true, name: true, logo: true } },
                },
              },
            },
          },
          timeSlots: { orderBy: { startTime: "asc" } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(interviews);
  } catch (error) {
    console.error("Error fetching interviews:", error);
    return NextResponse.json({ error: "Failed to fetch interviews" }, { status: 500 });
  }
}

// POST /api/interviews - Create interview with time slots (employer only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    const { applicationId, duration, timeSlots } = data;

    if (!applicationId || !timeSlots || timeSlots.length < 2) {
      return NextResponse.json(
        { error: "Application ID and at least 2 time slots required" },
        { status: 400 }
      );
    }

    // Verify the application belongs to employer's company
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: {
              include: { employees: { select: { id: true } } },
            },
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    const isEmployerOfCompany = application.job.company.employees.some(
      (emp) => emp.id === session.user.id
    );

    if (!isEmployerOfCompany) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create interview with time slots
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        duration: duration || 30,
        timeSlots: {
          create: timeSlots.map((slot: { startTime: string }) => ({
            startTime: new Date(slot.startTime),
          })),
        },
      },
      include: {
        timeSlots: true,
        application: {
          include: {
            user: { select: { name: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
    });

    // Update application status to INTERVIEW
    await prisma.application.update({
      where: { id: applicationId },
      data: { status: "INTERVIEW" },
    });

    return NextResponse.json(interview);
  } catch (error) {
    console.error("Error creating interview:", error);
    return NextResponse.json({ error: "Failed to create interview" }, { status: 500 });
  }
}
