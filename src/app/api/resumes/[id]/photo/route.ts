import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const BUCKET_NAME = "resume-photos";

// Magic Bytes Verification Helper
function validateImageMagicBytes(buffer: Uint8Array): "jpeg" | "png" | "webp" | null {
  if (buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "png";
  }

  // WEBP: RIFF ... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x41 &&
    buffer[10] === 0x56 &&
    buffer[11] === 0x45
  ) {
    return "webp";
  }

  return null;
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

    // Check ownership
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Check SUPABASE_SERVICE_ROLE_KEY
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey || serviceRoleKey.trim() === "") {
      return NextResponse.json(
        {
          error:
            "La variable SUPABASE_SERVICE_ROLE_KEY est absente de .env.local. Récupérez la clé 'service_role' dans Supabase (Project Settings > API) et renseignez-la dans .env.local.",
        },
        { status: 500 }
      );
    }

    // Read Form Data
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Aucun fichier fourni" },
        { status: 400 }
      );
    }

    // Validate File Size (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "La taille du fichier dépasse la limite autorisée de 5 Mo" },
        { status: 400 }
      );
    }

    // Validate MIME Type & Magic Bytes
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const imageType = validateImageMagicBytes(uint8Array);

    if (!imageType) {
      return NextResponse.json(
        {
          error:
            "Format de fichier invalide. Seuls les formats JPEG, PNG et WEBP sont acceptés.",
        },
        { status: 400 }
      );
    }

    // Clean Path Format
    const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `${safeId}_${Date.now()}.${imageType}`;
    const fileBuffer = Buffer.from(arrayBuffer);

    console.log("=== CHEMIN EXACT PASSE A UPLOAD ===");
    console.log("Bucket:", BUCKET_NAME);
    console.log("Path (fileName):", fileName);
    console.log("===================================");

    // Upload to Supabase Storage Bucket 'resume-photos'
    let { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType: `image/${imageType}`,
        upsert: true,
      });

    // If upload fails, attempt creating public bucket and retry
    if (uploadError) {
      console.warn("Upload initial échoué, vérification du bucket...", uploadError.message);
      
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const bucketExists = buckets?.some((b) => b.name === BUCKET_NAME);

      if (!bucketExists) {
        console.log(`Bucket '${BUCKET_NAME}' non trouvé. Création du bucket public...`);
        const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880,
          allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
        });

        if (!createError) {
          const retryUpload = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, fileBuffer, {
              contentType: `image/${imageType}`,
              upsert: true,
            });
          uploadError = retryUpload.error;
        } else {
          console.error("Échec création de bucket:", createError);
        }
      }
    }

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      return NextResponse.json(
        {
          error: `Erreur Supabase Storage (${uploadError.message}). Vérifiez que le bucket 'resume-photos' existe dans Supabase Storage et est configuré en accès Public.`,
        },
        { status: 500 }
      );
    }

    // Get Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;

    // Update Resume in Prisma DB
    await prisma.resume.update({
      where: { id },
      data: { photo_url: publicUrl },
    });

    return NextResponse.json({ photo_url: publicUrl });
  } catch (error: any) {
    console.error("POST /api/resumes/[id]/photo error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur serveur lors de l'upload de la photo" },
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

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return NextResponse.json({ error: "CV non trouvé" }, { status: 404 });
    }

    if (resume.user_id !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Set photo_url to null
    await prisma.resume.update({
      where: { id },
      data: { photo_url: null },
    });

    return NextResponse.json({ message: "Photo supprimée avec succès" });
  } catch (error: any) {
    console.error("DELETE /api/resumes/[id]/photo error:", error);
    return NextResponse.json(
      { error: "Erreur serveur lors de la suppression de la photo" },
      { status: 500 }
    );
  }
}
