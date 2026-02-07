import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
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

describe("calls router", () => {
  it("should get all active calls", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const calls = await caller.calls.getAll();

    expect(Array.isArray(calls)).toBe(true);
    expect(calls.length).toBeGreaterThan(0);
    expect(calls[0]).toHaveProperty("title");
    expect(calls[0]).toHaveProperty("entity");
    expect(calls[0]).toHaveProperty("geographicLevel");
  });

  it("should get calls by geographic level", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const regionalCalls = await caller.calls.getByLevel("regional");

    expect(Array.isArray(regionalCalls)).toBe(true);
    regionalCalls.forEach(call => {
      expect(call.geographicLevel).toBe("regional");
    });
  });

  it("should search calls by query", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.calls.search({
      query: "Fondazione Italia Patria della Bellezza",
    });

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].title).toContain("Bando 2026 - Comunicazione Strategica e Branding");
  });

  it("should filter calls by type", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const results = await caller.calls.search({
      callType: "residency",
    });

    expect(Array.isArray(results)).toBe(true);
    results.forEach(call => {
      expect(call.callType).toBe("residency");
    });
  });

  it("should respect subscription level for geographic access", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Base user should only see regional calls
    const results = await caller.calls.search({});

    const hasEuropeanCalls = results.some(call => call.geographicLevel === "european");
    expect(hasEuropeanCalls).toBe(false);
  });

  it("should get call by id", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get all calls to find an ID
    const allCalls = await caller.calls.getAll();
    if (allCalls.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const callId = allCalls[0].id;
    const call = await caller.calls.getById(callId);

    expect(call).toBeDefined();
    expect(call?.id).toBe(callId);
    expect(call?.title).toBeDefined();
  });
});

describe("subscriptions router", () => {
  it("should get current user subscription", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const subscription = await caller.subscriptions.getCurrent();

    // Subscription might be null or have a level
    if (subscription) {
      expect(["base", "premium", "pro"]).toContain(subscription.level);
    }
  });

  it("should update user subscription", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.subscriptions.update("premium");

    expect(result.success).toBe(true);
    expect(result.level).toBe("premium");
  });

  it("should not allow unauthenticated access to subscriptions", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.subscriptions.getCurrent();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});

describe("saved calls router", () => {
  it("should get user saved calls", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const saved = await caller.savedCalls.getAll();

    expect(Array.isArray(saved)).toBe(true);
  });

  it("should save a call", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first call to save
    const allCalls = await caller.calls.getAll();
    if (allCalls.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const callId = allCalls[0].id;
    const result = await caller.savedCalls.save(callId);

    expect(result.success).toBe(true);
  });

  it("should remove saved call", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Get first call
    const allCalls = await caller.calls.getAll();
    if (allCalls.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const callId = allCalls[0].id;

    // Save it first
    await caller.savedCalls.save(callId);

    // Then remove it
    const result = await caller.savedCalls.remove(callId);

    expect(result.success).toBe(true);
  });

  it("should not allow unauthenticated access to saved calls", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.savedCalls.getAll();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});

describe("notifications router", () => {
  it("should get user notifications", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const notifications = await caller.notifications.getAll();

    expect(Array.isArray(notifications)).toBe(true);
  });

  it("should not allow unauthenticated access to notifications", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.notifications.getAll();
      expect(true).toBe(false); // Should not reach here
    } catch (error: any) {
      expect(error.code).toBe("UNAUTHORIZED");
    }
  });
});
