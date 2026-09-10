import axios, { AxiosRequestConfig } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";

const CINETPAY_BASE_URL = "https://api.cinetpay.net";

/**
 * Returns Axios configuration with HttpsProxyAgent if QUOTAGUARDSTATIC_URL is defined.
 */
function getAxiosConfig(): AxiosRequestConfig {
  let proxyUrl = (process.env.QUOTAGUARDSTATIC_URL || process.env.QUOTAGUARD_URL || "").trim();
  if (!proxyUrl) {
    return {};
  }
  if (!proxyUrl.startsWith("http://") && !proxyUrl.startsWith("https://")) {
    proxyUrl = `http://${proxyUrl}`;
  }
  const agent = new HttpsProxyAgent(proxyUrl);
  return {
    httpsAgent: agent,
    proxy: false,
  };
}

interface TokenCache {
  accessToken: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;

/**
 * Obtains a valid Bearer token for CinetPay API Aurore (v1).
 * Uses in-memory caching with automatic token regeneration.
 */
export async function getCinetPayToken(): Promise<string> {
  const apiKey = process.env.CINETPAY_API_KEY;
  const apiPassword = process.env.CINETPAY_API_PASSWORD;

  if (!apiKey || !apiPassword) {
    throw new Error("Clés CinetPay manquantes dans les variables d'environnement (CINETPAY_API_KEY, CINETPAY_API_PASSWORD).");
  }

  // Check cached token validity (with a 60-second safety margin)
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) {
    return tokenCache.accessToken;
  }

  const axiosConfig = getAxiosConfig();

  let response;
  try {
    response = await axios.post(
      `${CINETPAY_BASE_URL}/v1/oauth/login`,
      {
        api_key: apiKey,
        api_password: apiPassword,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        ...axiosConfig,
      }
    );
  } catch (err: any) {
    const errorMsg = err.response?.data ? JSON.stringify(err.response.data) : err.message;
    throw new Error(`Échec de l'authentification CinetPay: ${err.response?.status || 500} - ${errorMsg}`);
  }

  const data = response.data;
  const token = data.access_token || data.data?.access_token || data.token;
  const expiresIn = data.expires_in || data.data?.expires_in || 3600;

  if (!token) {
    throw new Error("Aucun access_token retourné par l'API CinetPay Aurore v1.");
  }

  tokenCache = {
    accessToken: token,
    expiresAt: Date.now() + Number(expiresIn) * 1000,
  };

  return token;
}

export interface InitiatePaymentParams {
  merchant_transaction_id: string;
  amount: number;
  designation: string;
  client_email: string;
  client_first_name: string;
  client_last_name: string;
  success_url: string;
  failed_url: string;
  notify_url: string;
}

export interface InitiatePaymentResult {
  payment_url: string;
  raw: any;
}

/**
 * Initiates a payment on CinetPay API Aurore (v1)
 */
export async function initiateCinetPayPayment(
  params: InitiatePaymentParams
): Promise<InitiatePaymentResult> {
  const token = await getCinetPayToken();

  const body = {
    currency: "XOF",
    merchant_transaction_id: params.merchant_transaction_id,
    amount: params.amount,
    lang: "fr",
    designation: params.designation,
    client_email: params.client_email,
    client_first_name: params.client_first_name,
    client_last_name: params.client_last_name,
    success_url: params.success_url,
    failed_url: params.failed_url,
    notify_url: params.notify_url,
  };

  const axiosConfig = getAxiosConfig();

  let response;
  try {
    response = await axios.post(`${CINETPAY_BASE_URL}/v1/payment`, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      ...axiosConfig,
    });
  } catch (err: any) {
    const errorData = err.response?.data;
    const status = err.response?.status;
    console.error("CinetPay payment initiation error:", status, errorData || err.message);
    const message = errorData?.message || errorData?.error || errorData?.description || err.message || `Erreur d'initialisation du paiement CinetPay (${status})`;
    throw new Error(message);
  }

  const resData = response.data;

  console.log("=== CINETPAY PAYMENT RESPONSE DEBUG ===");
  console.log("HTTP Status:", response.status);
  console.log("JSON Body:", JSON.stringify(resData, null, 2));
  console.log("=======================================");

  const paymentUrl =
    resData.payment_url || resData.data?.payment_url || resData.url || resData.data?.url;

  if (!paymentUrl) {
    throw new Error("L'API CinetPay n'a pas retourné de URL de paiement (payment_url).");
  }

  return {
    payment_url: paymentUrl,
    raw: resData,
  };
}

export interface VerifyPaymentResult {
  isSuccessful: boolean;
  status: string;
  raw: any;
}

/**
 * Verifies payment status strictly via server-to-server GET request to CinetPay Aurore v1 API.
 */
export async function verifyCinetPayStatus(
  transactionId: string
): Promise<VerifyPaymentResult> {
  const token = await getCinetPayToken();

  const axiosConfig = getAxiosConfig();

  let resData: any = {};
  try {
    const response = await axios.get(
      `${CINETPAY_BASE_URL}/v1/payment/${encodeURIComponent(transactionId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        ...axiosConfig,
      }
    );
    resData = response.data || {};
  } catch (err: any) {
    console.error("CinetPay status verification error:", err.response?.status, err.response?.data || err.message);
    resData = err.response?.data || {};
  }

  // Extract status from API verification response safely
  const status = (
    resData.status ||
    resData.data?.status ||
    resData.code ||
    resData.data?.code ||
    ""
  ).toString().toUpperCase();

  const isSuccessful =
    status === "ACCEPTED" ||
    status === "SUCCES" ||
    status === "SUCCESS" ||
    resData.data?.status === "ACCEPTED" ||
    resData.data?.status === "SUCCES" ||
    resData.data?.status === "SUCCESS";

  return {
    isSuccessful,
    status,
    raw: resData,
  };
}
