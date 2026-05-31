import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1, role: "user" | "admin" = "user"): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createAdminContext(userId = 1): { ctx: TrpcContext } {
  return createAuthContext(userId, "admin");
}

describe("automation router", () => {
  describe("getCallsWithMinCompensation", () => {
    it("should get calls with minimum compensation (€500)", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getCallsWithMinCompensation({
        minCompensation: 500,
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(calls)).toBe(true);
      // All returned calls should have budgetMin >= 500
      calls.forEach(call => {
        expect(call.budgetMin).toBeGreaterThanOrEqual(500);
      });
    });

    it("should get calls with custom minimum compensation", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getCallsWithMinCompensation({
        minCompensation: 1000,
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(calls)).toBe(true);
      // All returned calls should have budgetMin >= 1000
      calls.forEach(call => {
        expect(call.budgetMin).toBeGreaterThanOrEqual(1000);
      });
    });

    it("should support pagination", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const firstPage = await caller.automation.getCallsWithMinCompensation({
        minCompensation: 500,
        limit: 5,
        offset: 0,
      });

      const secondPage = await caller.automation.getCallsWithMinCompensation({
        minCompensation: 500,
        limit: 5,
        offset: 5,
      });

      expect(firstPage.length).toBeLessThanOrEqual(5);
      expect(secondPage.length).toBeLessThanOrEqual(5);
      
      // First and second page should have different calls (if both have items)
      if (firstPage.length > 0 && secondPage.length > 0) {
        const firstPageIds = firstPage.map(c => c.id);
        const secondPageIds = secondPage.map(c => c.id);
        const hasNoOverlap = !firstPageIds.some(id => secondPageIds.includes(id));
        expect(hasNoOverlap).toBe(true);
      }
    });

    it("should return empty array if no calls match criteria", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getCallsWithMinCompensation({
        minCompensation: 999999,
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBe(0);
    });

    it("should handle optional input", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getCallsWithMinCompensation();

      expect(Array.isArray(calls)).toBe(true);
      // Should use default values (minCompensation: 500)
      calls.forEach(call => {
        expect(call.budgetMin).toBeGreaterThanOrEqual(500);
      });
    });
  });

  describe("countCallsWithMinCompensation", () => {
    it("should count calls with minimum compensation", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const count = await caller.automation.countCallsWithMinCompensation({
        minCompensation: 500,
      });

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    it("should return 0 if no calls match criteria", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const count = await caller.automation.countCallsWithMinCompensation({
        minCompensation: 999999,
      });

      expect(count).toBe(0);
    });

    it("should handle optional input", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const count = await caller.automation.countCallsWithMinCompensation();

      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("removeExpiredCalls", () => {
    it("should require admin role", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.automation.removeExpiredCalls();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("Only admins");
      }
    });

    it("should require authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.automation.removeExpiredCalls();
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should allow admin to remove expired calls", async () => {
      const { ctx } = createAdminContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.automation.removeExpiredCalls();

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("removedCount");
      expect(typeof result.removedCount).toBe("number");
      expect(result.removedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("getExpiredCalls", () => {
    it("should require admin role", async () => {
      const { ctx } = createAuthContext(1, "user");
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.automation.getExpiredCalls();
        expect.fail("Should have thrown FORBIDDEN error");
      } catch (error: any) {
        expect(error.code).toBe("FORBIDDEN");
        expect(error.message).toContain("Only admins");
      }
    });

    it("should require authentication", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.automation.getExpiredCalls();
        expect.fail("Should have thrown UNAUTHORIZED error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });

    it("should allow admin to view expired calls", async () => {
      const { ctx } = createAdminContext(1);
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getExpiredCalls({
        limit: 50,
      });

      expect(Array.isArray(calls)).toBe(true);
      // All returned calls should have deadline in the past
      calls.forEach(call => {
        expect(call.deadline.getTime()).toBeLessThan(new Date().getTime());
      });
    });

    it("should support custom limit", async () => {
      const { ctx } = createAdminContext(1);
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getExpiredCalls({
        limit: 10,
      });

      expect(calls.length).toBeLessThanOrEqual(10);
    });
  });

  describe("getCallsByEntity", () => {
    it("should get calls by verified entity", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // First get an entity from existing calls
      const allCalls = await caller.calls.getAll();
      if (allCalls.length > 0) {
        const entityId = allCalls[0].entity;

        const calls = await caller.automation.getCallsByEntity({
          entityId,
          limit: 50,
          offset: 0,
        });

        expect(Array.isArray(calls)).toBe(true);
        // All returned calls should be from the specified entity
        calls.forEach(call => {
          expect(call.entity).toBe(entityId);
        });
      }
    });

    it("should support pagination", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const allCalls = await caller.calls.getAll();
      if (allCalls.length > 0) {
        const entityId = allCalls[0].entity;

        const firstPage = await caller.automation.getCallsByEntity({
          entityId,
          limit: 5,
          offset: 0,
        });

        const secondPage = await caller.automation.getCallsByEntity({
          entityId,
          limit: 5,
          offset: 5,
        });

        expect(firstPage.length).toBeLessThanOrEqual(5);
        expect(secondPage.length).toBeLessThanOrEqual(5);
      }
    });

    it("should return empty array if entity not found", async () => {
      const { ctx } = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const calls = await caller.automation.getCallsByEntity({
        entityId: "non-existent-entity-12345",
        limit: 50,
        offset: 0,
      });

      expect(Array.isArray(calls)).toBe(true);
      expect(calls.length).toBe(0);
    });
  });
});
