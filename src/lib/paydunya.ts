import crypto from "crypto";

function getPayDunyaBaseUrl() {
  const mode = (process.env.PAYDUNYA_MODE || "test").toLowerCase();
  const isTest = mode !== "live" && mode !== "production";
  return isTest
    ? "https://app.paydunya.com/sandbox-api"
    : "https://app.paydunya.com/api";
}

function paydunyaHeaders() {
  const master = process.env.PAYDUNYA_MASTER_KEY;
  const priv = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;

  if (!master || !priv || !token) {
    throw new Error("PAYDUNYA_KEYS_MISSING");
  }

  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": master,
    "PAYDUNYA-PRIVATE-KEY": priv,
    "PAYDUNYA-TOKEN": token,
  };
}

export function sha512MasterKey(masterKey: string) {
  return crypto.createHash("sha512").update(masterKey).digest("hex");
}

export async function paydunyaCreateInvoice(payload: any) {
  const baseUrl = getPayDunyaBaseUrl();
  const res = await fetch(`${baseUrl}/v1/checkout-invoice/create`, {
    method: "POST",
    headers: paydunyaHeaders(),
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.response_code !== "00") {
    const msg = data?.response_text || "PayDunya: erreur création facture";
    throw new Error(msg);
  }

  // response_text = URL de paiement, token = invoice token
  return {
    paymentUrl: data.response_text as string,
    token: data.token as string,
  };
}

export async function paydunyaConfirmInvoice(invoiceToken: string) {
  const baseUrl = getPayDunyaBaseUrl();
  const res = await fetch(
    `${baseUrl}/v1/checkout-invoice/confirm/${encodeURIComponent(invoiceToken)}`,
    { method: "GET", headers: paydunyaHeaders() }
  );

  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.response_code !== "00") {
    const msg = data?.response_text || "PayDunya: erreur confirmation";
    throw new Error(msg);
  }

  return data;
}
