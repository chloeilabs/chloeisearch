import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const list = vi.fn();

vi.mock("@cursor/sdk", () => ({
  Cursor: {
    models: { list },
  },
}));

describe("listCursorModels cache", () => {
  beforeEach(() => {
    vi.resetModules();
    list.mockReset();
    process.env.CURSOR_API_KEY = "key_test";
  });

  it("caches model list within the TTL window", async () => {
    list.mockResolvedValue([
      { id: "z", displayName: "Zulu" },
      { id: "a", displayName: "Alpha" },
    ]);

    const { listCursorModels } = await import("@/lib/cursor/models");

    await listCursorModels();
    await listCursorModels();

    expect(list).toHaveBeenCalledTimes(1);
  });
});
