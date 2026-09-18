import { PrismaClient, Role, ClientType, LeadStage, ProductionStage, DeliveryMethod, DeliveryStatus, FileCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import { mkdir, writeFile, copyFile } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

function daysFromNow(days: number, hour = 17, minute = 0): Date {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Seeding Troysining Printing Management System...");

  // -------------------------------------------------------------------
  // Clean slate
  // -------------------------------------------------------------------
  await prisma.activityLog.deleteMany();
  await prisma.file.deleteMany();
  await prisma.productionStatusLog.deleteMany();
  await prisma.productionJob.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.clientNote.deleteMany();
  await prisma.client.deleteMany();
  await prisma.product.deleteMany();
  await prisma.invite.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.user.deleteMany();

  // -------------------------------------------------------------------
  // Users — one per role
  // -------------------------------------------------------------------
  const defaultPassword = await hash("Troysining123!");

  const admin = await prisma.user.create({
    data: {
      name: "Rafael Troyo",
      email: "admin@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.ADMIN,
      avatarColor: "#1f3f5b",
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: "Bianca Reyes",
      email: "sales@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.SALES,
      avatarColor: "#e08b2e",
    },
  });

  const sales2 = await prisma.user.create({
    data: {
      name: "Marco Villareal",
      email: "marco.sales@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.SALES,
      avatarColor: "#3f7a5b",
    },
  });

  const production = await prisma.user.create({
    data: {
      name: "Dennis Ocampo",
      email: "production@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.PRODUCTION,
      avatarColor: "#6b4fa0",
    },
  });

  const production2 = await prisma.user.create({
    data: {
      name: "Liza Santos",
      email: "liza.production@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.PRODUCTION,
      avatarColor: "#c2506b",
    },
  });

  const delivery = await prisma.user.create({
    data: {
      name: "Jomar Cruz",
      email: "delivery@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.DELIVERY,
      avatarColor: "#2e8ba3",
    },
  });

  const encoder = await prisma.user.create({
    data: {
      name: "Kim Abella",
      email: "encoder@troysining.ph",
      passwordHash: defaultPassword,
      role: Role.ENCODER,
      avatarColor: "#8a8a2e",
    },
  });

  console.log("Created 7 users (5 roles, sales/production doubled up)");

  // -------------------------------------------------------------------
  // Products
  // -------------------------------------------------------------------
  const productDefs = [
    { name: "Tarpaulin Print (Standard)", category: "Signage", unit: "sqft", unitPrice: 25, turnaroundDays: 2, specs: "Glossy or matte, eyelets included" },
    { name: "Vinyl Banner (Heavy Duty)", category: "Signage", unit: "sqft", unitPrice: 45, turnaroundDays: 3, specs: "13oz vinyl, reinforced hems" },
    { name: "Business Cards (Box of 100)", category: "Print Collateral", unit: "box", unitPrice: 350, turnaroundDays: 3, specs: "300gsm matte or glossy, double-sided" },
    { name: "Flyers (A5, Full Color)", category: "Print Collateral", unit: "100 pcs", unitPrice: 450, turnaroundDays: 2, specs: "150gsm art paper" },
    { name: "Brochures (Tri-fold)", category: "Print Collateral", unit: "100 pcs", unitPrice: 900, turnaroundDays: 4, specs: "170gsm, full color both sides" },
    { name: "Custom Stickers (Die-cut)", category: "Stickers & Labels", unit: "sheet", unitPrice: 60, turnaroundDays: 2, specs: "Vinyl, waterproof laminate" },
    { name: "Packaging Boxes (Custom Print)", category: "Packaging", unit: "box", unitPrice: 18, turnaroundDays: 5, specs: "Kraft or white board, custom die-line" },
    { name: "ID Lace / Lanyard (Printed)", category: "Promotional", unit: "piece", unitPrice: 35, turnaroundDays: 4, specs: "Polyester, custom logo print" },
    { name: "Wall Calendar (13-page)", category: "Print Collateral", unit: "piece", unitPrice: 120, turnaroundDays: 6, specs: "A3, spiral bound, full color" },
    { name: "Invitation Cards (Premium)", category: "Print Collateral", unit: "50 pcs", unitPrice: 1500, turnaroundDays: 7, specs: "Specialty paper, foil option" },
    { name: "T-Shirt Printing (Sublimation)", category: "Apparel", unit: "piece", unitPrice: 220, turnaroundDays: 5, specs: "Cotton blend, full color sublimation" },
    { name: "Menu Board (Rigid PVC)", category: "Signage", unit: "piece", unitPrice: 850, turnaroundDays: 4, specs: "5mm PVC board, UV printed" },
  ];
  const products = await Promise.all(
    productDefs.map((p) => prisma.product.create({ data: p }))
  );
  console.log(`Created ${products.length} products`);

  const byName = (n: string) => products.find((p) => p.name === n)!;

  // -------------------------------------------------------------------
  // Clients
  // -------------------------------------------------------------------
  const clientDefs: Array<{
    name: string; businessName?: string; contactNumber: string; fbHandle?: string;
    email?: string; address: string; clientType: ClientType; leadStage: LeadStage; salesOwnerId: string;
  }> = [
    { name: "Maria Golden", businessName: "Golden Crust Bakery", contactNumber: "0917-234-5678", fbHandle: "fb.com/goldencrustbakeryph", email: "maria@goldencrust.ph", address: "Poblacion, Naga City, Camarines Sur", clientType: ClientType.REPEAT, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales.id },
    { name: "Atty. Ramon Dela Cruz", businessName: "Dela Cruz Law Office", contactNumber: "0918-345-6789", fbHandle: "fb.com/delacruzlawph", email: "ramon@delacruzlaw.ph", address: "Legazpi City, Albay", clientType: ClientType.ONE_TIME, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales.id },
    { name: "Kristine Manalo", businessName: "Manila Fiesta Events", contactNumber: "0919-456-7890", fbHandle: "fb.com/manilafiestaevents", email: "kristine@manilafiesta.ph", address: "Quezon City, Metro Manila", clientType: ClientType.REPEAT, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales2.id },
    { name: "Bake & Co Team", businessName: "Bake & Co", contactNumber: "0920-567-8901", fbHandle: "fb.com/bakeandcoph", email: "hello@bakeandco.ph", address: "Iloilo City, Iloilo", clientType: ClientType.REPEAT, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales.id },
    { name: "Nena Villanueva", businessName: "Sari-Sari Corner Store", contactNumber: "0921-678-9012", fbHandle: "fb.com/nenassaristore", address: "Daraga, Albay", clientType: ClientType.ONE_TIME, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales2.id },
    { name: "Fr. Michael Santos", businessName: "St. Anthony Parish", contactNumber: "0922-789-0123", fbHandle: "fb.com/stanthonyparishlegazpi", email: "parish@stanthony.ph", address: "Legazpi City, Albay", clientType: ClientType.REPEAT, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales.id },
    { name: "Coach Erwin Tan", businessName: "Cebu Sports Fest", contactNumber: "0923-890-1234", fbHandle: "fb.com/cebusportsfest", email: "erwin@cebusportsfest.ph", address: "Cebu City, Cebu", clientType: ClientType.ONE_TIME, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales2.id },
    { name: "Angelo Dagupan", businessName: "Dagupan Realty", contactNumber: "0924-901-2345", fbHandle: "fb.com/dagupanrealty", email: "angelo@dagupanrealty.ph", address: "Dagupan City, Pangasinan", clientType: ClientType.REPEAT, leadStage: LeadStage.CONFIRMED, salesOwnerId: sales.id },
    { name: "Juan Bautista", businessName: "Juan's Auto Repair", contactNumber: "0925-012-3456", fbHandle: "fb.com/juansautorepair", address: "Batangas City, Batangas", clientType: ClientType.REPEAT, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales2.id },
    { name: "Grace Hizon", contactNumber: "0926-123-4567", fbHandle: "fb.com/grace.hizon", email: "grace.hizon@gmail.com", address: "Vigan City, Ilocos Sur", clientType: ClientType.ONE_TIME, leadStage: LeadStage.CONFIRMED, salesOwnerId: sales.id },
    { name: "Engr. Paolo Villanueva", businessName: "Municipal Hall of San Fernando", contactNumber: "0927-234-5678", fbHandle: "fb.com/sanfernandolgu", email: "paolo@sanfernando.gov.ph", address: "San Fernando City, La Union", clientType: ClientType.REPEAT, leadStage: LeadStage.CONFIRMED, salesOwnerId: sales2.id },
    { name: "Teresa Lim", businessName: "Green Leaf Cafe", contactNumber: "0928-345-6789", fbHandle: "fb.com/greenleafcafeph", email: "teresa@greenleafcafe.ph", address: "Baguio City, Benguet", clientType: ClientType.REPEAT, leadStage: LeadStage.CLOSED, salesOwnerId: sales.id },
    { name: "Roberto Rosario", businessName: "Rosario Trading", contactNumber: "0929-456-7890", fbHandle: "fb.com/rosariotrading", email: "roberto@rosariotrading.ph", address: "Tarlac City, Tarlac", clientType: ClientType.REPEAT, leadStage: LeadStage.CLOSED, salesOwnerId: sales2.id },
    { name: "Ella Fernandez", businessName: "Fernandez Family Reunion", contactNumber: "0930-567-8901", fbHandle: "fb.com/ella.fernandez", address: "Antipolo City, Rizal", clientType: ClientType.ONE_TIME, leadStage: LeadStage.IN_PRODUCTION, salesOwnerId: sales.id },
    // pure leads — no orders yet, populate the CRM pipeline
    { name: "Carlo Mendoza", businessName: "Mendoza Hardware", contactNumber: "0931-678-9012", fbHandle: "fb.com/mendozahardware", address: "San Pablo City, Laguna", clientType: ClientType.ONE_TIME, leadStage: LeadStage.NEW_INQUIRY, salesOwnerId: sales.id },
    { name: "Divine Aquino", businessName: "Divine Flower Shop", contactNumber: "0932-789-0123", fbHandle: "fb.com/divineflowershop", address: "Lipa City, Batangas", clientType: ClientType.ONE_TIME, leadStage: LeadStage.NEW_INQUIRY, salesOwnerId: sales2.id },
    { name: "Sonny Ibañez", businessName: "Ibañez Construction Supply", contactNumber: "0933-890-1234", fbHandle: "fb.com/ibanezconstruction", address: "Cagayan de Oro City, Misamis Oriental", clientType: ClientType.ONE_TIME, leadStage: LeadStage.QUOTED, salesOwnerId: sales.id },
  ];

  const clients = await Promise.all(
    clientDefs.map((c) => prisma.client.create({ data: c }))
  );
  console.log(`Created ${clients.length} clients`);

  const clientByBiz = (n: string) => clients.find((c) => c.businessName === n || c.name === n)!;

  // Notes/timeline for a few clients
  await prisma.clientNote.createMany({
    data: [
      { clientId: clientByBiz("Golden Crust Bakery").id, authorId: sales.id, content: "FB Messenger inquiry for grand opening tarps. Sent quote same day, client approved via chat screenshot." },
      { clientId: clientByBiz("Golden Crust Bakery").id, authorId: sales.id, content: "Repeat client — 3rd order this year. Always pays 50% downpayment upfront." },
      { clientId: clientByBiz("Dela Cruz Law Office").id, authorId: sales.id, content: "Referred by Atty. Santos. Wants premium matte business cards, gold foil accent on logo." },
      { clientId: clientByBiz("Manila Fiesta Events").id, authorId: sales2.id, content: "Regular events client — books tarps + stickers bundle monthly for client activations." },
      { clientId: clientByBiz("Sari-Sari Corner Store").id, authorId: sales2.id, content: "Rush order — needs flyers before barangay fiesta this weekend. Client is anxious about timeline, please prioritize." },
      { clientId: clientByBiz("Ibañez Construction Supply").id, authorId: sales.id, content: "Requested quotation for tarps + vinyl banners for 2 branches. Awaiting confirmation of specs." },
    ],
  });

  // -------------------------------------------------------------------
  // Orders — deliberately spread across overdue / today / this week / later / done
  // -------------------------------------------------------------------
  let orderCounter = 1001;
  function nextOrderNumber() {
    return `TPS-${orderCounter++}`;
  }

  type OrderPlan = {
    client: string;
    salespersonId: string;
    dueInDays: number;
    dueHour?: number;
    items: { product: string; quantity: number; specs?: string }[];
    downpaymentRatio: number;
    status: LeadStage;
    production?: { stage: ProductionStage; assignedStaffId: string; startedDaysAgo?: number };
    delivery?: { method: DeliveryMethod; status: DeliveryStatus; riderId?: string; deliveryDayOffset?: number };
    notes?: string;
  };

  const orderPlans: OrderPlan[] = [
    // --- OVERDUE, still in production (urgent!) ---
    {
      client: "Golden Crust Bakery", salespersonId: sales.id, dueInDays: -2,
      items: [{ product: "Tarpaulin Print (Standard)", quantity: 40, specs: "10x6ft grand opening banner x2" }],
      downpaymentRatio: 0.5, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.PRINTING, assignedStaffId: production.id, startedDaysAgo: 3 },
      notes: "Client already asking for updates — grand opening was moved up.",
    },
    {
      client: "Dela Cruz Law Office", salespersonId: sales.id, dueInDays: -1,
      items: [{ product: "Business Cards (Box of 100)", quantity: 5, specs: "Matte, gold foil logo" }],
      downpaymentRatio: 1, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.DESIGNING, assignedStaffId: production2.id, startedDaysAgo: 1 },
      notes: "Design revisions took longer than expected — client approved final art late.",
    },
    // --- DUE TODAY ---
    {
      client: "Manila Fiesta Events", salespersonId: sales2.id, dueInDays: 0, dueHour: 14,
      items: [{ product: "Custom Stickers (Die-cut)", quantity: 20, specs: "Event logo die-cut, waterproof" }],
      downpaymentRatio: 0.5, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.FINISHING, assignedStaffId: production.id, startedDaysAgo: 2 },
    },
    {
      client: "Bake & Co", salespersonId: sales.id, dueInDays: 0, dueHour: 16,
      items: [{ product: "Packaging Boxes (Custom Print)", quantity: 300, specs: "Kraft, pastry box, custom die-line" }],
      downpaymentRatio: 0.5, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.QUALITY_CHECK, assignedStaffId: production2.id, startedDaysAgo: 4 },
    },
    {
      client: "Sari-Sari Corner Store", salespersonId: sales2.id, dueInDays: 0, dueHour: 18,
      items: [{ product: "Flyers (A5, Full Color)", quantity: 200, specs: "Barangay fiesta promo flyer" }],
      downpaymentRatio: 1, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.PENDING, assignedStaffId: production.id },
      notes: "RUSH — client anxious, still not started. Flag as at-risk.",
    },
    {
      client: "Fernandez Family Reunion", salespersonId: sales.id, dueInDays: 0, dueHour: 10,
      items: [{ product: "Tarpaulin Print (Standard)", quantity: 24, specs: "Family reunion backdrop, 8x4ft" }],
      downpaymentRatio: 1, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.READY_FOR_DELIVERY, assignedStaffId: production2.id, startedDaysAgo: 3 },
      delivery: { method: DeliveryMethod.PICKUP, status: DeliveryStatus.PREPARING },
      notes: "Ready for delivery — client will pick up this afternoon.",
    },
    // --- THIS WEEK ---
    {
      client: "St. Anthony Parish", salespersonId: sales.id, dueInDays: 1,
      items: [{ product: "Vinyl Banner (Heavy Duty)", quantity: 30, specs: "Fiesta banner, 12x5ft" }],
      downpaymentRatio: 0.5, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.PRINTING, assignedStaffId: production.id, startedDaysAgo: 1 },
    },
    {
      client: "Cebu Sports Fest", salespersonId: sales2.id, dueInDays: 3,
      items: [{ product: "T-Shirt Printing (Sublimation)", quantity: 80, specs: "Team jerseys, full color sublimation" }],
      downpaymentRatio: 0.5, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.DESIGNING, assignedStaffId: production2.id, startedDaysAgo: 0 },
    },
    {
      client: "Juan's Auto Repair", salespersonId: sales2.id, dueInDays: 5,
      items: [{ product: "Custom Stickers (Die-cut)", quantity: 15, specs: "Shop logo sticker pack" }],
      downpaymentRatio: 0.5, status: LeadStage.IN_PRODUCTION,
      production: { stage: ProductionStage.PRINTING, assignedStaffId: production.id, startedDaysAgo: 1 },
    },
    {
      client: "Dagupan Realty", salespersonId: sales.id, dueInDays: 6,
      items: [{ product: "Brochures (Tri-fold)", quantity: 300, specs: "Property listings, tri-fold, glossy" }],
      downpaymentRatio: 0.3, status: LeadStage.CONFIRMED,
    },
    // --- LATER (beyond this week) ---
    {
      client: "Grace Hizon", salespersonId: sales.id, dueInDays: 14,
      items: [{ product: "Invitation Cards (Premium)", quantity: 100, specs: "Wedding invites, foil accent" }],
      downpaymentRatio: 0.5, status: LeadStage.CONFIRMED,
    },
    {
      client: "Municipal Hall of San Fernando", salespersonId: sales2.id, dueInDays: 10,
      items: [{ product: "ID Lace / Lanyard (Printed)", quantity: 250, specs: "LGU staff ID lanyards" }],
      downpaymentRatio: 0.5, status: LeadStage.CONFIRMED,
    },
    // --- ALREADY DELIVERED / CLOSED (history) ---
    {
      client: "Green Leaf Cafe", salespersonId: sales.id, dueInDays: -10,
      items: [{ product: "Menu Board (Rigid PVC)", quantity: 3, specs: "Rigid PVC, UV printed menu boards" }],
      downpaymentRatio: 1, status: LeadStage.CLOSED,
      production: { stage: ProductionStage.COMPLETED, assignedStaffId: production.id, startedDaysAgo: 14 },
      delivery: { method: DeliveryMethod.IN_HOUSE, status: DeliveryStatus.DELIVERED, riderId: delivery.id, deliveryDayOffset: -9 },
    },
    {
      client: "Rosario Trading", salespersonId: sales2.id, dueInDays: -20,
      items: [{ product: "Wall Calendar (13-page)", quantity: 150, specs: "Company calendar, 2027 edition" }],
      downpaymentRatio: 1, status: LeadStage.CLOSED,
      production: { stage: ProductionStage.COMPLETED, assignedStaffId: production2.id, startedDaysAgo: 26 },
      delivery: { method: DeliveryMethod.COURIER, status: DeliveryStatus.DELIVERED, riderId: delivery.id, deliveryDayOffset: -18 },
    },
  ];

  for (const plan of orderPlans) {
    const client = clientByBiz(plan.client);
    const items = plan.items.map((it) => {
      const product = byName(it.product);
      const unitPrice = Number(product.unitPrice);
      const subtotal = unitPrice * it.quantity;
      return { productId: product.id, quantity: it.quantity, unitPrice, specs: it.specs, subtotal };
    });
    const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
    const downpayment = Math.round(totalAmount * plan.downpaymentRatio * 100) / 100;

    const order = await prisma.order.create({
      data: {
        orderNumber: nextOrderNumber(),
        clientId: client.id,
        salespersonId: plan.salespersonId,
        status: plan.status,
        dueDate: daysFromNow(plan.dueInDays, plan.dueHour ?? 17),
        totalAmount,
        downpayment,
        notes: plan.notes,
        items: { create: items },
      },
    });

    if (plan.production) {
      const job = await prisma.productionJob.create({
        data: {
          orderId: order.id,
          stage: plan.production.stage,
          assignedStaffId: plan.production.assignedStaffId,
          startedAt: plan.production.startedDaysAgo != null ? daysFromNow(-plan.production.startedDaysAgo, 9) : undefined,
          isAtRisk: plan.dueInDays <= 0 && plan.production.stage !== ProductionStage.COMPLETED && plan.production.stage !== ProductionStage.READY_FOR_DELIVERY,
        },
      });
      await prisma.productionStatusLog.create({
        data: {
          productionJobId: job.id,
          stage: plan.production.stage,
          note: `Moved to ${plan.production.stage.replace(/_/g, " ")}`,
          authorId: plan.production.assignedStaffId,
        },
      });
    }

    if (plan.delivery) {
      await prisma.delivery.create({
        data: {
          orderId: order.id,
          method: plan.delivery.method,
          status: plan.delivery.status,
          riderId: plan.delivery.riderId,
          deliveryDate: plan.delivery.deliveryDayOffset != null ? daysFromNow(plan.delivery.deliveryDayOffset, 13) : undefined,
          address: client.address,
        },
      });
    }
  }

  console.log(`Created ${orderPlans.length} orders with production/delivery records`);

  // -------------------------------------------------------------------
  // Sample files (a couple of real placeholder files on disk + DB records)
  // -------------------------------------------------------------------
  const storageRoot = path.join(process.cwd(), "storage");
  const goldenCrust = clientByBiz("Golden Crust Bakery");
  const delaCruz = clientByBiz("Dela Cruz Law Office");
  const manilaFiesta = clientByBiz("Manila Fiesta Events");

  async function seedFile(clientId: string, filename: string, category: FileCategory, uploadedById: string, makeImageCopy = false) {
    const dir = path.join(storageRoot, clientId);
    await mkdir(dir, { recursive: true });
    const dest = path.join(dir, filename);
    if (makeImageCopy) {
      const logoPath = path.join(process.cwd(), "public", "logo.png");
      await copyFile(logoPath, dest);
    } else {
      await writeFile(dest, `Placeholder content for ${filename}\nClient: ${clientId}\nGenerated by seed script.\n`);
    }
    return prisma.file.create({
      data: {
        clientId,
        uploadedById,
        filename,
        url: `/api/files/serve/${clientId}/${filename}`,
        mimeType: makeImageCopy ? "image/png" : "text/plain",
        category,
      },
    });
  }

  await seedFile(goldenCrust.id, "grand-opening-tarp-proof.png", FileCategory.PROOF, production.id, true);
  await seedFile(goldenCrust.id, "fb-chat-inquiry.txt", FileCategory.FB_SCREENSHOT, sales.id);
  await seedFile(delaCruz.id, "business-card-final-design.png", FileCategory.FINAL, production2.id, true);
  await seedFile(delaCruz.id, "service-agreement.txt", FileCategory.CONTRACT, sales.id);
  await seedFile(manilaFiesta.id, "sticker-die-cut-proof.png", FileCategory.PROOF, production.id, true);

  console.log("Seeded sample files");

  // -------------------------------------------------------------------
  // Activity log
  // -------------------------------------------------------------------
  await prisma.activityLog.createMany({
    data: [
      { userId: admin.id, action: "SYSTEM_SEEDED", entityType: "System", details: "Database seeded with demo data" },
      { userId: sales.id, action: "CLIENT_CREATED", entityType: "Client", entityId: goldenCrust.id, details: "Added Golden Crust Bakery as a repeat client" },
      { userId: sales.id, action: "ORDER_CREATED", entityType: "Order", details: "Created order TPS-1001 for Golden Crust Bakery" },
      { userId: production.id, action: "PRODUCTION_STAGE_UPDATED", entityType: "ProductionJob", details: "Moved Golden Crust Bakery job to Printing" },
      { userId: delivery.id, action: "DELIVERY_STATUS_UPDATED", entityType: "Delivery", details: "Marked Green Leaf Cafe order as Delivered" },
    ],
  });

  console.log("Seed complete.");
  console.log("\nLogin credentials (all roles share the same password):");
  console.log("  Password: Troysining123!\n");
  console.log("  Admin:       admin@troysining.ph");
  console.log("  Sales:       sales@troysining.ph");
  console.log("  Production:  production@troysining.ph");
  console.log("  Delivery:    delivery@troysining.ph");
  console.log("  Encoder:     encoder@troysining.ph");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
