import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import puppeteer from "puppeteer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  let browser = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Determine internal URL for rendering the CV template
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const renderUrl = `${protocol}://${host}/print/resume/${id}`;

    // Launch Puppeteer headless browser
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

    // Navigate to clean print route
    await page.goto(renderUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Generate high resolution A4 PDF with zero margins
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0px", right: "0px", bottom: "0px", left: "0px" },
      preferCSSPageSize: true,
    });

    await browser.close();
    browser = null;

    const safeTitle = (resume.title || "CV").replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `${safeTitle}.pdf`;

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
    console.error("POST /api/resumes/[id]/export error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de la génération du PDF" },
      { status: 500 }
    );
  }
}
