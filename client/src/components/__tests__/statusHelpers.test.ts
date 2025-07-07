import { describe, it, expect } from "vitest";

// Status helpers (copy from dashboard.tsx for test context)
const isAssignmentInTransit = (status: string) =>
  status === "In Transit" || status === "Assigned";
const isAssignmentDelivered = (status: string) => status === "Delivered";
const isAssignmentCancelled = (status: string) => status === "Cancelled";
const getAssignmentStatusLabel = (status: string) => {
  if (isAssignmentDelivered(status)) return "Delivered";
  if (isAssignmentInTransit(status)) return "In Transit/Assigned";
  if (isAssignmentCancelled(status)) return "Cancelled";
  return status || "Unknown";
};

describe("Status Helpers", () => {
  it("should detect in transit and assigned", () => {
    expect(isAssignmentInTransit("In Transit")).toBe(true);
    expect(isAssignmentInTransit("Assigned")).toBe(true);
    expect(isAssignmentInTransit("Delivered")).toBe(false);
    expect(isAssignmentInTransit("")).toBe(false);
  });

  it("should detect delivered", () => {
    expect(isAssignmentDelivered("Delivered")).toBe(true);
    expect(isAssignmentDelivered("Assigned")).toBe(false);
  });

  it("should detect cancelled", () => {
    expect(isAssignmentCancelled("Cancelled")).toBe(true);
    expect(isAssignmentCancelled("Assigned")).toBe(false);
  });

  it("should label known statuses", () => {
    expect(getAssignmentStatusLabel("Delivered")).toBe("Delivered");
    expect(getAssignmentStatusLabel("Assigned")).toBe("In Transit/Assigned");
    expect(getAssignmentStatusLabel("In Transit")).toBe("In Transit/Assigned");
    expect(getAssignmentStatusLabel("Cancelled")).toBe("Cancelled");
  });

  it("should fallback to unknown for legacy/empty", () => {
    expect(getAssignmentStatusLabel("LegacyStatus")).toBe("LegacyStatus");
    expect(getAssignmentStatusLabel("")).toBe("Unknown");
    expect(getAssignmentStatusLabel(undefined as any)).toBe("Unknown");
  });
});
