import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ResumePreview } from "@/components/editor/ResumePreview";

export const dynamic = "force-dynamic";

export default async function PrintResumePage({
  params,
}: {
  params: { id: string };
}) {
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
    notFound();
  }

  let personalInfo: any = {};
  const sectionsList = resume.sections || [];
  const otherSections: any[] = [];

  sectionsList.forEach((sec) => {
    if (sec.type === "personal" && sec.data) {
      personalInfo = sec.data;
    } else {
      otherSections.push(sec);
    }
  });

  if (resume.photo_url) {
    personalInfo.photo_url = resume.photo_url;
  }

  return (
    <div className="w-full bg-white text-slate-900 min-h-screen p-0 m-0 print:p-0 flex justify-center items-start">
      <ResumePreview
        title={resume.title}
        templateId={resume.template_id}
        accentColor={resume.accent_color}
        personalInfo={personalInfo}
        sections={otherSections}
        photoUrl={resume.photo_url || undefined}
      />
    </div>
  );
}
