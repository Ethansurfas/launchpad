import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/employers - Get employer analytics for career center admins
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all companies with their reviews and career center reviews
    const companies = await prisma.company.findMany({
      include: {
        reviews: {
          select: {
            overall: true,
            responsiveness: true,
            transparency: true,
            professionalism: true,
            interviewExperience: true,
            wasGhosted: true,
          },
        },
        careerCenterReviews: {
          where: {
            reviewerId: session.user.id,
          },
          select: {
            id: true,
          },
        },
        jobs: {
          where: { isActive: true },
          select: { id: true },
        },
      },
      orderBy: { name: "asc" },
    });

    // Calculate stats for each company
    const employerStats = companies.map((company) => {
      const reviews = company.reviews;
      const reviewCount = reviews.length;
      let stats = {
        averageRating: null as number | null,
        ghostingRate: 0,
        responsiveness: null as number | null,
        transparency: null as number | null,
        professionalism: null as number | null,
        interviewExperience: null as number | null,
      };

      if (reviewCount > 0) {
        const sum = {
          overall: 0,
          responsiveness: 0,
          transparency: 0,
          professionalism: 0,
          interviewExperience: 0,
        };
        let ghostedCount = 0;

        for (const review of reviews) {
          sum.overall += review.overall;
          sum.responsiveness += review.responsiveness;
          sum.transparency += review.transparency;
          sum.professionalism += review.professionalism;
          sum.interviewExperience += review.interviewExperience;
          if (review.wasGhosted) ghostedCount++;
        }

        stats = {
          averageRating: Number((sum.overall / reviewCount).toFixed(1)),
          ghostingRate: Math.round((ghostedCount / reviewCount) * 100),
          responsiveness: Number((sum.responsiveness / reviewCount).toFixed(1)),
          transparency: Number((sum.transparency / reviewCount).toFixed(1)),
          professionalism: Number((sum.professionalism / reviewCount).toFixed(1)),
          interviewExperience: Number((sum.interviewExperience / reviewCount).toFixed(1)),
        };
      }

      return {
        id: company.id,
        name: company.name,
        logo: company.logo,
        activeJobs: company.jobs.length,
        reviewCount,
        hasAdminReview: company.careerCenterReviews.length > 0,
        ...stats,
      };
    });

    // Summary stats
    const totalEmployers = companies.length;
    const employersWithReviews = employerStats.filter((e) => e.reviewCount > 0).length;
    const highGhostingEmployers = employerStats.filter((e) => e.ghostingRate > 25).length;
    const pendingAdminReviews = employerStats.filter((e) => !e.hasAdminReview && e.reviewCount > 0).length;

    return NextResponse.json({
      summary: {
        totalEmployers,
        employersWithReviews,
        highGhostingEmployers,
        pendingAdminReviews,
      },
      employers: employerStats,
    });
  } catch (error) {
    console.error("Error fetching employer analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch employer analytics" },
      { status: 500 }
    );
  }
}
