import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
      select: {
        id: true,
        user_id: true,
        cover_letter_allowance: true,
        cover_letters: {
          orderBy: { created_at: "desc" },
        },
      },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({
      cover_letter_allowance: resume.cover_letter_allowance,
      cover_letters: resume.cover_letters,
    });
  } catch (error: any) {
    console.error("GET /api/resumes/[id]/cover-letter error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la récupération des lettres" },
      { status: 500 }
    );
  }
}

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
    const body = await req.json().catch(() => ({}));
    const { job_title, job_offer } = body;

    if (!job_title || !job_offer) {
      return NextResponse.json(
        { error: "Le titre du poste et l'offre d'emploi sont requis." },
        { status: 400 }
      );
    }

    // 1. Verify ownership and check cover_letter_allowance
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

    if (resume.cover_letter_allowance <= 0) {
      return NextResponse.json(
        {
          error:
            "Crédits de lettre de motivation insuffisants pour ce CV. Veuillez débloquer un export ou acheter un pass.",
        },
        { status: 402 }
      );
    }

    // 2. Format structured CV data for Anthropic prompt
    let personalInfo: any = {};
    const experiences: any[] = [];
    const education: any[] = [];
    const skills: any[] = [];
    const languages: any[] = [];

    (resume.sections || []).forEach((sec) => {
      const data = sec.data as any;
      if (sec.type === "personal" && data) {
        personalInfo = data;
      } else if (sec.type === "experience" && data) {
        if (Array.isArray(data.items)) experiences.push(...data.items);
        else if (data.company || data.position) experiences.push(data);
      } else if (sec.type === "education" && data) {
        if (Array.isArray(data.items)) education.push(...data.items);
        else if (data.school || data.degree) education.push(data);
      } else if (sec.type === "skill" && data) {
        if (Array.isArray(data.items)) skills.push(...data.items);
        else if (data.name) skills.push(data);
      } else if (sec.type === "language" && data) {
        if (Array.isArray(data.items)) languages.push(...data.items);
        else if (data.name) languages.push(data);
      }
    });

    const candidateName = `${personalInfo.first_name || ""} ${personalInfo.last_name || ""}`.trim() || session.user.name || "Le candidat";
    const candidateTitle = personalInfo.job_title || resume.title || "";
    const candidateEmail = personalInfo.email || session.user.email || "";
    const candidatePhone = personalInfo.phone || "";
    const candidateSummary = personalInfo.summary || "";

    const expText = experiences
      .map(
        (exp) =>
          `- ${exp.position || exp.title || "Poste"} chez ${exp.company || "Entreprise"} (${exp.start_date || ""} - ${exp.end_date || "Présent"}): ${exp.description || exp.summary || ""}`
      )
      .join("\n");

    const eduText = education
      .map(
        (edu) =>
          `- ${edu.degree || "Diplôme"} à ${edu.school || edu.institution || "Établissement"} (${edu.year || edu.end_date || ""}): ${edu.description || ""}`
      )
      .join("\n");

    const skillsText = skills
      .map((s) => (typeof s === "string" ? s : s.name || s.skill || ""))
      .filter(Boolean)
      .join(", ");

    const languagesText = languages
      .map((l) => (typeof l === "string" ? l : `${l.name || l.language || ""} (${l.level || ""})`))
      .filter(Boolean)
      .join(", ");

    const cvContext = `
PROFIL CANDIDAT:
Nom complet: ${candidateName}
Titre actuel/visé: ${candidateTitle}
Email: ${candidateEmail}
Téléphone: ${candidatePhone}
Résumé / Présentation: ${candidateSummary}

EXPÉRIENCES PROFESSIONNELLES:
${expText || "Aucune expérience renseignée"}

FORMATIONS & DIPLÔMES:
${eduText || "Aucune formation renseignée"}

COMPÉTENCES:
${skillsText || "Non renseignées"}

LANGUES:
${languagesText || "Non renseignées"}
`.trim();

    // 3. Call Anthropic API
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { error: "La clé ANTHROPIC_API_KEY est manquante dans la configuration serveur (.env.local)." },
        { status: 500 }
      );
    }

    const systemPrompt = `Tu es un expert en recrutement et en rédaction de lettres de motivation professionnelles en français.
Ton objectif est de rédiger une lettre de motivation percutante, élégante et parfaitement adaptée à l'offre d'emploi fournie.

Règles strictes à respecter :
1. Rédige la lettre en français avec un ton professionnel et enthousiaste. Longueur stricte : 250 à 350 mots.
2. Ne mentionne QUE des expériences, compétences, diplômes et éléments réellement présents dans le CV fourni ci-dessous. N'invente AUCUN fait, diplôme ou entreprise fictive.
3. Relie concrètement et explicitement le parcours du candidat aux exigences de l'offre d'emploi.
4. Évite les généralités et les formules creuses. Sois direct, structuré et convaincant.
5. Structure la lettre avec formule d'appel, corps de texte (3 à 4 paragraphes percutants) et formule de politesse standard.`;

    const userPrompt = `
LETTRE DE MOTIVATION À RÉDIGER :

OFFRE D'EMPLOI CIBLÉE :
Intitulé du poste: ${job_title}
Texte de l'offre:
${job_offer}

---

DONNÉES DU CV DU CANDIDAT (Utilise uniquement ces informations réelles) :
${cvContext}
`.trim();

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const anthropicData = await anthropicRes.json().catch(() => ({}));

    if (!anthropicRes.ok) {
      console.error("Anthropic API Error:", anthropicData);
      throw new Error(
        anthropicData.error?.message ||
          `Erreur lors de la génération IA par Anthropic (${anthropicRes.status})`
      );
    }

    const generatedText =
      anthropicData.content?.[0]?.text || "Erreur de génération du contenu par l'IA.";

    // 4. Atomic Prisma transaction: decrement allowance by 1 and save CoverLetter
    const [updatedResume, newCoverLetter] = await prisma.$transaction([
      prisma.resume.update({
        where: { id },
        data: {
          cover_letter_allowance: { decrement: 1 },
        },
        select: { cover_letter_allowance: true },
      }),
      prisma.coverLetter.create({
        data: {
          resume_id: id,
          job_title,
          job_offer,
          content: generatedText,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      cover_letter: newCoverLetter,
      cover_letter_allowance: updatedResume.cover_letter_allowance,
    });
  } catch (error: any) {
    console.error("POST /api/resumes/[id]/cover-letter error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la génération de la lettre de motivation" },
      { status: 500 }
    );
  }
}
