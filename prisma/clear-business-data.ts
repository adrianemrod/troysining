import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Wipes all business data (clients, orders, production, deliveries, expenses,
// files, notes, product catalog, activity log) while leaving User, Invite,
// and PasswordResetToken untouched — so every team member's login keeps
// working exactly as it does today. Meant for a one-time "start fresh" reset
// of a real deployment, not for local demo resets (use `npm run db:reset`
// for that instead, which also reseeds sample data).
async function main() {
  const confirmed = process.argv.includes("--confirm");
  if (!confirmed) {
    console.log(
      "This will PERMANENTLY delete every client, order, product, expense, file, note, and activity log entry.\n" +
        "User accounts and logins are left untouched.\n\n" +
        "This cannot be undone. If you're sure, re-run with:\n" +
        "  npx tsx prisma/clear-business-data.ts --confirm\n"
    );
    process.exit(1);
  }

  console.log("Clearing business data (accounts are kept)...\n");

  const results = {
    activityLogs: await prisma.activityLog.deleteMany(),
    expenses: await prisma.expense.deleteMany(),
    files: await prisma.file.deleteMany(),
    productionStatusLogs: await prisma.productionStatusLog.deleteMany(),
    productionJobs: await prisma.productionJob.deleteMany(),
    deliveries: await prisma.delivery.deleteMany(),
    orderItems: await prisma.orderItem.deleteMany(),
    orders: await prisma.order.deleteMany(),
    clientNotes: await prisma.clientNote.deleteMany(),
    clients: await prisma.client.deleteMany(),
    products: await prisma.product.deleteMany(),
  };

  for (const [table, result] of Object.entries(results)) {
    console.log(`  ${table}: ${result.count} deleted`);
  }

  const remainingUsers = await prisma.user.count();
  console.log(`\nDone. ${remainingUsers} user account(s) kept as-is — everyone can still log in.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
