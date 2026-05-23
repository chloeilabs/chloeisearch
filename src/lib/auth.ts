import "server-only";

import { auth } from "../../auth";
import { prisma } from "@/lib/db";
import { isDevAuthBypassEnabled } from "@/lib/env";

export type CurrentUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

const devUser = {
  id: "dev-user",
  name: "Local Operator",
  email: "dev@localhost",
  image: null,
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (isDevAuthBypassEnabled()) {
    const existingUser = await prisma.user.findUnique({
      where: { email: devUser.email },
      select: { id: true, name: true, email: true, image: true },
    });

    if (existingUser) {
      return existingUser;
    }

    return prisma.user.create({
      data: devUser,
      select: { id: true, name: true, email: true, image: true },
    });
  }

  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  const persistedUser = await findPersistedSessionUser({
    id: session.user.id,
    email: session.user.email,
  });

  return {
    id: persistedUser?.id ?? session.user.id,
    name: persistedUser?.name ?? session.user.name,
    email: persistedUser?.email ?? session.user.email,
    image: persistedUser?.image ?? session.user.image,
  };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}

async function findPersistedSessionUser({
  id,
  email,
}: {
  id: string;
  email?: string | null;
}) {
  const select = { id: true, name: true, email: true, image: true };
  const userById = await prisma.user.findUnique({
    where: { id },
    select,
  });

  if (userById || !email) {
    return userById;
  }

  return prisma.user.findUnique({
    where: { email },
    select,
  });
}
