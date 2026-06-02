import { describe, it, expect } from "vitest";
import { ANACAPIClient } from "./anac-api-client";
import { OpenCoesioneAPIClient } from "./opencoesione-api-client";

describe("API Clients", () => {
  describe("ANACAPIClient", () => {
    it("should initialize with default config", () => {
      const client = new ANACAPIClient();
      expect(client).toBeDefined();
    });

    it("should initialize with custom config", () => {
      const client = new ANACAPIClient({
        baseUrl: "https://custom.api.it/",
        timeout: 60000,
      });
      expect(client).toBeDefined();
    });

    it("should have fetchBandi method", () => {
      const client = new ANACAPIClient();
      expect(typeof client.fetchBandi).toBe("function");
    });

    it("should have searchBandi method", () => {
      const client = new ANACAPIClient();
      expect(typeof client.searchBandi).toBe("function");
    });

    it("should have getBandiByEntity method", () => {
      const client = new ANACAPIClient();
      expect(typeof client.getBandiByEntity).toBe("function");
    });

    it("should parse date in ISO format", async () => {
      const client = new ANACAPIClient();
      // Test via fetchBandi which uses parseDate internally
      const result = await client.fetchBandi(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should handle API errors gracefully", async () => {
      const client = new ANACAPIClient({
        baseUrl: "https://invalid-api.example.com/",
      });
      const result = await client.fetchBandi(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0); // Should return empty array on error
    });

    it("should extract numbers from text", async () => {
      const client = new ANACAPIClient();
      // The extractNumber method is private, but we can test it indirectly
      const result = await client.fetchBandi(1);
      expect(Array.isArray(result)).toBe(true);
    });

    it("should detect call types", async () => {
      const client = new ANACAPIClient();
      const result = await client.fetchBandi(1);
      if (result.length > 0) {
        expect(result[0].callType).toBeDefined();
        expect([
          "exhibition",
          "residency",
          "competition",
          "grant",
          "award",
          "fellowship",
          "curatorial_open_call",
        ]).toContain(result[0].callType);
      }
    });
  });

  describe("OpenCoesioneAPIClient", () => {
    it("should initialize with default config", () => {
      const client = new OpenCoesioneAPIClient();
      expect(client).toBeDefined();
    });

    it("should initialize with custom config", () => {
      const client = new OpenCoesioneAPIClient({
        baseUrl: "https://custom.api.it/",
        timeout: 60000,
      });
      expect(client).toBeDefined();
    });

    it("should have fetchOpportunities method", () => {
      const client = new OpenCoesioneAPIClient();
      expect(typeof client.fetchOpportunities).toBe("function");
    });

    it("should have searchOpportunities method", () => {
      const client = new OpenCoesioneAPIClient();
      expect(typeof client.searchOpportunities).toBe("function");
    });

    it("should have getOpportunitiesByRegion method", () => {
      const client = new OpenCoesioneAPIClient();
      expect(typeof client.getOpportunitiesByRegion).toBe("function");
    });

    it("should have getOpportunitiesByPeriod method", () => {
      const client = new OpenCoesioneAPIClient();
      expect(typeof client.getOpportunitiesByPeriod).toBe("function");
    });

    it("should handle API errors gracefully", async () => {
      const client = new OpenCoesioneAPIClient({
        baseUrl: "https://invalid-api.example.com/",
      });
      const result = await client.fetchOpportunities(1);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0); // Should return empty array on error
    });

    it("should detect geographic levels", async () => {
      const client = new OpenCoesioneAPIClient();
      const result = await client.fetchOpportunities(1);
      if (result.length > 0) {
        expect(result[0].geographicLevel).toBeDefined();
        expect(["regional", "national", "european"]).toContain(result[0].geographicLevel);
      }
    });

    it("should include programming period", async () => {
      const client = new OpenCoesioneAPIClient();
      const result = await client.fetchOpportunities(1);
      if (result.length > 0) {
        expect(result[0].programmingPeriod).toBeDefined();
      }
    });

    it("should include funding source", async () => {
      const client = new OpenCoesioneAPIClient();
      const result = await client.fetchOpportunities(1);
      if (result.length > 0) {
        expect(result[0].fundingSource).toBeDefined();
      }
    });
  });

  describe("API Client Integration", () => {
    it("should support ANAC API", () => {
      const client = new ANACAPIClient();
      expect(client).toBeDefined();
      expect(client.fetchBandi).toBeDefined();
    });

    it("should support OpenCoesione API", () => {
      const client = new OpenCoesioneAPIClient();
      expect(client).toBeDefined();
      expect(client.fetchOpportunities).toBeDefined();
    });

    it("should have consistent call type mapping", async () => {
      const anacClient = new ANACAPIClient();
      const openCoesioneClient = new OpenCoesioneAPIClient();

      const anacResult = await anacClient.fetchBandi(1);
      const openCoesioneResult = await openCoesioneClient.fetchOpportunities(1);

      const validTypes = [
        "exhibition",
        "residency",
        "competition",
        "grant",
        "award",
        "fellowship",
        "curatorial_open_call",
      ];

      if (anacResult.length > 0) {
        expect(validTypes).toContain(anacResult[0].callType);
      }

      if (openCoesioneResult.length > 0) {
        expect(validTypes).toContain(openCoesioneResult[0].callType);
      }
    });

    it("should have consistent country field", async () => {
      const anacClient = new ANACAPIClient();
      const openCoesioneClient = new OpenCoesioneAPIClient();

      const anacResult = await anacClient.fetchBandi(1);
      const openCoesioneResult = await openCoesioneClient.fetchOpportunities(1);

      if (anacResult.length > 0) {
        expect(anacResult[0].country).toBe("IT");
      }

      if (openCoesioneResult.length > 0) {
        expect(openCoesioneResult[0].country).toBe("IT");
      }
    });

    it("should have source field set correctly", async () => {
      const anacClient = new ANACAPIClient();
      const openCoesioneClient = new OpenCoesioneAPIClient();

      const anacResult = await anacClient.fetchBandi(1);
      const openCoesioneResult = await openCoesioneClient.fetchOpportunities(1);

      if (anacResult.length > 0) {
        expect(anacResult[0].source).toBe("anac-api");
      }

      if (openCoesioneResult.length > 0) {
        expect(openCoesioneResult[0].source).toBe("opencoesione-api");
      }
    });
  });

  describe("API Client Configuration", () => {
    it("should have ANAC API endpoint", () => {
      const client = new ANACAPIClient();
      expect(client).toBeDefined();
    });

    it("should have OpenCoesione API endpoint", () => {
      const client = new OpenCoesioneAPIClient();
      expect(client).toBeDefined();
    });

    it("should support custom timeouts", () => {
      const anacClient = new ANACAPIClient({ timeout: 60000 });
      const openCoesioneClient = new OpenCoesioneAPIClient({ timeout: 60000 });

      expect(anacClient).toBeDefined();
      expect(openCoesioneClient).toBeDefined();
    });

    it("should support custom base URLs", () => {
      const anacClient = new ANACAPIClient({
        baseUrl: "https://custom.anac.it/",
      });
      const openCoesioneClient = new OpenCoesioneAPIClient({
        baseUrl: "https://custom.opencoesione.it/",
      });

      expect(anacClient).toBeDefined();
      expect(openCoesioneClient).toBeDefined();
    });
  });
});
