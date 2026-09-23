import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { saveFile } from "@/lib/storage";
import { DeliveryMethod, DeliveryStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "DELIVERY"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { delivery: true, client: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  let method: DeliveryMethod | undefined;
  let status: DeliveryStatus | undefined;
  let riderId: string | undefined;
  let deliveryDate: string | undefined;
  let address: string | undefined;
  let notes: string | undefined;
  let proofFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const get = (k: string) => {
      const v = form.get(k);
      return typeof v === "string" && v ? v : undefined;
    };
    method = get("method") as DeliveryMethod | undefined;
    status = get("status") as DeliveryStatus | undefined;
    riderId = get("riderId");
    deliveryDate = get("deliveryDate");
    address = get("address");
    notes = get("notes");
    const proofVal = form.get("proof");
    if (proofVal instanceof File && proofVal.size > 0) proofFile = proofVal;
  } else {
    const body = await req.json().catch(() => ({}));
    ({ method, status, riderId, deliveryDate, address, notes } = body);
  }

  let proofUrl: string | undefined;
  if (proofFile) {
    const buffer = Buffer.from(await proofFile.arrayBuffer());
    const saved = await saveFile({ clientId: order.clientId, originalName: proofFile.name, buffer, mimeType: proofFile.type });
    proofUrl = saved.url;
  }

  const delivery = await prisma.delivery.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      method: method ?? "PICKUP",
      status: status ?? "PREPARING",
      riderId,
      deliveryDate: deliveryDate ? new Date(deliveryDate) : undefined,
      address: address ?? order.client.address ?? undefined,
      notes,
      proofUrl,
    },
    update: {
      ...(method && { method }),
      ...(status && { status }),
      ...(riderId !== undefined && { riderId }),
      ...(deliveryDate && { deliveryDate: new Date(deliveryDate) }),
      ...(address !== undefined && { address }),
      ...(notes !== undefined && { notes }),
      ...(proofUrl && { proofUrl }),
    },
  });

  if (status === "DELIVERED") {
    await prisma.order.update({ where: { id: order.id }, data: { status: "DELIVERED" } });
    // ensure the production trail reflects completion, if a job exists
    await prisma.productionJob.updateMany({ where: { orderId: order.id }, data: { stage: "COMPLETED", isAtRisk: false } });
  }

  await logActivity({
    userId: session.userId,
    action: "DELIVERY_STATUS_UPDATED",
    entityType: "Delivery",
    entityId: delivery.id,
    details: status ? `Delivery status: ${status}` : "Updated delivery",
  });

  return NextResponse.json({ delivery });
}
