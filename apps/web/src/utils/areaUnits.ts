export const AREA_UNITS = [
  { value: 'sqft', label: 'Square feet (sq ft)', shortLabel: 'sq ft', squareFeet: 1 },
  { value: 'sqyd', label: 'Square yards (gaz)', shortLabel: 'sq yd', squareFeet: 9 },
  { value: 'sqm', label: 'Square meters (m²)', shortLabel: 'm²', squareFeet: 10.7639104167 },
  { value: 'marla272', label: 'Marla (272.25 sq ft)', shortLabel: 'marla', squareFeet: 272.25 },
  { value: 'marla225', label: 'Marla (225 sq ft)', shortLabel: 'marla', squareFeet: 225 },
  { value: 'kanal272', label: 'Kanal (20 × 272.25 sq ft marla)', shortLabel: 'kanal', squareFeet: 5445 },
  { value: 'kanal225', label: 'Kanal (20 × 225 sq ft marla)', shortLabel: 'kanal', squareFeet: 4500 },
  { value: 'acre', label: 'Acres', shortLabel: 'acre', squareFeet: 43560 },
] as const;

export type AreaUnitValue = (typeof AREA_UNITS)[number]['value'];

export function getAreaUnit(value?: string) {
  return AREA_UNITS.find((unit) => unit.value === value) ?? AREA_UNITS[0];
}

export function convertAreaToSquareFeet(value: number, unitValue?: string) {
  return value * getAreaUnit(unitValue).squareFeet;
}

export function formatAreaFromSquareFeet(squareFeet: number, unitValue?: string) {
  const unit = getAreaUnit(unitValue);
  const converted = squareFeet / unit.squareFeet;
  const rounded = Number(converted.toFixed(2));
  return `${rounded.toLocaleString()} ${unit.shortLabel}`;
}
