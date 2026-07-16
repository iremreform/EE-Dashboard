import { describe, expect, it } from "vitest";
import { getPickupIssueMessages, type PickupIssueInput } from "@/lib/pickup-rules";

function createInput(overrides: Partial<PickupIssueInput> = {}): PickupIssueInput {
  return {
    checklist: {
      hasNewDamage: false,
      hasSmokingEvidence: false,
      isLateReturn: false,
      keysReturned: true,
    },
    fuelLevelPercent: 75,
    mileage: 4_500,
    ...overrides,
  };
}

describe("pickup issue detection", () => {
  it("returns no issues for a normal matched return", () => {
    expect(getPickupIssueMessages(createInput(), {
      fuel_level_percent: 75,
      mileage: 4_200,
    })).toEqual([]);
  });

  it("flags every applicable checklist and baseline issue", () => {
    const issues = getPickupIssueMessages(createInput({
      checklist: {
        hasNewDamage: true,
        hasSmokingEvidence: true,
        isLateReturn: true,
        keysReturned: false,
      },
      fuelLevelPercent: 50,
      mileage: 4_000,
    }), {
      fuel_level_percent: 75,
      mileage: 4_200,
    });

    expect(issues).toEqual([
      "Keys were not returned",
      "New damage reported",
      "Smoking or vaping evidence reported",
      "Late return reported",
      "Return mileage is lower than delivery mileage",
      "Return fuel is lower than delivery fuel",
    ]);
  });

  it("flags an unmatched delivery and low fuel", () => {
    expect(getPickupIssueMessages(createInput({ fuelLevelPercent: 25 }), null)).toEqual([
      "No matching delivery report found",
      "Return fuel is low",
    ]);
  });

  it("does not duplicate low fuel when it is already lower than delivery fuel", () => {
    expect(getPickupIssueMessages(createInput({ fuelLevelPercent: 20 }), {
      fuel_level_percent: 50,
      mileage: 4_200,
    })).toEqual(["Return fuel is lower than delivery fuel"]);
  });
});
