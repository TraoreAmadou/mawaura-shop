
/* scripts/import-postgres.cjs */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function reviveDates(row) {
  // On convertit quelques champs classiques en Date si présents
  const dateKeys = [
    "createdAt",
    "updatedAt",
    "expires",
    "emailVerified",
    "birthdate",
    "paidAt",
  ];
  for (const k of dateKeys) {
    if (row && row[k] && typeof row[k] === "string") {
      const d = new Date(row[k]);
      if (!Number.isNaN(d.getTime())) row[k] = d;
    }
  }
  return row;
}

async function main() {
  const filePath = path.join(process.cwd(), "sqlite-export.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("sqlite-export.json introuvable. Lance d'abord l'export.");
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  // Optionnel : si ta base postgres n’est pas vide, tu peux “vider” proprement.
  // Ici je le fais automatiquement pour éviter collisions.
  // ⚠️ ordre inverse des dépendances (FK)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();

  await prisma.favorite.deleteMany();
  await prisma.cartItem.deleteMany();

  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();

  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  // Import dans l'ordre (parents -> enfants)
  const users = (data.users || []).map(reviveDates);
  if (users.length) await prisma.user.createMany({ data: users, skipDuplicates: true });

  const accounts = (data.accounts || []).map(reviveDates);
  if (accounts.length) await prisma.account.createMany({ data: accounts, skipDuplicates: true });

  const sessions = (data.sessions || []).map(reviveDates);
  if (sessions.length) await prisma.session.createMany({ data: sessions, skipDuplicates: true });

  const verificationTokens = (data.verificationTokens || []).map(reviveDates);
  if (verificationTokens.length)
    await prisma.verificationToken.createMany({ data: verificationTokens, skipDuplicates: true });

  const products = (data.products || []).map(reviveDates);
  if (products.length) await prisma.product.createMany({ data: products, skipDuplicates: true });

  const productImages = (data.productImages || []).map(reviveDates);
  if (productImages.length)
    await prisma.productImage.createMany({ data: productImages, skipDuplicates: true });

  const orders = (data.orders || []).map(reviveDates);
  if (orders.length) await prisma.order.createMany({ data: orders, skipDuplicates: true });

  const orderItems = (data.orderItems || []).map(reviveDates);
  if (orderItems.length)
    await prisma.orderItem.createMany({ data: orderItems, skipDuplicates: true });

  const cartItems = (data.cartItems || []).map(reviveDates);
  if (cartItems.length)
    await prisma.cartItem.createMany({ data: cartItems, skipDuplicates: true });

  const favorites = (data.favorites || []).map(reviveDates);
  if (favorites.length)
    await prisma.favorite.createMany({ data: favorites, skipDuplicates: true });

  console.log("✅ Import terminé dans PostgreSQL (Neon).");
}

main()
  .catch((e) => {
    console.error("❌ Import failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
