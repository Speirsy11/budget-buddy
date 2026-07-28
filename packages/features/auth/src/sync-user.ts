import { db, users, ensureUserDefaults } from "@finance/db";
import { eq } from "drizzle-orm";
import { logger } from "@finance/logger";
import { notifyWelcome } from "@finance/email";

const log = logger.child({ module: "sync-user" });

interface ClerkUser {
  id: string;
  emailAddresses: { emailAddress: string }[];
  firstName: string | null;
  lastName: string | null;
  imageUrl: string;
}

export async function syncUser(clerkUser: ClerkUser) {
  const primaryEmail = clerkUser.emailAddresses[0]?.emailAddress;

  if (!primaryEmail) {
    throw new Error("User has no email address");
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.id, clerkUser.id),
  });

  if (existingUser) {
    await db
      .update(users)
      .set({
        email: primaryEmail,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        updatedAt: new Date(),
      })
      .where(eq(users.id, clerkUser.id));
  } else {
    await db.insert(users).values({
      id: clerkUser.id,
      email: primaryEmail,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    });

    // Welcome only genuinely new accounts, never on subsequent sign-ins.
    // Deliberately not awaited into the critical path beyond its own
    // error handling — a mail problem must not block signing in.
    void notifyWelcome({
      email: primaryEmail,
      userName: clerkUser.firstName ?? "there",
      userId: clerkUser.id,
    });
  }

  // Categories are per-user, so without this a new account has none at all and
  // every import lands uncategorised. Idempotent, hence safe on every sync.
  try {
    const provisioned = await ensureUserDefaults(clerkUser.id);
    if (provisioned.categoriesCreated || provisioned.rulesCreated) {
      log.info(
        { userId: clerkUser.id, ...provisioned },
        "syncUser: provisioned account defaults"
      );
    }
  } catch (error) {
    // Never block sign-in on provisioning; the user can still use the app and
    // the next sync retries.
    log.error(
      { err: error, userId: clerkUser.id },
      "syncUser: failed to provision defaults"
    );
  }

  return db.query.users.findFirst({
    where: eq(users.id, clerkUser.id),
  });
}
