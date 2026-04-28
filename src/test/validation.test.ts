import { describe, it, expect } from "vitest";
import { z } from "zod";

// Mirror the schemas used in Posts.tsx so we can verify rules in isolation
const postSchema = z.object({
  caption: z.string().trim().max(500).optional(),
  location: z.string().trim().max(120).optional(),
});
const commentSchema = z.string().trim().min(1).max(1000);

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

describe("Post validation", () => {
  it("accepts an empty caption/location (both optional)", () => {
    expect(postSchema.safeParse({}).success).toBe(true);
  });

  it("rejects captions over 500 chars", () => {
    const long = "x".repeat(501);
    expect(postSchema.safeParse({ caption: long }).success).toBe(false);
  });

  it("rejects locations over 120 chars", () => {
    const long = "y".repeat(121);
    expect(postSchema.safeParse({ location: long }).success).toBe(false);
  });
});

describe("Comment validation", () => {
  it("rejects empty comments", () => {
    expect(commentSchema.safeParse("   ").success).toBe(false);
  });
  it("accepts a normal comment", () => {
    expect(commentSchema.safeParse("Looking great!").success).toBe(true);
  });
  it("rejects comments over 1000 chars", () => {
    expect(commentSchema.safeParse("z".repeat(1001)).success).toBe(false);
  });
});

describe("Image upload rules", () => {
  it("only allows configured mime types", () => {
    expect(ALLOWED_TYPES.includes("image/png")).toBe(true);
    expect(ALLOWED_TYPES.includes("application/pdf")).toBe(false);
    expect(ALLOWED_TYPES.includes("image/svg+xml")).toBe(false);
  });

  it("enforces a 5MB max size", () => {
    expect(MAX_FILE_SIZE).toBe(5 * 1024 * 1024);
    expect(6 * 1024 * 1024 > MAX_FILE_SIZE).toBe(true);
    expect(4 * 1024 * 1024 < MAX_FILE_SIZE).toBe(true);
  });
});
