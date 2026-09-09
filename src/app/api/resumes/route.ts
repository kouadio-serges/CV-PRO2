import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';


const createResumeSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  template_id: z.string().optional().default("modern"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const resumes = await prisma.resume.findMany({
      where: { user_id: session.user.id },
      orderBy: { updated_at: "desc" },
      include: {
        _count: {
          select: { sections: true, cover_letters: true },
        },
      },
    });

    return NextResponse.json({ resumes });
  } catch (error) {
    console.error("GET /api/resumes error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const result = createResumeSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, template_id } = result.data;

    // Create resume with default initial sections
    const resume = await prisma.resume.create({
      data: {
        user_id: session.user.id,
        title,
        template_id,
        sections: {
          createMany: {
            data: [
              {
                type: "experience",
                order_index: 0,
                data: {
                  title: "Expérience Professionnelle",
                  items: [
                    {
                      company: "Entreprise Exemple",
                      position: "Développeur Full Stack",
                      location: "Paris, France",
                      startDate: "2022-01",
                      endDate: "Présent",
                      current: true,
                      description: "Développement et maintenance d'applications web modernes.",
                    },
                  ],
                },
              },
              {
                type: "education",
                order_index: 1,
                data: {
                  title: "Formation",
                  items: [
                    {
                      institution: "Université / École",
                      degree: "Master en Informatique",
                      location: "Paris, France",
                      startDate: "2019-09",
                      endDate: "2021-06",
                      description: "Spécialisation en génie logiciel et architecture Web.",
                    },
                  ],
                },
              },
              {
                type: "skill",
                order_index: 2,
                data: {
                  title: "Compétences",
                  items: [
                    { name: "TypeScript / JavaScript", level: "Avancé" },
                    { name: "React / Next.js", level: "Avancé" },
                    { name: "Tailwind CSS", level: "Intermédiaire" },
                    { name: "PostgreSQL / Prisma", level: "Intermédiaire" },
                  ],
                },
              },
              {
                type: "language",
                order_index: 3,
                data: {
                  title: "Langues",
                  items: [
                    { name: "Français", level: "Langue maternelle" },
                    { name: "Anglais", level: "Professionnel" },
                  ],
                },
              },
            ],
          },
        },
      },
      include: {
        sections: true,
      },
    });

    return NextResponse.json({ resume }, { status: 201 });
  } catch (error) {
    console.error("POST /api/resumes error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du CV" }, { status: 500 });
  }
}
