import { describe, expect, it, vi } from "vitest";

import {
  createCursorAgentName,
  cursorAgentNameMaxLength,
  getValidRenameSummary,
  parseCreateAgentRunInput,
  parseUpdateAgentRunInput,
  summarizeTaskPrompt,
  taskSummaryMaxLength,
} from "@/lib/validation/agent-run";

vi.mock("server-only", () => ({}));

describe("parseCreateAgentRunInput", () => {
  it("normalizes valid run input", () => {
    const parsed = parseCreateAgentRunInput({
      repoUrl: "https://github.com/acme/web.git",
      startingRef: "main",
      taskPrompt: "Update the README",
      autoCreatePR: true,
    });

    expect(parsed.repoUrl).toBe("https://github.com/acme/web");
    expect(parsed.startingRef).toBe("main");
  });

  it("rejects shell-like refs with whitespace", () => {
    expect(() =>
      parseCreateAgentRunInput({
        repoUrl: "https://github.com/acme/web",
        startingRef: "main && rm -rf /",
        taskPrompt: "Do work",
      })
    ).toThrow();
  });
});

describe("summarizeTaskPrompt", () => {
  it("collapses whitespace and truncates long prompts", () => {
    const summary = summarizeTaskPrompt(`${"Fix ".repeat(80)}\n\nTests`);

    expect(summary.length).toBeLessThanOrEqual(taskSummaryMaxLength);
    expect(summary).not.toContain("\n");
  });
});



describe("parseUpdateAgentRunInput", () => {
  it("normalizes summary whitespace", () => {
    const parsed = parseUpdateAgentRunInput({
      taskSummary: "  Ship   sidebar   polish  ",
    });

    expect(parsed.taskSummary).toBe("Ship sidebar polish");
  });


  it("accepts archived flag", () => {
    const parsed = parseUpdateAgentRunInput({ archived: true });
    expect(parsed.archived).toBe(true);
    expect(parsed.taskSummary).toBeUndefined();
  });

  it("requires at least one field", () => {
    expect(() => parseUpdateAgentRunInput({})).toThrow();
  });

  it("rejects empty summaries", () => {
    expect(() =>
      parseUpdateAgentRunInput({
        taskSummary: "   ",
      })
    ).toThrow();
  });
});

describe("getValidRenameSummary", () => {
  it("returns null when unchanged or blank", () => {
    expect(
      getValidRenameSummary({
        draftSummary: "Fix tests",
        originalSummary: "Fix tests",
      })
    ).toBeNull();
    expect(
      getValidRenameSummary({
        draftSummary: "   ",
        originalSummary: "Fix tests",
      })
    ).toBeNull();
  });

  it("truncates long renames", () => {
    const summary = getValidRenameSummary({
      draftSummary: `${"Rename ".repeat(40)}`,
      originalSummary: "Old title",
    });

    expect(summary).not.toBeNull();
    expect(summary!.length).toBeLessThanOrEqual(taskSummaryMaxLength);
  });
});

describe("createCursorAgentName", () => {
  it("caps generated Cursor agent names at the SDK limit", () => {
    const name = createCursorAgentName(`${"Fix ".repeat(80)}\n\nTests`);

    expect(name.length).toBeLessThanOrEqual(cursorAgentNameMaxLength);
    expect(name).not.toContain("\n");
    expect(name.endsWith("...")).toBe(true);
  });

  it("uses a safe fallback for blank summaries", () => {
    expect(createCursorAgentName("   ")).toBe("Chloei Code task");
  });
});
