

/* scripts/export-sqlite.cjs */
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


async function main() {
  // ⚠️ On exporte table par table (simple et fiable)
  const data = {};

  data.users = await prisma.user.findMany();
  data.accounts = await prisma.account.findMany();
  data.sessions = await prisma.session.findMany();
  data.verificationTokens = await prisma.verificationToken.findMany();

  data.products = await prisma.product.findMany();
  data.productImages = await prisma.productImage.findMany();

  data.cartItems = await prisma.cartItem.findMany();
  data.favorites = await prisma.favorite.findMany();

  data.orders = await prisma.order.findMany();
  data.orderItems = await prisma.orderItem.findMany();

  const outPath = path.join(process.cwd(), "sqlite-export.json");
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf-8");

  console.log("✅ Export terminé :", outPath);
  console.log(
    "Counts:",
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v.length]))
  );
}

main()
  .catch((e) => {
    console.error("❌ Export failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
