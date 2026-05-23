import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const list = vi.fn();

vi.mock("@cursor/sdk", () => ({
  Cursor: {
    models: { list },
  },
}));

describe("listCursorModels", () => {
  beforeEach(() => {
    vi.resetModules();
    list.mockReset();
    process.env.CURSOR_API_KEY = "key_test";
  });

  it("uses the server-side API key and sorts models", async () => {
    list.mockResolvedValue([
      { id: "z", displayName: "Zulu" },
      { id: "a", displayName: "Alpha" },
    ]);

    const { listCursorModels } = await import("@/lib/cursor/models");
    const models = await listCursorModels();

    expect(list).toHaveBeenCalledWith({ apiKey: "key_test" });
    expect(models.map((model) => model.id)).toEqual(["a", "z"]);
  });
});
