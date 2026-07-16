export type PickupIssueInput = {
  checklist: {
    hasNewDamage: boolean | null;
    hasSmokingEvidence: boolean | null;
    isLateReturn: boolean | null;
    keysReturned: boolean | null;
  };
  fuelLevelPercent?: number;
  mileage?: number;
};

export type PickupDeliveryBaseline = {
  fuel_level_percent: number | null;
  mileage: number | null;
};

export function getPickupIssueMessages(
  input: PickupIssueInput,
  delivery: PickupDeliveryBaseline | null,
) {
  const issues: string[] = [];

  if (!delivery) {
    issues.push("No matching delivery report found");
  }

  if (input.checklist.keysReturned === false) {
    issues.push("Keys were not returned");
  }

  if (input.checklist.hasNewDamage) {
    issues.push("New damage reported");
  }

  if (input.checklist.hasSmokingEvidence) {
    issues.push("Smoking or vaping evidence reported");
  }

  if (input.checklist.isLateReturn) {
    issues.push("Late return reported");
  }

  if (
    typeof input.mileage === "number"
    && typeof delivery?.mileage === "number"
    && input.mileage < delivery.mileage
  ) {
    issues.push("Return mileage is lower than delivery mileage");
  }

  if (
    typeof input.fuelLevelPercent === "number"
    && typeof delivery?.fuel_level_percent === "number"
    && input.fuelLevelPercent < delivery.fuel_level_percent
  ) {
    issues.push("Return fuel is lower than delivery fuel");
  } else if (
    typeof input.fuelLevelPercent === "number"
    && input.fuelLevelPercent <= 25
  ) {
    issues.push("Return fuel is low");
  }

  return issues;
}
