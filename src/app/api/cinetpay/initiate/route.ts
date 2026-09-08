import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { initiateCinetPayPayment } from "@/lib/cinetpay";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Rate limiting: 5 requests per minute per user
    const rateLimit = checkRateLimit(`cinetpay_initiate_${session.user.id}`, 5, 60000);
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Trop de requêtes. Veuillez patienter une minute avant de réanalyser." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { plan } = body;

    if (plan !== "demo" && plan !== "cv") {
      return NextResponse.json(
        { error: "Plan invalide. Choisissez 'demo' ou 'cv'." },
        { status: 400 }
      );
    }

    const amount = plan === "demo" ? 1500 : 3000;
    const designation =
      plan === "demo" ? "Pass Démo (1 Export CV)" : "Plan CV Pro (2 Exports CV)";

    // Generate unique merchant_transaction_id (alphanumeric only, max 30 chars)
    // tx1725785000000abc12 => length ~21 chars
    const merchant_transaction_id = `tx${Date.now()}${Math.random().toString(36).substring(2, 7)}`;

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    const baseUrl = `${protocol}://${host}`;

    const success_url = `${baseUrl}/payment/success?transaction_id=${merchant_transaction_id}`;
    const failed_url = `${baseUrl}/payment/cancel?transaction_id=${merchant_transaction_id}`;
    const notify_url = process.env.CINETPAY_NOTIFY_URL || `${baseUrl}/api/cinetpay/notify`;

    // Fetch user info for CinetPay customer metadata
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });

    const client_email = user?.email || session.user.email || "client@cvpro.com";
    const fullName = (user?.name || session.user.name || "Client CVPro").trim();
    const nameParts = fullName.split(" ");
    const client_first_name = nameParts[0] || "Client";
    const client_last_name = nameParts.slice(1).join(" ") || "CVPro";

    // Initiate CinetPay payment (v1 API)
    const paymentResult = await initiateCinetPayPayment({
      merchant_transaction_id,
      amount,
      designation,
      client_email,
      client_first_name,
      client_last_name,
      success_url,
      failed_url,
      notify_url,
    });

    // Store transaction in database with "pending" status
    await prisma.paymentTransaction.create({
      data: {
        transaction_id: merchant_transaction_id,
        user_id: session.user.id,
        plan,
        amount,
        status: "pending",
      },
    });

    return NextResponse.json({
      payment_url: paymentResult.payment_url,
      transaction_id: merchant_transaction_id,
    });
  } catch (error: any) {
    console.error("POST /api/cinetpay/initiate error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur lors de l'initialisation du paiement CinetPay" },
      { status: 500 }
    );
  }
}
