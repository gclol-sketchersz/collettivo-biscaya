import { describe, expect, it } from "vitest";
import {
  getCallsWithUpcomingDeadlines,
  getRecentlyAddedCalls,
  getOrCreateEmailPreferences,
  updateEmailPreferences,
} from "./db";

describe("Email Notifications System", () => {
  it("should get calls with upcoming deadlines", async () => {
    const calls = await getCallsWithUpcomingDeadlines(30);

    expect(Array.isArray(calls)).toBe(true);

    // All calls should have deadlines within the next 30 days
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    calls.forEach((call) => {
      const deadline = new Date(call.deadline);
      expect(deadline.getTime()).toBeGreaterThanOrEqual(now.getTime());
      expect(deadline.getTime()).toBeLessThanOrEqual(thirtyDaysFromNow.getTime());
    });
  });

  it("should get recently added calls", async () => {
    const calls = await getRecentlyAddedCalls(24);

    expect(Array.isArray(calls)).toBe(true);

    // All calls should have been created in the last 24 hours
    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    calls.forEach((call) => {
      expect(new Date(call.createdAt).getTime()).toBeGreaterThanOrEqual(
        cutoffTime.getTime()
      );
    });
  });

  it("should get or create email preferences for user", async () => {
    const userId = 1;
    const preferences = await getOrCreateEmailPreferences(userId);

    expect(preferences).toBeDefined();
    expect(preferences?.userId).toBe(userId);
    // Check that preferences are created with default values
    expect(preferences?.newCallsNotification).toBeGreaterThanOrEqual(0);
    expect(preferences?.deadlineReminderNotification).toBeGreaterThanOrEqual(0);
    expect(preferences?.deadlineReminderDays).toBeGreaterThan(0);
    expect(preferences?.notificationFrequency).toBeDefined();
  });

  it("should update email preferences", async () => {
    const userId = 1;

    // First get/create preferences
    await getOrCreateEmailPreferences(userId);

    // Update preferences
    const success = await updateEmailPreferences(userId, {
      newCallsNotification: 0,
      deadlineReminderDays: 14,
    });

    expect(success).toBe(true);

    // Verify update
    const updated = await getOrCreateEmailPreferences(userId);
    expect(updated?.newCallsNotification).toBe(0);
    expect(updated?.deadlineReminderDays).toBe(14);
  });

  it("should get calls with different deadline ranges", async () => {
    const calls3Days = await getCallsWithUpcomingDeadlines(3);
    const calls7Days = await getCallsWithUpcomingDeadlines(7);
    const calls30Days = await getCallsWithUpcomingDeadlines(30);

    // More days should return more or equal calls
    expect(calls7Days.length).toBeGreaterThanOrEqual(calls3Days.length);
    expect(calls30Days.length).toBeGreaterThanOrEqual(calls7Days.length);
  });
});
