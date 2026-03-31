import { hasMinimumRole, ROLE_HIERARCHY } from "@/lib/roles";

describe("ROLE_HIERARCHY", () => {
  it("owner outranks admin outranks member outranks viewer", () => {
    expect(ROLE_HIERARCHY["org:owner"]).toBeGreaterThan(ROLE_HIERARCHY["org:admin"]);
    expect(ROLE_HIERARCHY["org:admin"]).toBeGreaterThan(ROLE_HIERARCHY["org:member"]);
    expect(ROLE_HIERARCHY["org:member"]).toBeGreaterThan(ROLE_HIERARCHY["org:viewer"]);
  });
});

describe("hasMinimumRole", () => {
  // --- Positive cases ---
  it("owner satisfies owner requirement", () => {
    expect(hasMinimumRole("org:owner", "org:owner")).toBe(true);
  });

  it("owner satisfies admin requirement", () => {
    expect(hasMinimumRole("org:owner", "org:admin")).toBe(true);
  });

  it("owner satisfies member requirement", () => {
    expect(hasMinimumRole("org:owner", "org:member")).toBe(true);
  });

  it("owner satisfies viewer requirement", () => {
    expect(hasMinimumRole("org:owner", "org:viewer")).toBe(true);
  });

  it("admin satisfies admin requirement", () => {
    expect(hasMinimumRole("org:admin", "org:admin")).toBe(true);
  });

  it("admin satisfies member requirement", () => {
    expect(hasMinimumRole("org:admin", "org:member")).toBe(true);
  });

  it("member satisfies member requirement", () => {
    expect(hasMinimumRole("org:member", "org:member")).toBe(true);
  });

  it("viewer satisfies viewer requirement", () => {
    expect(hasMinimumRole("org:viewer", "org:viewer")).toBe(true);
  });

  // --- Negative cases ---
  it("viewer does NOT satisfy member requirement", () => {
    expect(hasMinimumRole("org:viewer", "org:member")).toBe(false);
  });

  it("viewer does NOT satisfy admin requirement", () => {
    expect(hasMinimumRole("org:viewer", "org:admin")).toBe(false);
  });

  it("member does NOT satisfy admin requirement", () => {
    expect(hasMinimumRole("org:member", "org:admin")).toBe(false);
  });

  it("admin does NOT satisfy owner requirement", () => {
    expect(hasMinimumRole("org:admin", "org:owner")).toBe(false);
  });

  // --- Edge cases ---
  it("returns false for undefined userRole", () => {
    expect(hasMinimumRole(undefined, "org:viewer")).toBe(false);
  });

  it("returns false for null userRole", () => {
    expect(hasMinimumRole(null, "org:viewer")).toBe(false);
  });

  it("returns false for an unrecognised role string", () => {
    expect(hasMinimumRole("org:superadmin", "org:viewer")).toBe(false);
  });

  it("returns false for an empty string role", () => {
    expect(hasMinimumRole("", "org:viewer")).toBe(false);
  });
});
