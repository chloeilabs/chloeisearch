import { describe, expect, it } from "vitest";

import {
  contentTypeForArtifactPath,
  getArtifactPreviewKind,
  isInlineArtifactPreview,
} from "@/lib/cursor/artifact-preview";

describe("artifact preview helpers", () => {
  it("classifies images and videos by path", () => {
    expect(getArtifactPreviewKind("demo/screenshot.png")).toBe("image");
    expect(getArtifactPreviewKind("demo/walkthrough.mp4")).toBe("video");
    expect(getArtifactPreviewKind("logs/output.txt")).toBe("file");
  });

  it("respects content types when provided", () => {
    expect(getArtifactPreviewKind("blob", "video/webm")).toBe("video");
    expect(getArtifactPreviewKind("blob", "image/png")).toBe("image");
  });

  it("maps paths to content types", () => {
    expect(contentTypeForArtifactPath("a.png")).toBe("image/png");
    expect(contentTypeForArtifactPath("a.mp4")).toBe("video/mp4");
  });

  it("knows which kinds can render inline", () => {
    expect(isInlineArtifactPreview("image")).toBe(true);
    expect(isInlineArtifactPreview("file")).toBe(false);
  });
});
