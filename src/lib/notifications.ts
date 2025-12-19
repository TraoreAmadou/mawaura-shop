import { Resend } from "resend";
import { formatXOF } from "@/lib/money";

type ShippingStatus = "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";

type OrderItem = {
  productNameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
};

function mustGetEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getShopUrl() {
  return process.env.SHOP_URL || "http://localhost:3000";
}

function getResend() {
  return new Resend(mustGetEnv("RESEND_API_KEY"));
}

function getAdminRecipients(): string[] {
  const raw =
    process.env.ADMIN_NOTIFICATIONS_EMAILS ||
    process.env.ADMIN_NOTIFICATIONS_EMAIL ||
    "";
  return Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const resend = getResend();
  const from = mustGetEnv("RESEND_FROM");

  const toList = Array.isArray(opts.to) ? opts.to : [opts.to];

  // ✅ Reply-To global (optionnel)
  const replyTo = process.env.MAWAURA_REPLY_TO;

  const { error } = await resend.emails.send({
    from,
    to: toList,
    subject: opts.subject,
    html: opts.html,
    ...(replyTo ? { reply_to: replyTo } : {}),
  });

  if (error) {
    throw new Error(typeof error === "string" ? error : JSON.stringify(error));
  }
}

function shippingLabel(status: ShippingStatus) {
  switch (status) {
    case "PREPARATION":
      return "En préparation";
    case "SHIPPED":
      return "Expédiée";
    case "DELIVERED":
      return "Livrée";
    case "RECEIVED":
      return "Colis reçu";
    default:
      return "En préparation";
  }
}

function baseLayout(title: string, contentHtml: string) {
  return `
  <div style="font-family:Arial,sans-serif;background:#f7f7f7;padding:24px;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #eee;border-radius:16px;overflow:hidden;">
      <div style="padding:18px 22px;background:#111;color:#fff;">
        <div style="letter-spacing:.22em;text-transform:uppercase;font-size:11px;color:#ffd24a;">Mawaura</div>
        <div style="font-size:18px;font-weight:700;margin-top:6px;">${title}</div>
      </div>
      <div style="padding:22px;">
        ${contentHtml}
        <div style="margin-top:22px;padding-top:14px;border-top:1px solid #eee;color:#777;font-size:12px;line-height:1.5;">
          Merci, <b>Mawaura</b> 🌿<br/>
          Si vous avez une question, répondez à cet email.
        </div>
      </div>
    </div>
  </div>
  `;
}

/**
 * ✅ Client : paiement confirmé + commande enregistrée
 */
