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

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
  };
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
