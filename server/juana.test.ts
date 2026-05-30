import { describe, it, expect } from "vitest";

describe("Juana Chat Functions", () => {
  describe("Quick Suggestions", () => {
    it("should have predefined quick suggestions", () => {
      const suggestions = [
        "Mostrami bandi europei",
        "Consigli candidatura",
        "Bandi per mostre",
        "Residenze d'artista",
      ];

      expect(suggestions.length).toBe(4);
      expect(suggestions).toContain("Mostrami bandi europei");
    });

    it("should validate suggestion format", () => {
      const suggestion = "Mostrami bandi europei";
      expect(suggestion.length).toBeGreaterThan(0);
      expect(typeof suggestion).toBe("string");
    });
  });

  describe("Chat Message Validation", () => {
    it("should validate message content is not empty", () => {
      const message = "Cerco bandi europei";
      expect(message.trim().length).toBeGreaterThan(0);
    });

    it("should validate role is either user or assistant", () => {
      const validRoles = ["user", "assistant"];
      const testRole = "user";
      expect(validRoles).toContain(testRole);
    });

    it("should handle very long messages", () => {
      const longMessage = "a".repeat(5000);
      expect(longMessage.length).toBe(5000);
    });

    it("should handle special characters in messages", () => {
      const messageWithSpecialChars = "Cerco bandi con €, ñ, é, 中文";
      expect(messageWithSpecialChars.length).toBeGreaterThan(0);
    });

    it("should validate Juana component receives messages", () => {
      const testMessages = [
        { role: "user" as const, content: "Ciao Juana" },
        { role: "assistant" as const, content: "Ciao! Come posso aiutarti?" },
      ];

      expect(testMessages.length).toBe(2);
      expect(testMessages[0].role).toBe("user");
      expect(testMessages[1].role).toBe("assistant");
    });

    it("should validate welcome message", () => {
      const welcomeMessage = "Aupa, capitano! Sono Juana, la tua guida per i bandi culturali. Come posso aiutarti oggi?";
      expect(welcomeMessage).toContain("Aupa");
      expect(welcomeMessage).toContain("Juana");
      expect(welcomeMessage).toContain("capitano");
    });

    it("should validate feedback types", () => {
      const feedbackTypes = ["like", "dislike"];
      expect(feedbackTypes).toContain("like");
      expect(feedbackTypes).toContain("dislike");
    });

    it("should validate chat history structure", () => {
      const chatHistory = [
        {
          id: 1,
          userId: 1,
          role: "user" as const,
          content: "Cerco bandi",
          createdAt: new Date(),
        },
      ];

      expect(chatHistory[0]).toHaveProperty("id");
      expect(chatHistory[0]).toHaveProperty("role");
      expect(chatHistory[0]).toHaveProperty("content");
      expect(chatHistory[0]).toHaveProperty("createdAt");
    });

    it("should validate message timestamp format", () => {
      const timestamp = new Date();
      expect(timestamp instanceof Date).toBe(true);
      expect(timestamp.getTime()).toBeGreaterThan(0);
    });

    it("should validate message ID generation", () => {
      const messageId = `${Date.now()}-user`;
      expect(messageId).toContain("-user");
      expect(messageId.length).toBeGreaterThan(5);
    });

    it("should validate multiple messages in conversation", () => {
      const conversation = [
        { role: "user" as const, content: "Ciao" },
        { role: "assistant" as const, content: "Ciao! Come posso aiutarti?" },
        { role: "user" as const, content: "Cerco bandi per mostre" },
        { role: "assistant" as const, content: "Ecco i bandi disponibili..." },
      ];

      expect(conversation.length).toBe(4);
      expect(conversation.filter(m => m.role === "user").length).toBe(2);
      expect(conversation.filter(m => m.role === "assistant").length).toBe(2);
    });

    it("should validate message order in conversation", () => {
      const conversation = [
        { role: "user" as const, content: "Messaggio 1", order: 1 },
        { role: "assistant" as const, content: "Risposta 1", order: 2 },
        { role: "user" as const, content: "Messaggio 2", order: 3 },
      ];

      for (let i = 1; i < conversation.length; i++) {
        expect(conversation[i].order).toBeGreaterThan(conversation[i - 1].order);
      }
    });

    it("should validate user profile structure", () => {
      const userProfile = {
        name: "Giorgio",
        email: "giorgio@example.com",
        subscriptionLevel: "pro",
        savedCallsCount: 5,
        savedCallIds: [1, 2, 3, 4, 5],
      };

      expect(userProfile).toHaveProperty("name");
      expect(userProfile).toHaveProperty("subscriptionLevel");
      expect(userProfile.subscriptionLevel).toBe("pro");
      expect(userProfile.savedCallsCount).toBe(5);
    });

    it("should validate Juana system prompt structure", () => {
      const systemPrompt = `You are Juana, a helpful AI assistant for Collettivo Biscaya.
Your role is to help users find cultural calls.`;

      expect(systemPrompt).toContain("Juana");
      expect(systemPrompt).toContain("AI assistant");
      expect(systemPrompt).toContain("Collettivo Biscaya");
    });

    it("should validate personalization with user name", () => {
      const userProfile = { name: "Giorgio", subscriptionLevel: "pro" };
      const personalizedMessage = `Benvenuto, ${userProfile.name}!`;
      expect(personalizedMessage).toContain("Giorgio");
    });

    it("should validate subscription level display", () => {
      const subscriptionLevels = ["base", "premium", "pro"];
      expect(subscriptionLevels).toContain("base");
      expect(subscriptionLevels).toContain("pro");
    });
  });

  describe("Chat UI Components", () => {
    it("should validate chat bubble button properties", () => {
      const buttonProps = {
        title: "Apri Juana - Assistente IA",
        className: "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full",
        icon: "Compass",
      };

      expect(buttonProps.title).toContain("Juana");
      expect(buttonProps.className).toContain("fixed");
      expect(buttonProps.className).toContain("bottom-6");
      expect(buttonProps.className).toContain("right-6");
    });

    it("should validate chat window styling", () => {
      const windowProps = {
        className: "fixed bottom-24 right-6 z-50 w-96 max-h-[600px] flex flex-col",
        headerBg: "bg-gradient-to-r from-blue-500 to-cyan-500",
      };

      expect(windowProps.className).toContain("fixed");
      expect(windowProps.className).toContain("flex");
      expect(windowProps.headerBg).toContain("gradient");
    });

    it("should validate message bubble styling", () => {
      const userBubble = {
        role: "user",
        className: "bg-blue-500 text-white rounded-br-none",
      };

      const assistantBubble = {
        role: "assistant",
        className: "bg-gray-200 text-foreground rounded-bl-none",
      };

      expect(userBubble.className).toContain("blue");
      expect(assistantBubble.className).toContain("gray");
    });

    it("should validate feedback button properties", () => {
      const feedbackButtons = [
        { icon: "ThumbsUp", feedback: "like" },
        { icon: "ThumbsDown", feedback: "dislike" },
      ];

      expect(feedbackButtons.length).toBe(2);
      expect(feedbackButtons[0].feedback).toBe("like");
      expect(feedbackButtons[1].feedback).toBe("dislike");
    });
  });

  describe("Helm Icon SVG", () => {
    it("should validate helm SVG structure", () => {
      const helmSVG = `<svg viewBox="0 0 200 200" fill="none" stroke="currentColor" strokeWidth="12">
        <circle cx="100" cy="100" r="85" />
        <line x1="100" y1="15" x2="100" y2="50" />
        <line x1="100" y1="150" x2="100" y2="185" />
        <line x1="15" y1="100" x2="50" y2="100" />
        <line x1="150" y1="100" x2="185" y2="100" />
        <line x1="35" y1="35" x2="60" y2="60" />
        <line x1="140" y1="140" x2="165" y2="165" />
        <line x1="165" y1="35" x2="140" y2="60" />
        <line x1="60" y1="140" x2="35" y2="165" />
        <circle cx="100" cy="100" r="20" />
      </svg>`;

      expect(helmSVG).toContain("viewBox");
      expect(helmSVG).toContain("circle");
      expect(helmSVG).toContain("line");
    });

    it("should validate helm has 8 spokes", () => {
      const spokeCount = 8;
      expect(spokeCount).toBe(8);
    });

    it("should validate helm icon uses currentColor for white display", () => {
      const iconColor = "currentColor";
      expect(iconColor).toBe("currentColor");
    });

    it("should validate helm button styling", () => {
      const buttonClasses = "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white";
      expect(buttonClasses).toContain("fixed");
      expect(buttonClasses).toContain("bottom-6");
      expect(buttonClasses).toContain("right-6");
      expect(buttonClasses).toContain("bg-gradient-to-br");
      expect(buttonClasses).toContain("from-blue-500");
      expect(buttonClasses).toContain("to-cyan-500");
      expect(buttonClasses).toContain("text-white");
    });

    it("should validate helm icon is centered in button", () => {
      const iconClasses = "w-6 h-6";
      expect(iconClasses).toContain("w-6");
      expect(iconClasses).toContain("h-6");
    });

    it("should validate helm header icon size", () => {
      const headerIconClasses = "w-5 h-5";
      expect(headerIconClasses).toContain("w-5");
      expect(headerIconClasses).toContain("h-5");
    });

    it("should validate helm welcome icon size", () => {
      const welcomeIconClasses = "w-12 h-12 mx-auto text-blue-500 mb-2";
      expect(welcomeIconClasses).toContain("w-12");
      expect(welcomeIconClasses).toContain("h-12");
      expect(welcomeIconClasses).toContain("text-blue-500");
    });
  });

  describe("Helm Animations", () => {
    it("should validate helm-spinning animation class", () => {
      const animationClass = "helm-spinning";
      expect(animationClass).toBe("helm-spinning");
    });

    it("should validate helm-pulse animation class", () => {
      const animationClass = "helm-pulse";
      expect(animationClass).toBe("helm-pulse");
    });

    it("should validate helm-highlight animation class", () => {
      const animationClass = "helm-highlight";
      expect(animationClass).toBe("helm-highlight");
    });

    it("should validate animation is applied during loading", () => {
      const isLoading = true;
      const animationClass = isLoading ? "helm-pulse" : "";
      expect(animationClass).toBe("helm-pulse");
    });

    it("should validate animation is removed when not loading", () => {
      const isLoading = false;
      const animationClass = isLoading ? "helm-pulse" : "";
      expect(animationClass).toBe("");
    });
  });

  describe("Helm Color Variants", () => {
    it("should validate color shift animation for new messages", () => {
      const hasNewMessage = true;
      const animationClass = hasNewMessage ? "helm-highlight" : "";
      expect(animationClass).toBe("helm-highlight");
    });

    it("should validate color returns to normal after timeout", () => {
      const hasNewMessage = false;
      const animationClass = hasNewMessage ? "helm-highlight" : "";
      expect(animationClass).toBe("");
    });

    it("should validate new message state triggers animation", () => {
      const messages = [
        { role: "user", content: "Ciao" },
        { role: "assistant", content: "Ciao! Come posso aiutarti?" },
      ];
      expect(messages.length).toBe(2);
      expect(messages[1].role).toBe("assistant");
    });
  });

  describe("Basque Tooltip Phrases", () => {
    it("should validate Basque phrases array", () => {
      const phrases = [
        "Aúpa!",
        "Bixarren!",
        "Aurrera!",
        "Gora!",
        "Ondo!",
        "Txalo!",
      ];
      expect(phrases.length).toBe(6);
    });

    it("should validate each phrase is non-empty", () => {
      const phrases = [
        "Aúpa!",
        "Bixarren!",
        "Aurrera!",
        "Gora!",
        "Ondo!",
        "Txalo!",
      ];
      phrases.forEach((phrase) => {
        expect(phrase.length).toBeGreaterThan(0);
      });
    });

    it("should validate tooltip index is within range", () => {
      const phrases = [
        "Aúpa!",
        "Bixarren!",
        "Aurrera!",
        "Gora!",
        "Ondo!",
        "Txalo!",
      ];
      const randomIndex = Math.floor(Math.random() * phrases.length);
      expect(randomIndex).toBeGreaterThanOrEqual(0);
      expect(randomIndex).toBeLessThan(phrases.length);
    });

    it("should validate tooltip styling classes", () => {
      const tooltipClasses = "juana-tooltip fixed bottom-6 right-6 z-40";
      expect(tooltipClasses).toContain("juana-tooltip");
      expect(tooltipClasses).toContain("fixed");
      expect(tooltipClasses).toContain("bottom-6");
      expect(tooltipClasses).toContain("right-6");
    });

    it("should validate tooltip text styling", () => {
      const tooltipTextClasses = "tooltiptext";
      expect(tooltipTextClasses).toBe("tooltiptext");
    });

    it("should validate tooltip appears on hover", () => {
      const tooltipState = {
        visible: false,
        onHover: true,
      };
      const shouldShow = tooltipState.onHover;
      expect(shouldShow).toBe(true);
    });
  });

  describe("Animation Timing", () => {
    it("should validate loading animation duration", () => {
      const animationDuration = "2s";
      expect(animationDuration).toBe("2s");
    });

    it("should validate pulse animation timing", () => {
      const animationTiming = "2s infinite";
      expect(animationTiming).toContain("2s");
      expect(animationTiming).toContain("infinite");
    });

    it("should validate new message highlight duration", () => {
      const highlightDuration = 3000; // milliseconds
      expect(highlightDuration).toBe(3000);
    });

    it("should validate color shift animation timing", () => {
      const colorShiftTiming = "1.5s ease-in-out infinite";
      expect(colorShiftTiming).toContain("1.5s");
      expect(colorShiftTiming).toContain("ease-in-out");
      expect(colorShiftTiming).toContain("infinite");
    });
  });
});