export async function sendOrderPaidConfirmationEmail(params: {
  to: string;
  orderId: string;
  customerName?: string | null;
  totalCents: number;
  items: OrderItem[];
  shippingAddress?: string | null;
}) {
  const totalXof = params.totalCents / 100;
  const orderUrl = `${getShopUrl()}/compte/commandes/${params.orderId}`;

  const safeAddress = params.shippingAddress
    ? escapeHtml(params.shippingAddress)
    : "";

  const itemsHtml = params.items
    .map((it) => {
      const unit = it.unitPriceCents / 100;
      const line = it.totalPriceCents / 100;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${escapeHtml(
              it.productNameSnapshot
            )}</div>
            <div style="color:#777;font-size:12px;">
              ${it.quantity} × ${formatXOF(unit)} = <b>${formatXOF(line)}</b>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <p style="margin:0 0 10px;color:#333;">
      Bonjour${
        params.customerName ? ` <b>${escapeHtml(params.customerName)}</b>` : ""
      },<br/>
      Votre paiement a bien été confirmé ✅ Votre commande est enregistrée.
    </p>

    <p style="margin:10px 0;color:#333;">
      <b>Commande :</b> <span style="font-family:monospace;">${escapeHtml(
        params.orderId
      )}</span><br/>
      <b>Total :</b> ${formatXOF(totalXof)}
    </p>

    <div style="margin:14px 0;padding:12px 14px;border:1px solid #eee;border-radius:12px;background:#fafafa;">
      <div style="font-weight:700;margin-bottom:6px;">Articles</div>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
      </table>
    </div>

    ${
      params.shippingAddress
        ? `<div style="margin:14px 0;">
            <div style="font-weight:700;margin-bottom:6px;">Adresse de livraison</div>
            <div style="white-space:pre-line;color:#333;border:1px solid #eee;border-radius:12px;padding:12px 14px;background:#fff;">
              ${safeAddress}
            </div>
          </div>`
        : ""
    }

    <a href="${orderUrl}" style="display:inline-block;margin-top:10px;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:999px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">
      Voir ma commande
    </a>
  `;

  await sendEmail({
    to: params.to,
    subject: "Mawaura — Confirmation de commande",
    html: baseLayout("Confirmation de commande", content),
  });
}

/**
 * ✅ Client : suivi (expédiée / livrée / reçue)
 */
export async function sendShippingStatusEmail(params: {
  to: string;
  orderId: string;
  shippingStatus: ShippingStatus;
}) {
  const label = shippingLabel(params.shippingStatus);
  const orderUrl = `${getShopUrl()}/compte/commandes/${params.orderId}`;

  let message = "";
  if (params.shippingStatus === "SHIPPED") {
    message = "Votre commande a été expédiée. Elle est en route ✅";
  } else if (params.shippingStatus === "DELIVERED") {
    message =
      "Votre commande a été livrée. Elle devrait vous parvenir très bientôt ✅";
  } else if (params.shippingStatus === "RECEIVED") {
    message =
      "Merci ✨ Le colis est marqué comme reçu. Nous espérons que vos bijoux vous plaisent.";
  } else {
    message = "Votre commande est en cours de préparation.";
  }

  const content = `
    <p style="margin:0 0 10px;color:#333;">
      Mise à jour de votre commande <span style="font-family:monospace;">${escapeHtml(
        params.orderId
      )}</span>
    </p>

    <div style="margin:12px 0;padding:12px 14px;border:1px solid #e8e8e8;border-radius:12px;background:#fafafa;">
      <div style="font-weight:700;color:#111;">Statut : ${label}</div>
      <div style="margin-top:6px;color:#333;">${escapeHtml(message)}</div>
    </div>

    <a href="${orderUrl}" style="display:inline-block;margin-top:10px;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:999px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">
      Suivre ma commande
    </a>
  `;

  await sendEmail({
    to: params.to,
    subject: `Mawaura — ${label}`,
    html: baseLayout("Suivi de commande", content),
  });
}

/**
 * ✅ NOUVEAU : Admin interne — “Nouvelle commande payée”
 * (super utile pour préparer les commandes au quotidien)
 *
 * Env requis :
 * - ADMIN_NOTIFICATIONS_EMAILS="a@x.com,b@y.com" (ou ADMIN_NOTIFICATIONS_EMAIL)
 */
export async function sendAdminNewPaidOrderEmail(params: {
  orderId: string;
  customerEmail: string;
  customerName?: string | null;
  totalCents: number;
  items: OrderItem[];
  shippingAddress?: string | null;
  notes?: string | null;
}) {
  const admins = getAdminRecipients();
  if (admins.length === 0) return; // pas configuré => on ne bloque pas

  const totalXof = params.totalCents / 100;
  const adminOrderUrl = `${getShopUrl()}/admin/commandes/${params.orderId}`;

  const safeAddress = params.shippingAddress
    ? escapeHtml(params.shippingAddress)
    : "";

  const safeNotes = params.notes ? escapeHtml(params.notes) : "";

  const itemsHtml = params.items
    .map((it) => {
      const unit = it.unitPriceCents / 100;
      const line = it.totalPriceCents / 100;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${escapeHtml(
              it.productNameSnapshot
            )}</div>
            <div style="color:#777;font-size:12px;">
              ${it.quantity} × ${formatXOF(unit)} = <b>${formatXOF(line)}</b>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  const content = `
    <p style="margin:0 0 10px;color:#333;">
      ✅ Une <b>nouvelle commande a été payée</b>.
    </p>

    <div style="margin:12px 0;padding:12px 14px;border:1px solid #e8e8e8;border-radius:12px;background:#fafafa;">
      <div style="color:#111;"><b>Commande :</b> <span style="font-family:monospace;">${escapeHtml(
        params.orderId
      )}</span></div>
      <div style="color:#111;margin-top:6px;"><b>Total :</b> ${formatXOF(
        totalXof
      )}</div>
      <div style="color:#111;margin-top:6px;">
        <b>Client :</b> ${escapeHtml(
          params.customerName || "Client Mawaura"
        )} — ${escapeHtml(params.customerEmail)}
      </div>
    </div>

    <div style="margin:14px 0;padding:12px 14px;border:1px solid #eee;border-radius:12px;background:#fff;">
      <div style="font-weight:700;margin-bottom:6px;">Articles</div>
      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
      </table>
    </div>

    ${
      params.shippingAddress
        ? `<div style="margin:14px 0;">
            <div style="font-weight:700;margin-bottom:6px;">Adresse de livraison</div>
            <div style="white-space:pre-line;color:#333;border:1px solid #eee;border-radius:12px;padding:12px 14px;background:#fff;">
              ${safeAddress}
            </div>
          </div>`
        : ""
    }

    ${
      params.notes
        ? `<div style="margin:14px 0;">
            <div style="font-weight:700;margin-bottom:6px;">Notes client</div>
            <div style="white-space:pre-line;color:#333;border:1px solid #eee;border-radius:12px;padding:12px 14px;background:#fff;">
              ${safeNotes}
            </div>
          </div>`
        : ""
    }

    <a href="${adminOrderUrl}" style="display:inline-block;margin-top:10px;background:#111;color:#fff;text-decoration:none;padding:10px 14px;border-radius:999px;font-size:12px;letter-spacing:.18em;text-transform:uppercase;">
      Ouvrir dans l’admin
    </a>
  `;

  await sendEmail({
    to: admins,
    subject: `✅ Nouvelle commande payée — ${params.orderId.slice(0, 8)}… (${formatXOF(
      totalXof
    )})`,
    html: baseLayout("Nouvelle commande payée", content),
  });
}
