import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/employer/reviews - Get reviews for employer's company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "EMPLOYER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get employer's company
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        company: {
          include: {
            reviews: {
              include: {
                application: {
                  include: {
                    job: {
                      select: { title: true },
                    },
                  },
                },
              },
              orderBy: { createdAt: "desc" },
            },
          },
        },
      },
    });

    if (!user?.company) {
      return NextResponse.json({ error: "No company associated" }, { status: 400 });
    }

    const company = user.company;
    const reviews = company.reviews;
    const reviewCount = reviews.length;

    // Calculate aggregate ratings
    let aggregateRatings = null;
    let ghostingRate = 0;

    if (reviewCount > 0) {
      const sum = {
        responsiveness: 0,
        transparency: 0,
        professionalism: 0,
        interviewExperience: 0,
        overall: 0,
      };
      let ghostedCount = 0;

      for (const review of reviews) {
        sum.responsiveness += review.responsiveness;
        sum.transparency += review.transparency;
        sum.professionalism += review.professionalism;
        sum.interviewExperience += review.interviewExperience;
        sum.overall += review.overall;
        if (review.wasGhosted) ghostedCount++;
      }

      aggregateRatings = {
        responsiveness: Number((sum.responsiveness / reviewCount).toFixed(1)),
        transparency: Number((sum.transparency / reviewCount).toFixed(1)),
        professionalism: Number((sum.professionalism / reviewCount).toFixed(1)),
        interviewExperience: Number((sum.interviewExperience / reviewCount).toFixed(1)),
        overall: Number((sum.overall / reviewCount).toFixed(1)),
      };

      ghostingRate = Math.round((ghostedCount / reviewCount) * 100);
    }

    return NextResponse.json({
      company: {
        id: company.id,
        name: company.name,
        logo: company.logo,
      },
      reviewCount,
      aggregateRatings,
      ghostingRate,
      reviews: reviews.map((r) => ({
        id: r.id,
        responsiveness: r.responsiveness,
        transparency: r.transparency,
        professionalism: r.professionalism,
        interviewExperience: r.interviewExperience,
        overall: r.overall,
        wasGhosted: r.wasGhosted,
        comment: r.comment,
        createdAt: r.createdAt,
        jobTitle: r.application.job.title,
      })),
    });
  } catch (error) {
    console.error("Error fetching employer reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
