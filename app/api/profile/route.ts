import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: {
          include: {
            experiences: {
              orderBy: { order: "asc" },
            },
            projects: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();

    // Update user name
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: data.name },
    });

    // Update student profile if user is a student
    if (session.user.role === "STUDENT") {
      await prisma.studentProfile.upsert({
        where: { userId: session.user.id },
        update: {
          // Basic Info
          phone: data.phone,
          location: data.location,
          workAuth: data.workAuth,
          bio: data.bio,
          // Education
          university: data.university,
          major: data.major,
          minor: data.minor,
          gradYear: data.gradYear ? parseInt(data.gradYear) : null,
          gpa: data.gpa ? parseFloat(data.gpa) : null,
          coursework: data.coursework || [],
          honors: data.honors || [],
          // Links
          linkedIn: data.linkedIn,
          github: data.github,
          portfolio: data.portfolio,
          // Documents
          resumeUrl: data.resumeUrl,
          coverLetterUrl: data.coverLetterUrl,
          transcriptUrl: data.transcriptUrl,
          // Skills
          skills: data.skills || [],
        },
        create: {
          userId: session.user.id,
          phone: data.phone,
          location: data.location,
          workAuth: data.workAuth,
          bio: data.bio,
          university: data.university,
          major: data.major,
          minor: data.minor,
          gradYear: data.gradYear ? parseInt(data.gradYear) : null,
          gpa: data.gpa ? parseFloat(data.gpa) : null,
          coursework: data.coursework || [],
          honors: data.honors || [],
          linkedIn: data.linkedIn,
          github: data.github,
          portfolio: data.portfolio,
          resumeUrl: data.resumeUrl,
          coverLetterUrl: data.coverLetterUrl,
          transcriptUrl: data.transcriptUrl,
          skills: data.skills || [],
        },
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: {
          include: {
            experiences: { orderBy: { order: "asc" } },
            projects: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
