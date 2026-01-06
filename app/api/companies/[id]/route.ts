import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/companies/[id] - Get company profile with ratings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        jobs: {
          where: { isActive: true },
          select: {
            id: true,
            title: true,
            location: true,
            type: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
              },
            },
            application: {
              include: {
                job: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Calculate aggregate ratings
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

    // If logged in, include detailed reviews; otherwise just aggregate
    const response = {
      id: company.id,
      name: company.name,
      logo: company.logo,
      website: company.website,
      description: company.description,
      jobs: company.jobs,
      reviewCount,
      aggregateRatings,
      ghostingRate,
      // Only include detailed reviews for logged-in users
      reviews: session
        ? reviews.map((r) => ({
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
            // Anonymize reviewer
            reviewerInitial: r.reviewer.name.charAt(0),
          }))
        : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json(
      { error: "Failed to fetch company" },
      { status: 500 }
    );
  }
}
