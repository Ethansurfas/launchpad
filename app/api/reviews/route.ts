import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/reviews - Get pending and submitted reviews for current user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all applications with completed interviews that can be reviewed
    const applications = await prisma.application.findMany({
      where: {
        userId: session.user.id,
        interviews: {
          some: {
            status: "COMPLETED",
          },
        },
      },
      include: {
        job: {
          include: {
            company: {
              select: {
                id: true,
                name: true,
                logo: true,
              },
            },
          },
        },
        interviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        review: true,
      },
    });

    // Split into pending and submitted
    const pending = applications.filter((app) => !app.review);
    const submitted = applications.filter((app) => app.review);

    return NextResponse.json({ pending, submitted });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/reviews - Submit a new review
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "STUDENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      applicationId,
      responsiveness,
      transparency,
      professionalism,
      interviewExperience,
      overall,
      wasGhosted,
      comment,
    } = await request.json();

    // Validate ratings are 1-5
    const ratings = [responsiveness, transparency, professionalism, interviewExperience, overall];
    if (ratings.some((r) => r < 1 || r > 5)) {
      return NextResponse.json(
        { error: "Ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Get the application and verify ownership
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        interviews: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        review: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (application.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (application.review) {
      return NextResponse.json(
        { error: "Already reviewed this application" },
        { status: 400 }
      );
    }

    // Check if interview qualifies for review (must be completed)
    const interview = application.interviews[0];
    if (!interview) {
      return NextResponse.json(
        { error: "No interview found for this application" },
        { status: 400 }
      );
    }

    if (interview.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Can only review after completing an interview" },
        { status: 400 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        reviewerId: session.user.id,
        companyId: application.job.companyId,
        applicationId,
        responsiveness,
        transparency,
        professionalism,
        interviewExperience,
        overall,
        wasGhosted,
        comment: comment || null,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
