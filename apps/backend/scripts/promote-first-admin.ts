import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function promoteFirstAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const reason = process.env.ADMIN_BOOTSTRAP_REASON?.trim();
  const confirmation = process.env.ADMIN_BOOTSTRAP_CONFIRMATION;

  if (
    !email ||
    !reason ||
    confirmation !== 'I_UNDERSTAND_THIS_GRANTS_ADMIN_ACCESS'
  ) {
    throw new Error(
      'Set ADMIN_EMAIL, ADMIN_BOOTSTRAP_REASON, and ADMIN_BOOTSTRAP_CONFIRMATION=I_UNDERSTAND_THIS_GRANTS_ADMIN_ACCESS',
    );
  }

  await prisma.$transaction(
    async (transaction) => {
      const existingAdminCount = await transaction.user.count({
        where: { roles: { has: Role.ADMIN } },
      });
      if (existingAdminCount > 0) {
        throw new Error(
          'An admin already exists; first-admin bootstrap is disabled.',
        );
      }

      const user = await transaction.user.findUnique({
        where: { email },
        select: { id: true, roles: true, emailVerifiedAt: true },
      });
      if (!user) {
        throw new Error('The target account must already exist.');
      }
      if (!user.emailVerifiedAt) {
        throw new Error(
          'The target account must have a verified email address.',
        );
      }

      const updated = await transaction.user.updateMany({
        where: {
          id: user.id,
          emailVerifiedAt: { not: null },
          NOT: { roles: { has: Role.ADMIN } },
        },
        data: { roles: [Role.ADMIN] },
      });
      if (updated.count !== 1) {
        throw new Error(
          'The target account changed during bootstrap; retry after reviewing account state.',
        );
      }

      await transaction.moderationAuditEvent.create({
        data: {
          actorRole: 'SYSTEM',
          entityType: 'USER',
          entityId: user.id,
          action: 'ADMIN_ROLE_GRANTED',
          reason,
        },
      });
    },
    { isolationLevel: 'Serializable' },
  );

  console.info(
    'First admin role granted and recorded in the moderation audit log.',
  );
}

promoteFirstAdmin()
  .catch((error: unknown) => {
    console.error('First-admin bootstrap failed:', error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
