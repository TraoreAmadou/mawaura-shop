import { formatXOF } from "@/lib/money";

type OrderEmailItem = {
  productNameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
};

export function orderConfirmationTemplate(input: {
  brandName?: string;
  orderId: string;
  customerName?: string | null;
  email: string;
  totalCents: number;
  items: OrderEmailItem[];
  shippingAddress?: string | null;
  notes?: string | null;
}) {
  const brand = input.brandName || "Mawaura";
  const shortId = input.orderId.slice(0, 8);
  const total = formatXOF(input.totalCents / 100);

  const itemsHtml = input.items
    .map((it) => {
      const lineTotal = formatXOF(it.totalPriceCents / 100);
      const unit = formatXOF(it.unitPriceCents / 100);
      return `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #eee;">
            <div style="font-weight:600;color:#111;">${escapeHtml(
              it.productNameSnapshot
            )}</div>
            <div style="color:#666;font-size:12px;">
              ${it.quantity} × ${unit}
            </div>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:600;color:#111;">
            ${lineTotal}
          </td>
        </tr>
      `;
    })
    .join("");

  const addressBlock = input.shippingAddress
    ? `<p style="margin:6px 0;color:#333;white-space:pre-line;">${escapeHtml(
        input.shippingAddress
      )}</p>`
    : `<p style="margin:6px 0;color:#666;">(non renseignée)</p>`;

  const notesBlock = input.notes
    ? `<p style="margin:6px 0;color:#333;white-space:pre-line;">${escapeHtml(
        input.notes
      )}</p>`
    : `<p style="margin:6px 0;color:#666;">(aucune)</p>`;

  const nameLine = input.customerName
    ? `Bonjour ${escapeHtml(input.customerName)},`
    : `Bonjour,`;

  const subject = `${brand} — Confirmation de commande #${shortId}`;

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
    <h2 style="margin:0 0 8px 0;">${brand}</h2>
    <p style="margin:0 0 18px 0;color:#555;font-size:13px;">
      Confirmation de commande
    </p>

    <p style="margin:0 0 16px 0;">${nameLine}</p>
    <p style="margin:0 0 18px 0;color:#333;">
      Merci pour votre achat 🌿 Votre commande <b>#${escapeHtml(
        shortId
      )}</b> a bien été enregistrée.
    </p>

    <div style="border:1px solid #eee;border-radius:16px;padding:16px;background:#fafafa;">
      <div style="display:flex;justify-content:space-between;gap:12px;">
        <div>
          <div style="font-size:12px;color:#666;">Commande</div>
          <div style="font-weight:700;">#${escapeHtml(shortId)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:12px;color:#666;">Total</div>
          <div style="font-weight:700;">${total}</div>
        </div>
      </div>
    </div>

    <h3 style="margin:22px 0 10px 0;">Récapitulatif</h3>
    <table style="width:100%;border-collapse:collapse;">
      ${itemsHtml}
      <tr>
        <td style="padding:12px 0;text-align:right;color:#666;">Total</td>
        <td style="padding:12px 0;text-align:right;font-weight:800;">${total}</td>
      </tr>
    </table>

    <h3 style="margin:22px 0 10px 0;">Adresse de livraison</h3>
    ${addressBlock}

    <h3 style="margin:22px 0 10px 0;">Notes</h3>
    ${notesBlock}

    <p style="margin:26px 0 0 0;color:#777;font-size:12px;">
      Si vous avez une question, répondez à cet email.
    </p>
  </div>
  `;

  const text = `${brand}\n\n${nameLine}\nMerci pour votre achat. Commande #${shortId}\nTotal: ${total}\n`;

  return { subject, html, text };
}

export function shippingUpdateTemplate(input: {
  brandName?: string;
  orderId: string;
  customerName?: string | null;
  shippingStatus: "PREPARATION" | "SHIPPED" | "DELIVERED" | "RECEIVED";
}) {
  const brand = input.brandName || "Mawaura";
  const shortId = input.orderId.slice(0, 8);

  const label =
    input.shippingStatus === "PREPARATION"
      ? "En préparation"
      : input.shippingStatus === "SHIPPED"
      ? "Expédiée"
      : input.shippingStatus === "DELIVERED"
      ? "Livrée"
      : "Colis reçu";

  const message =
    input.shippingStatus === "PREPARATION"
      ? "Votre commande est en cours de préparation."
      : input.shippingStatus === "SHIPPED"
      ? "Votre commande est expédiée."
      : input.shippingStatus === "DELIVERED"
      ? "Votre commande a été livrée."
      : "Merci ✨ Nous sommes ravis que votre colis soit bien arrivé.";

  const subject = `${brand} — Suivi commande #${shortId} : ${label}`;

  const hello = input.customerName
    ? `Bonjour ${escapeHtml(input.customerName)},`
    : "Bonjour,";

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#111;">
    <h2 style="margin:0 0 8px 0;">${brand}</h2>
    <p style="margin:0 0 18px 0;color:#555;font-size:13px;">
      Mise à jour du suivi
    </p>

    <p style="margin:0 0 16px 0;">${hello}</p>
    <p style="margin:0 0 10px 0;color:#333;">
      Commande <b>#${escapeHtml(shortId)}</b> — Statut : <b>${label}</b>
    </p>
    <div style="border:1px solid #eee;border-radius:16px;padding:16px;background:#fafafa;">
      <p style="margin:0;color:#333;">${message}</p>
    </div>

    <p style="margin:22px 0 0 0;color:#777;font-size:12px;">
      Si vous avez une question, répondez à cet email.
    </p>
  </div>
  `;

  const text = `${brand}\nCommande #${shortId}\nStatut: ${label}\n${message}`;

  return { subject, html, text };
}

function escapeHtml(str: string) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