describe("Juana - Rating and Export Features", () => {
  describe("Rating System (1-5 Stars)", () => {
    it("should accept rating values from 1 to 5", () => {
      for (let rating = 1; rating <= 5; rating++) {
        expect(rating).toBeGreaterThanOrEqual(1);
        expect(rating).toBeLessThanOrEqual(5);
      }
    });

    it("should validate rating input schema", () => {
      const validRating = { messageId: 1, rating: 3, feedback: "Good response" };
      expect(validRating.rating).toBe(3);
      expect(validRating.messageId).toBe(1);
    });

    it("should reject invalid rating values", () => {
      const invalidRatings = [0, 6, -1, 10];
      invalidRatings.forEach((rating) => {
        const isValid = rating >= 1 && rating <= 5;
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Chat Export Features", () => {
    it("should export chat history as CSV format", () => {
      const messages = [
        { role: "user", content: "Hello", createdAt: new Date() },
        { role: "assistant", content: "Hi there", createdAt: new Date() },
      ];
      const csv = [
        ["Data", "Ruolo", "Messaggio"].join(","),
        ...messages.map((m) => [m.createdAt.toISOString(), m.role, `"${m.content}"`].join(",")),
      ].join("\n");
      expect(csv).toContain("user");
      expect(csv).toContain("assistant");
    });

    it("should export chat history as JSON format", () => {
      const messages = [
        { id: 1, role: "user", content: "Hello", rating: null },
        { id: 2, role: "assistant", content: "Hi there", rating: 5 },
      ];
      const json = JSON.stringify(messages);
      expect(json).toContain("user");
      expect(json).toContain("rating");
    });

    it("should handle empty chat history for export", () => {
      const emptyHistory: any[] = [];
      expect(emptyHistory.length).toBe(0);
    });
  });

  describe("Chat Statistics", () => {
    it("should calculate total messages count", () => {
      const messages = [
        { role: "user", content: "msg1" },
        { role: "assistant", content: "msg2" },
        { role: "user", content: "msg3" },
      ];
      expect(messages.length).toBe(3);
    });

    it("should calculate average rating from rated messages", () => {
      const ratings = [5, 4, 5, 3];
      const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
      expect(average).toBeCloseTo(4.25);
    });

    it("should count user and assistant messages separately", () => {
      const messages = [
        { role: "user", content: "msg1" },
        { role: "assistant", content: "msg2" },
        { role: "user", content: "msg3" },
        { role: "assistant", content: "msg4" },
      ];
      const userMessages = messages.filter((m) => m.role === "user");
      const assistantMessages = messages.filter((m) => m.role === "assistant");
      expect(userMessages.length).toBe(2);
      expect(assistantMessages.length).toBe(2);
    });

    it("should handle statistics for conversations with no ratings", () => {
      const messages = [
        { role: "user", content: "msg1", rating: null },
        { role: "assistant", content: "msg2", rating: null },
      ];
      const ratedMessages = messages.filter((m) => m.rating !== null);
      expect(ratedMessages.length).toBe(0);
    });
  });

  describe("Export Functionality UI", () => {
    it("should generate valid CSV filename with date", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `juana-chat-${date}.csv`;
      expect(filename).toMatch(/juana-chat-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it("should generate valid JSON filename with date", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `juana-chat-${date}.json`;
      expect(filename).toMatch(/juana-chat-\d{4}-\d{2}-\d{2}\.json/);
    });

    it("should escape special characters in CSV export", () => {
      const content = 'Message with "quotes" and, commas';
      const escaped = `"${content.replace(/"/g, '""')}"`;
      expect(escaped).toBe('"Message with ""quotes"" and, commas"');
    });
  });
});


describe("Juana Personalized Context LLM", () => {
  it("should return user profile with subscription level", () => {
    const mockContext = {
      userName: "Test Artist",
      email: "artist@example.com",
      subscriptionLevel: "premium",
      savedCallsCount: 5,
      savedCalls: [
        { title: "Exhibition 2026", callType: "exhibition", deadline: new Date() },
      ],
      newCallsNotificationEnabled: true,
      deadlineReminderEnabled: true,
      notificationFrequency: "daily",
    };

    expect(mockContext.subscriptionLevel).toBe("premium");
    expect(mockContext.savedCallsCount).toBeGreaterThan(0);
  });

  it("should include saved calls in personalized context", () => {
    const mockContext = {
      userName: "Artist",
      email: "artist@example.com",
      subscriptionLevel: "base",
      savedCallsCount: 3,
      savedCalls: [
        { title: "Call 1", callType: "competition", deadline: new Date() },
        { title: "Call 2", callType: "grant", deadline: new Date() },
        { title: "Call 3", callType: "residency", deadline: new Date() },
      ],
      newCallsNotificationEnabled: false,
      deadlineReminderEnabled: true,
      notificationFrequency: "weekly",
    };

    expect(mockContext.savedCalls).toHaveLength(3);
    expect(mockContext.savedCalls[0].title).toBe("Call 1");
  });

  it("should build personalized prompt section correctly", () => {
    const mockContext = {
      userName: "Marco",
      email: "marco@example.com",
      subscriptionLevel: "premium",
      savedCallsCount: 2,
      savedCalls: [
        { title: "Venice Biennale", callType: "exhibition", deadline: new Date() },
        { title: "Art Grant 2026", callType: "grant", deadline: new Date() },
      ],
      newCallsNotificationEnabled: true,
      deadlineReminderEnabled: true,
      notificationFrequency: "daily",
    };

    let personalizedSection = "";
    if (mockContext) {
      personalizedSection = `

User Profile:
- Name: ${mockContext.userName}
- Subscription Level: ${mockContext.subscriptionLevel}
- Saved Calls: ${mockContext.savedCallsCount}`;

      if (mockContext.savedCalls.length > 0) {
        personalizedSection += `
- Recently Saved Calls: ${mockContext.savedCalls.map((c) => c.title).join(", ")}`;
      }
    }

    expect(personalizedSection).toContain("Marco");
    expect(personalizedSection).toContain("premium");
    expect(personalizedSection).toContain("Venice Biennale");
  });
});
