import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const create = vi.fn();
const send = vi.fn();

vi.mock("@cursor/sdk", () => ({
  Agent: {
    create,
  },
}));

describe("createCloudAgentRun", () => {
  beforeEach(() => {
    vi.resetModules();
    create.mockReset();
    send.mockReset();
    process.env.CURSOR_API_KEY = "key_test";
  });

  it("caps the Cursor agent name before calling the SDK", async () => {
    create.mockResolvedValue({ send });
    send.mockResolvedValue({
      agentId: "agent_123",
      id: "run_123",
      status: "RUNNING",
    });

    const { createCloudAgentRun } = await import("@/lib/cursor/agent-service");

    await createCloudAgentRun({
      name: `${"Fix ".repeat(80)}Tests`,
      repoUrl: "https://github.com/acme/web",
      startingRef: "main",
      taskPrompt: "Do the documented work.",
      modelId: "composer-2-5",
      autoCreatePR: true,
      idempotencyKey: "idem_123",
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0][0].name.length).toBeLessThanOrEqual(100);
    expect(create.mock.calls[0][0]).toMatchObject({
      apiKey: "key_test",
      model: { id: "composer-2-5" },
      cloud: {
        repos: [
          {
            url: "https://github.com/acme/web",
            startingRef: "main",
          },
        ],
        autoCreatePR: true,
      },
    });
    expect(send).toHaveBeenCalledWith("Do the documented work.", {
      idempotencyKey: "idem_123",
    });
  });
});
