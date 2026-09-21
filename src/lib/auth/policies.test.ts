import { describe, expect, it } from "vitest";
import {
  canManageMembers,
  canViewMember,
  canEditMemberProfile,
  canRecordAttendanceFor,
  canViewAttendanceFor,
  canViewAllAttendance,
} from "./policies";

const admin = { id: "admin-1", role: "ADMIN" } as const;
const trainer = { id: "trainer-1", role: "TRAINER" } as const;
const member = { id: "member-1", role: "MEMBER" } as const;
const otherMember = { id: "member-2", role: "MEMBER" } as const;

describe("canManageMembers", () => {
  it("allows ADMIN", () => {
    expect(canManageMembers(admin)).toBe(true);
  });

  it("denies TRAINER — trainers don't get member management automatically", () => {
    expect(canManageMembers(trainer)).toBe(false);
  });

  it("denies MEMBER", () => {
    expect(canManageMembers(member)).toBe(false);
  });
});

describe("canViewMember", () => {
  it("allows ADMIN to view any member", () => {
    expect(canViewMember(admin, member.id)).toBe(true);
    expect(canViewMember(admin, otherMember.id)).toBe(true);
  });

  it("allows a MEMBER to view their own profile", () => {
    expect(canViewMember(member, member.id)).toBe(true);
  });

  it("denies a MEMBER viewing another member's profile", () => {
    expect(canViewMember(member, otherMember.id)).toBe(false);
  });

  it("denies TRAINER viewing a member — no assignment feature yet", () => {
    expect(canViewMember(trainer, member.id)).toBe(false);
  });
});

describe("canEditMemberProfile", () => {
  it("mirrors canViewMember's rules", () => {
    expect(canEditMemberProfile(admin, otherMember.id)).toBe(true);
    expect(canEditMemberProfile(member, member.id)).toBe(true);
    expect(canEditMemberProfile(member, otherMember.id)).toBe(false);
    expect(canEditMemberProfile(trainer, member.id)).toBe(false);
  });
});

describe("canRecordAttendanceFor", () => {
  it("allows a member to check themselves in/out", () => {
    expect(canRecordAttendanceFor(member, member.id)).toBe(true);
  });

  it("denies a member checking in/out on behalf of another member", () => {
    expect(canRecordAttendanceFor(member, otherMember.id)).toBe(false);
  });

  it("denies ADMIN — Phase 4 has no admin-assisted check-in yet", () => {
    expect(canRecordAttendanceFor(admin, member.id)).toBe(false);
  });

  it("denies TRAINER", () => {
    expect(canRecordAttendanceFor(trainer, member.id)).toBe(false);
  });
});

describe("canViewAttendanceFor", () => {
  it("allows ADMIN to view any member's attendance", () => {
    expect(canViewAttendanceFor(admin, member.id)).toBe(true);
    expect(canViewAttendanceFor(admin, otherMember.id)).toBe(true);
  });

  it("allows a member to view their own attendance", () => {
    expect(canViewAttendanceFor(member, member.id)).toBe(true);
  });

  it("denies a member viewing another member's attendance", () => {
    expect(canViewAttendanceFor(member, otherMember.id)).toBe(false);
  });

  it("denies TRAINER", () => {
    expect(canViewAttendanceFor(trainer, member.id)).toBe(false);
  });
});

describe("canViewAllAttendance", () => {
  it("allows only ADMIN", () => {
    expect(canViewAllAttendance(admin)).toBe(true);
    expect(canViewAllAttendance(member)).toBe(false);
    expect(canViewAllAttendance(trainer)).toBe(false);
  });
});
