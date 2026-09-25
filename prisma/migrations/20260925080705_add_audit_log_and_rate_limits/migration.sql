-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('MEMBER_CREATED', 'MEMBER_UPDATED', 'MEMBER_STATUS_CHANGED', 'TRAINER_CREATED', 'TRAINER_UPDATED', 'TRAINER_STATUS_CHANGED', 'PLAN_CREATED', 'PLAN_UPDATED', 'PLAN_STATUS_CHANGED', 'MEMBERSHIP_CREATED', 'MEMBERSHIP_RENEWED', 'MEMBERSHIP_CANCELLED', 'PAYMENT_RECORDED', 'TRAINER_ASSIGNED', 'TRAINER_ASSIGNMENT_REMOVED', 'EXERCISE_UPDATED', 'EXERCISE_STATUS_CHANGED', 'WORKOUT_PLAN_STATUS_CHANGED');

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "subjectUserId" TEXT,
    "summary" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_subjectUserId_createdAt_idx" ON "audit_logs"("subjectUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorUserId_createdAt_idx" ON "audit_logs"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_resetAt_idx" ON "rate_limit_buckets"("resetAt");

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Append-only enforcement (hand-written; Prisma has no schema syntax for
-- triggers). Audit rows can be inserted and read, never changed or
-- removed — not by the app, a bug, or an ad-hoc query. Only a deliberate
-- schema migration (dropping these triggers) could.
CREATE FUNCTION "audit_logs_reject_mutation"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only: % is not allowed', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "audit_logs_no_update_or_delete"
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION "audit_logs_reject_mutation"();

CREATE TRIGGER "audit_logs_no_truncate"
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION "audit_logs_reject_mutation"();
