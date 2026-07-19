import { prisma } from "@/lib/db";
import { demoUser, sampleLeads, sampleProperties } from "@/lib/demo-data";

export async function ensureDemoWorkspace() {
  const user = await prisma.user.upsert({
    where: { email: demoUser.email },
    update: { name: demoUser.name },
    create: demoUser,
  });

  const leadCount = await prisma.lead.count({ where: { userId: user.id } });
  if (leadCount === 0) {
    await prisma.lead.createMany({
      data: sampleLeads.map((lead) => ({ ...lead, userId: user.id })),
    });
  }

  const propertyCount = await prisma.property.count({ where: { userId: user.id } });
  if (propertyCount === 0) {
    await prisma.property.createMany({
      data: sampleProperties.map((property) => ({ ...property, userId: user.id })),
    });
  }

  return user;
}
