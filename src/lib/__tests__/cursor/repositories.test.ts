import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const list = vi.fn();

vi.mock("@cursor/sdk", () => ({
  Cursor: {
    repositories: { list },
  },
}));

describe("listCursorRepositories", () => {
  beforeEach(() => {
    vi.resetModules();
    list.mockReset();
    process.env.CURSOR_API_KEY = "key_test";
  });

  it("uses the server-side API key and caches repeated calls", async () => {
    list.mockResolvedValue([
      { url: "https://github.com/z/z" },
      { url: "https://github.com/a/a" },
    ]);

    const { listCursorRepositories } = await import("@/lib/cursor/repositories");

    const first = await listCursorRepositories();
    const second = await listCursorRepositories();

    expect(list).toHaveBeenCalledTimes(1);
    expect(list).toHaveBeenCalledWith({ apiKey: "key_test" });
    expect(first.map((repo) => repo.url)).toEqual([
      "https://github.com/a/a",
      "https://github.com/z/z",
    ]);
    expect(second).toEqual(first);
  });
});
