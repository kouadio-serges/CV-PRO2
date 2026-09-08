import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import puppeteer from "puppeteer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function generateCoverLetterPdfResponse(req: Request, id: string) {
  let browser = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const coverLetter = await prisma.coverLetter.findUnique({
      where: { id },
      include: {
        resume: { select: { user_id: true, title: true } },
      },
    });

    if (!coverLetter) {
      return NextResponse.json({ error: "Lettre non trouvée" }, { status: 404 });
    }

    if (coverLetter.resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const renderUrl = `${protocol}://${host}/print/cover-letter/${id}`;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    await page.goto(renderUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    const safeTitle = (coverLetter.job_title || "Lettre_de_motivation").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `Lettre_${safeTitle}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error: any) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    console.error("Cover Letter PDF Export error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la génération du PDF de la lettre" },
      { status: 500 }
    );
  }
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  return generateCoverLetterPdfResponse(req, params.id);
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  return generateCoverLetterPdfResponse(req, params.id);
}
