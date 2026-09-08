import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCinetPayStatus } from "@/lib/cinetpay";

export async function POST(req: Request) {
  try {
    let transactionId = "";

    // 1. Try reading from URL query search parameters
    const { searchParams } = new URL(req.url);
    transactionId =
      searchParams.get("transaction_id") ||
      searchParams.get("merchant_transaction_id") ||
      searchParams.get("cpm_trans_id") ||
      "";

    // 2. Try parsing body (JSON or Form Data)
    if (!transactionId) {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json().catch(() => ({}));
        transactionId =
          body.merchant_transaction_id ||
          body.transaction_id ||
          body.cpm_trans_id ||
          "";
      } else if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        const formData = await req.formData().catch(() => null);
        if (formData) {
          transactionId =
            (formData.get("merchant_transaction_id") as string) ||
            (formData.get("transaction_id") as string) ||
            (formData.get("cpm_trans_id") as string) ||
            "";
        }
      } else {
        // Fallback text / JSON parsing
        const text = await req.text().catch(() => "");
        try {
          const body = JSON.parse(text);
          transactionId =
            body.merchant_transaction_id ||
            body.transaction_id ||
            body.cpm_trans_id ||
            "";
        } catch {
          // If form-encoded plain text
          const params = new URLSearchParams(text);
          transactionId =
            params.get("merchant_transaction_id") ||
            params.get("transaction_id") ||
            params.get("cpm_trans_id") ||
            "";
        }
      }
    }

    if (!transactionId) {
      console.warn("CinetPay webhook received without transaction_id");
      return NextResponse.json({ error: "transaction_id manquant" }, { status: 400 });
    }

    // CRITICAL: Perform server-to-server verification with CinetPay API Aurore v1
    const verification = await verifyCinetPayStatus(transactionId);

    // Look up transaction in database
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { transaction_id: transactionId },
    });

    if (!transaction) {
      console.warn(`PaymentTransaction non trouvée pour id: ${transactionId}`);
      return NextResponse.json({ error: "Transaction non trouvée" }, { status: 404 });
    }

    // Only process if status is currently "pending"
    if (transaction.status === "pending") {
      if (verification.isSuccessful) {
        const creditAmount = transaction.plan === "cv" ? 2 : 1;

        await prisma.$transaction([
          prisma.paymentTransaction.update({
            where: { id: transaction.id },
            data: { status: "completed" },
          }),
          prisma.user.update({
            where: { id: transaction.user_id },
            data: {
              cv_credits: { increment: creditAmount },
            },
          }),
        ]);
        console.log(`Paiement ${transactionId} validé avec succès. Crédits +${creditAmount} attribués à l'utilisateur ${transaction.user_id}.`);
      } else {
        await prisma.paymentTransaction.update({
          where: { id: transaction.id },
          data: { status: "failed" },
        });
        console.log(`Paiement ${transactionId} échoué/rejeté (Statut CinetPay: ${verification.status}).`);
      }
    }

    return NextResponse.json({ status: "OK", verified: verification.isSuccessful }, { status: 200 });
  } catch (error: any) {
    console.error("POST /api/cinetpay/notify webhook error:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne du webhook" },
      { status: 500 }
    );
  }
}
