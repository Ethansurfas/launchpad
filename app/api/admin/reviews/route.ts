import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/reviews - Get admin's reviews or specific company review
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company");

    if (companyId) {
      // Get specific company with its reviews and admin's review
      const company = await prisma.company.findUnique({
        where: { id: companyId },
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
          careerCenterReviews: {
            where: { reviewerId: session.user.id },
          },
        },
      });

      if (!company) {
        return NextResponse.json({ error: "Company not found" }, { status: 404 });
      }

      // Calculate aggregate student ratings
      const reviews = company.reviews;
      const reviewCount = reviews.length;
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
        studentReviews: reviews.map((r) => ({
          id: r.id,
          overall: r.overall,
          wasGhosted: r.wasGhosted,
          comment: r.comment,
          createdAt: r.createdAt,
          jobTitle: r.application.job.title,
        })),
        aggregateRatings,
        ghostingRate,
        reviewCount,
        adminReview: company.careerCenterReviews[0] || null,
      });
    }

    // Get all admin's reviews
    const reviews = await prisma.careerCenterReview.findMany({
      where: { reviewerId: session.user.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("Error fetching admin reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/admin/reviews - Submit or update admin review
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      companyId,
      studentTreatment,
      feedbackTimeliness,
      hiringSuccess,
      wouldRecommend,
      comment,
    } = await request.json();

    // Validate ratings are 1-5
    const ratings = [studentTreatment, feedbackTimeliness, hiringSuccess, wouldRecommend];
    if (ratings.some((r) => r < 1 || r > 5)) {
      return NextResponse.json(
        { error: "Ratings must be between 1 and 5" },
        { status: 400 }
      );
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Upsert the review (one per admin per company)
    const review = await prisma.careerCenterReview.upsert({
      where: {
        reviewerId_companyId: {
          reviewerId: session.user.id,
          companyId,
        },
      },
      update: {
        studentTreatment,
        feedbackTimeliness,
        hiringSuccess,
        wouldRecommend,
        comment: comment || null,
      },
      create: {
        reviewerId: session.user.id,
        companyId,
        studentTreatment,
        feedbackTimeliness,
        hiringSuccess,
        wouldRecommend,
        comment: comment || null,
      },
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error("Error creating admin review:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
