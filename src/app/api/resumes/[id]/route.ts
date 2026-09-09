import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';


export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    const resume = await prisma.resume.findUnique({
      where: { id },
      include: {
        sections: {
          orderBy: { order_index: "asc" },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({ resume });
  } catch (error) {
    console.error("GET /api/resumes/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { title, template_id, accent_color, sections } = body;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Update resume metadata and optionally sync sections
    const updatedResume = await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      await tx.resume.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(template_id !== undefined && { template_id }),
          ...(accent_color !== undefined && { accent_color }),
        },
      });

      // 2. If sections array is provided, replace sections
      if (Array.isArray(sections)) {
        await tx.resumeSection.deleteMany({
          where: { resume_id: id },
        });

        if (sections.length > 0) {
          await tx.resumeSection.createMany({
            data: sections.map((sec: any, index: number) => ({
              resume_id: id,
              type: sec.type || "custom",
              order_index: sec.order_index ?? index,
              data: sec.data || {},
            })),
          });
        }
      }

      // Return refreshed resume with sections
      return tx.resume.findUnique({
        where: { id },
        include: {
          sections: {
            orderBy: { order_index: "asc" },
          },
        },
      });
    });

    return NextResponse.json({ resume: updatedResume });
  } catch (error) {
    console.error("PUT /api/resumes/[id] error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à jour du CV" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.resume.delete({
      where: { id },
    });

    return NextResponse.json({ message: "CV supprimé avec succès" });
  } catch (error) {
    console.error("DELETE /api/resumes/[id] error:", error);
    return NextResponse.json({ error: "Erreur lors de la suppression du CV" }, { status: 500 });
  }
}
