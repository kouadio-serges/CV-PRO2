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

    // Verify CV ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Verify user has at least 1 credit available
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { cv_credits: true },
    });

    if (!user || user.cv_credits <= 0) {
      return NextResponse.json(
        { error: "Vous n'avez pas assez de crédits d'exportation. Veuillez acheter un pass." },
        { status: 402 }
      );
    }

    // Atomic Prisma transaction: decrement user cv_credits by 1, increment resume cover_letter_allowance by 1
    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          cv_credits: { decrement: 1 },
        },
      }),
      prisma.resume.update({
        where: { id },
        data: {
          cover_letter_allowance: { increment: 1 },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Export débloqué avec succès",
    });
  } catch (error: any) {
    console.error("POST /api/resumes/[id]/unlock-export error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors du déblocage de l'export" },
      { status: 500 }
    );
  }
}
