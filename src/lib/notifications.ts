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

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  const from = mustGetEnv("RESEND_FROM");

  const { error } = await resend.emails.send({
    from,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
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
    ? params.shippingAddress.replace(/</g, "&lt;").replace(/>/g, "&gt;")
    : "";

  const itemsHtml = params.items
    .map((it) => {
      const unit = it.unitPriceCents / 100;
      const line = it.totalPriceCents / 100;
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${it.productNameSnapshot}</div>
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
      Bonjour${params.customerName ? ` <b>${params.customerName}</b>` : ""},<br/>
      Votre paiement a bien été confirmé ✅ Votre commande est enregistrée.
    </p>

    <p style="margin:10px 0;color:#333;">
      <b>Commande :</b> <span style="font-family:monospace;">${params.orderId}</span><br/>
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
    message = "Votre commande a été livrée. Elle devrait vous parvenir très bientôt ✅";
  } else if (params.shippingStatus === "RECEIVED") {
    message =
      "Merci ✨ Le colis est marqué comme reçu. Nous espérons que vos bijoux vous plaisent.";
  } else {
    message = "Votre commande est en cours de préparation.";
  }

  const content = `
    <p style="margin:0 0 10px;color:#333;">
      Mise à jour de votre commande <span style="font-family:monospace;">${params.orderId}</span>
    </p>

    <div style="margin:12px 0;padding:12px 14px;border:1px solid #e8e8e8;border-radius:12px;background:#fafafa;">
      <div style="font-weight:700;color:#111;">Statut : ${label}</div>
      <div style="margin-top:6px;color:#333;">${message}</div>
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
