-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('MANUAL', 'QR');

-- CreateTable
CREATE TABLE "attendance" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "checkInAt" TIMESTAMP(3) NOT NULL,
    "checkOutAt" TIMESTAMP(3),
    "attendanceDate" TIMESTAMP(3) NOT NULL,
    "method" "AttendanceMethod" NOT NULL DEFAULT 'MANUAL',
    "recordedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendance_memberId_attendanceDate_idx" ON "attendance"("memberId", "attendanceDate");

-- CreateIndex
CREATE INDEX "attendance_attendanceDate_idx" ON "attendance"("attendanceDate");

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_recordedByUserId_fkey" FOREIGN KEY ("recordedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hand-added (Prisma's schema DSL has no declarative syntax for a
-- partial/filtered unique index): enforces "at most one open
-- (not-yet-checked-out) attendance session per member" at the database
-- level, as defense in depth against a race between two concurrent
-- check-in requests that both pass the application-level check before
-- either has committed. See the Attendance model's comment in
-- schema.prisma.
CREATE UNIQUE INDEX "attendance_one_open_session_per_member" ON "attendance"("memberId") WHERE "checkOutAt" IS NULL;
