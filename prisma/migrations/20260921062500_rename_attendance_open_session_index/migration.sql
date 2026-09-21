-- Renames the partial unique index added in the previous migration so
-- its name contains "memberId" literally — src/server/prisma-errors.ts's
-- isUniqueConstraintError() matches a P2002 error back to a field by
-- checking whether the constraint name contains that field's name (the
-- only option available for a constraint Prisma didn't declare itself
-- and therefore can't map to field names on its own). The original name
-- ("attendance_one_open_session_per_member") didn't contain "memberId",
-- so that matching would silently fail. No data or behavior changes —
-- this is a rename only.
ALTER INDEX "attendance_one_open_session_per_member" RENAME TO "attendance_memberId_open_session_key";
