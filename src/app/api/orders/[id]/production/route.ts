import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { saveFile } from "@/lib/storage";
import { describeDriveError } from "@/lib/googleDrive";
import { isAtRisk } from "@/lib/deadlines";
import { ProductionStage } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || !["ADMIN", "PRODUCTION"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, include: { productionJob: true, client: true } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const contentType = req.headers.get("content-type") ?? "";
  let stage: ProductionStage | undefined;
  let note: string | undefined;
  let assignedStaffId: string | undefined;
  let photoFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const stageVal = form.get("stage");
    const noteVal = form.get("note");
    const assignedVal = form.get("assignedStaffId");
    const photoVal = form.get("photo");
    if (typeof stageVal === "string" && stageVal) stage = stageVal as ProductionStage;
    if (typeof noteVal === "string" && noteVal) note = noteVal;
    if (typeof assignedVal === "string" && assignedVal) assignedStaffId = assignedVal;
    if (photoVal instanceof File && photoVal.size > 0) photoFile = photoVal;
  } else {
    const body = await req.json().catch(() => ({}));
    stage = body.stage;
    note = body.note;
    assignedStaffId = body.assignedStaffId;
  }

  let photoUrl: string | undefined;
  if (photoFile) {
    const buffer = Buffer.from(await photoFile.arrayBuffer());
    let saved;
    try {
      saved = await saveFile({ clientId: order.clientId, originalName: photoFile.name, buffer, mimeType: photoFile.type });
    } catch (err) {
      console.error("Production photo upload failed:", err);
      return NextResponse.json({ error: `Could not save photo: ${describeDriveError(err)}` }, { status: 502 });
    }
    photoUrl = saved.url;
    await prisma.file.create({
      data: {
        clientId: order.clientId,
        orderId: order.id,
        uploadedById: session.userId,
        filename: photoFile.name,
        url: saved.url,
        mimeType: photoFile.type,
        sizeBytes: photoFile.size,
        category: "PROOF",
      },
    });
  }

  let job = order.productionJob;
  if (!job) {
    job = await prisma.productionJob.create({
      data: { orderId: order.id, stage: stage ?? "PENDING", assignedStaffId, startedAt: new Date() },
    });
  } else {
    const nextStage = stage ?? job.stage;
    const completed = ["COMPLETED", "READY_FOR_DELIVERY"].includes(nextStage);
    job = await prisma.productionJob.update({
      where: { id: job.id },
      data: {
        stage: nextStage,
        assignedStaffId: assignedStaffId ?? job.assignedStaffId,
        startedAt: job.startedAt ?? new Date(),
        isAtRisk: isAtRisk(order.dueDate, nextStage, completed),
      },
    });
  }

  if (stage || note || photoUrl) {
    await prisma.productionStatusLog.create({
      data: {
        productionJobId: job.id,
        stage: stage ?? job.stage,
        note,
        photoUrl,
        authorId: session.userId,
      },
    });
  }

  // Keep the order's lead stage in sync with production progress: any production
  // update means work has started, so move it out of QUOTED/CONFIRMED into
  // IN_PRODUCTION (unless it's already been delivered or closed out).
  if (stage && !["DELIVERED", "CLOSED"].includes(order.status)) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "IN_PRODUCTION" } });
  }

  await logActivity({
    userId: session.userId,
    action: "PRODUCTION_STAGE_UPDATED",
    entityType: "ProductionJob",
    entityId: job.id,
    details: stage ? `Moved to ${stage}` : "Updated production job",
  });

  return NextResponse.json({ job });
}
