import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PrintCoverLetterPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const coverLetter = await prisma.coverLetter.findUnique({
    where: { id },
    include: {
      resume: {
        include: {
          sections: true,
        },
      },
    },
  });

  if (!coverLetter) {
    notFound();
  }

  const { resume } = coverLetter;
  let personalInfo: any = {};

  (resume.sections || []).forEach((sec) => {
    if (sec.type === "personal" && sec.data) {
      personalInfo = sec.data;
    }
  });

  const accentColor = resume.accent_color || "#4F46E5";
  const fullName = `${personalInfo.first_name || ""} ${personalInfo.last_name || ""}`.trim() || "Candidat";
  const jobTitle = personalInfo.job_title || resume.title || "";
  const email = personalInfo.email || "";
  const phone = personalInfo.phone || "";
  const location = [personalInfo.city, personalInfo.country].filter(Boolean).join(", ");

  const dateStr = new Date(coverLetter.created_at).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full bg-white text-slate-900 min-h-screen p-12 print:p-8 flex justify-center items-start">
      <div className="w-full max-w-[210mm] bg-white p-8 md:p-12 font-sans leading-relaxed text-slate-800">
        {/* Header Header Bar */}
        <div
          className="pb-6 mb-8 border-b-2"
          style={{ borderColor: accentColor }}
        >
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
            {fullName}
          </h1>
          {jobTitle && (
            <p className="text-lg font-medium mt-1" style={{ color: accentColor }}>
              {jobTitle}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-4">
            {email && <span>📧 {email}</span>}
            {phone && <span>📱 {phone}</span>}
            {location && <span>📍 {location}</span>}
          </div>
        </div>

        {/* Date & Destination */}
        <div className="flex justify-between items-start mb-8 text-sm text-slate-600">
          <div>
            <p className="font-semibold text-slate-900">Objet : Candidature au poste de {coverLetter.job_title}</p>
          </div>
          <div className="text-right">
            <p>{dateStr}</p>
          </div>
        </div>

        {/* Letter Body */}
        <div className="whitespace-pre-wrap text-justify text-base leading-relaxed text-slate-700 space-y-4">
          {coverLetter.content}
        </div>

        {/* Signature Footer */}
        <div className="mt-12 pt-6">
          <p className="text-sm font-medium text-slate-900">Cordialement,</p>
          <p className="text-base font-bold text-slate-900 mt-4">{fullName}</p>
        </div>
      </div>
    </div>
  );
}
