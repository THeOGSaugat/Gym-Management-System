import { beforeEach, vi } from "vitest";
import { prismaMock, resetPrismaMock } from "./prisma-mock";

// Every test in the suite gets the mocked Prisma client in place of the
// real one — nothing here ever opens a database connection.
vi.mock("@/server/db", () => ({ db: prismaMock }));

beforeEach(() => {
  resetPrismaMock();
});
