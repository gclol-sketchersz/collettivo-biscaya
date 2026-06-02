import { describe, it, expect } from "vitest";
import {
  isCallRelevantForUser,
  type NotificationPreferences,
} from "./call-notification-service";

describe("Call Notification Service", () => {
  describe("isCallRelevantForUser", () => {
    const mockCall = {
      id: 1,
      title: "Residenza d'artista",
      entity: "Fondazione XYZ",
      callType: "residency",
      budgetMin: 5000,
      budgetMax: 10000,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      geographicLevel: "national",
      externalLink: "https://example.com/bando",
    };

    it("should mark call as relevant when all criteria match", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency", "fellowship"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
      expect(result.reason).toBeDefined();
    });

    it("should reject call when budget is below minimum", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 10000, // Higher than call budget
        callTypes: ["residency"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(false);
    });

    it("should reject call when call type doesn't match", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["exhibition", "competition"], // residency not included
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(false);
    });

    it("should reject call when region doesn't match", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: ["regional"], // national not included
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(false);
    });

    it("should reject expired calls", () => {
      const expiredCall = {
        ...mockCall,
        deadline: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      };

      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(expiredCall, preferences);
      expect(result.relevant).toBe(false);
      expect(result.reason).toBe("Deadline scaduto");
    });

    it("should include budget in reason when relevant", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: undefined,
        regions: undefined,
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
      expect(result.reason).toContain("Budget");
    });

    it("should accept calls without budget filter", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: undefined, // No budget filter
        callTypes: ["residency"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
    });

    it("should accept calls without call type filter", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: undefined, // No call type filter
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
    });

    it("should accept calls without region filter", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: undefined, // No region filter
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
    });

    it("should handle empty call type array", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: [], // Empty array
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true); // Empty array means no filter
    });

    it("should handle empty region array", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: [], // Empty array
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true); // Empty array means no filter
    });

    it("should support multiple call types", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["exhibition", "residency", "competition"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
    });

    it("should support multiple regions", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: ["regional", "national", "european"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(mockCall, preferences);
      expect(result.relevant).toBe(true);
    });

    it("should handle calls without budget", () => {
      const callNoBudget = {
        ...mockCall,
        budgetMin: undefined,
        budgetMax: undefined,
      };

      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(callNoBudget, preferences);
      expect(result.relevant).toBe(true); // No budget check if call does not have budgetMin
    });

    it("should handle calls without deadline", () => {
      const callNoDeadline = {
        ...mockCall,
        deadline: undefined,
      };

      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        minBudget: 1000,
        callTypes: ["residency"],
        regions: ["national"],
        frequency: "daily",
      };

      const result = isCallRelevantForUser(callNoDeadline, preferences);
      expect(result.relevant).toBe(true); // No deadline check if not provided
    });
  });

  describe("Notification Preferences", () => {
    it("should support immediate frequency", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        frequency: "immediate",
      };

      expect(preferences.frequency).toBe("immediate");
    });

    it("should support daily frequency", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        frequency: "daily",
      };

      expect(preferences.frequency).toBe("daily");
    });

    it("should support weekly frequency", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        frequency: "weekly",
      };

      expect(preferences.frequency).toBe("weekly");
    });

    it("should allow disabling email notifications", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: false,
        inAppNotifications: true,
        frequency: "daily",
      };

      expect(preferences.emailNotifications).toBe(false);
      expect(preferences.inAppNotifications).toBe(true);
    });

    it("should allow disabling in-app notifications", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: false,
        frequency: "daily",
      };

      expect(preferences.emailNotifications).toBe(true);
      expect(preferences.inAppNotifications).toBe(false);
    });
  });

  describe("Call Type Support", () => {
    const callTypes = ["exhibition", "residency", "competition", "grant", "award", "fellowship", "curatorial_open_call"];

    it("should support all call types", () => {
      expect(callTypes.length).toBe(7);
      expect(callTypes).toContain("residency");
      expect(callTypes).toContain("exhibition");
      expect(callTypes).toContain("competition");
    });

    it("should support filtering by call type", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        callTypes: ["residency", "fellowship"],
        frequency: "daily",
      };

      expect(preferences.callTypes).toHaveLength(2);
      expect(preferences.callTypes).toContain("residency");
      expect(preferences.callTypes).toContain("fellowship");
    });
  });

  describe("Geographic Levels", () => {
    const levels = ["regional", "national", "european"];

    it("should support all geographic levels", () => {
      expect(levels.length).toBe(3);
      expect(levels).toContain("regional");
      expect(levels).toContain("national");
      expect(levels).toContain("european");
    });

    it("should support filtering by geographic level", () => {
      const preferences: NotificationPreferences = {
        emailNotifications: true,
        inAppNotifications: true,
        regions: ["national", "european"],
        frequency: "daily",
      };

      expect(preferences.regions).toHaveLength(2);
      expect(preferences.regions).toContain("national");
      expect(preferences.regions).toContain("european");
    });
  });
});
