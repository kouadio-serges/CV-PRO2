import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    const original = await prisma.resume.findUnique({
      where: { id },
      include: { sections: true },
    });

    if (!original) {
      return NextResponse.json({ error: "CV d'origine non trouvé" }, { status: 404 });
    }

    if (original.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Create duplicated resume with copied sections
    const duplicate = await prisma.resume.create({
      data: {
        user_id: session.user.id,
        title: `${original.title} (Copie)`,
        template_id: original.template_id,
        accent_color: original.accent_color,
        cover_letter_allowance: 0,
        sections: {
          createMany: {
            data: original.sections.map((section) => ({
              type: section.type,
              order_index: section.order_index,
              data: section.data ?? {},
            })),
          },
        },
      },
      include: {
        sections: true,
      },
    });

    return NextResponse.json({ resume: duplicate }, { status: 201 });
  } catch (error) {
    console.error("POST /api/resumes/[id]/duplicate error:", error);
    return NextResponse.json({ error: "Erreur lors de la duplication du CV" }, { status: 500 });
  }
}
