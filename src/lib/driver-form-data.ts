import "server-only";

export function formDataToPayload(formData: FormData) {
  return Object.fromEntries(
    Array.from(formData.entries()).filter(([, value]) => typeof value === "string"),
  );
}

export function getFormValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export function parseFuelLevel(value: string) {
  const percentMatch = value.match(/(\d{1,3})\s*%/);
  const candidates = Array.from(value.replace(/,/g, "").matchAll(/\d+(\.\d+)?/g)).map(
    ([match]) => Number(match),
  );
  const fuelLevel = percentMatch
    ? Number(percentMatch[1])
    : candidates.length > 1
      ? candidates[candidates.length - 1]
      : candidates[0];

  if (typeof fuelLevel !== "number") {
    return undefined;
  }

  return fuelLevel >= 0 && fuelLevel <= 100 ? fuelLevel : undefined;
}

export function parseMileage(value: string) {
  const match = value.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : undefined;
}

export function parseYesNo(value: string) {
  if (value === "Yes") {
    return true;
  }

  if (value === "No") {
    return false;
  }

  return null;
}
