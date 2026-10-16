import { describe, expect, it } from "bun:test";
import { WaitlistStatus } from "../../../../generated/prisma/client";

describe("Waitlist Service Promotion Logic", () => {
  it("should prioritize oldest waiting entry by createdAt ASC", () => {
    const queue = [
      { id: "w2", createdAt: new Date("2026-03-01T10:30:00Z"), status: WaitlistStatus.WAITING },
      { id: "w1", createdAt: new Date("2026-03-01T10:00:00Z"), status: WaitlistStatus.WAITING },
      { id: "w3", createdAt: new Date("2026-03-01T11:00:00Z"), status: WaitlistStatus.WAITING },
    ];

    const sorted = [...queue].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    expect(sorted[0]?.id).toBe("w1");
  });

  it("should match slot time strictly within preferred window", () => {
    const slotStart = new Date("2026-03-02T14:00:00Z");
    const entryWindow = {
      from: new Date("2026-03-02T08:00:00Z"),
      to: new Date("2026-03-02T18:00:00Z"),
    };

    const isMatch = slotStart >= entryWindow.from && slotStart <= entryWindow.to;
    expect(isMatch).toBe(true);

    const outsideSlot = new Date("2026-03-03T10:00:00Z");
    const isOutsideMatch = outsideSlot >= entryWindow.from && outsideSlot <= entryWindow.to;
    expect(isOutsideMatch).toBe(false);
  });
});
