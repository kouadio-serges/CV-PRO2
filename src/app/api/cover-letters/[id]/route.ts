import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';


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
    const body = await req.json().catch(() => ({}));
    const { content, job_title } = body;

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
      include: { resume: { select: { user_id: true } } },
    });

    if (!coverLetter) {
      return NextResponse.json({ error: "Lettre non trouvée" }, { status: 404 });
    }

    if (coverLetter.resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const updated = await prisma.coverLetter.update({
      where: { id },
      data: {
        content: content !== undefined ? content : coverLetter.content,
        job_title: job_title !== undefined ? job_title : coverLetter.job_title,
      },
    });

    return NextResponse.json({ success: true, cover_letter: updated });
  } catch (error: any) {
    console.error("PUT /api/cover-letters/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la mise à jour" },
      { status: 500 }
    );
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

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
      include: { resume: { select: { user_id: true } } },
    });

    if (!coverLetter) {
      return NextResponse.json({ error: "Lettre non trouvée" }, { status: 404 });
    }

    if (coverLetter.resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    await prisma.coverLetter.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE /api/cover-letters/[id] error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}
