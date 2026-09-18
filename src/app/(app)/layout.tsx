import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUrgentAlertCount } from "@/lib/queries";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !user.isActive) redirect("/login");

  const alertCount = await getUrgentAlertCount(session);

  return (
    <AppShell name={user.name} role={user.role} avatarColor={user.avatarColor} alertCount={alertCount}>
      {children}
    </AppShell>
  );
}
