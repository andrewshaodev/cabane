/** Coordinated cabinet and appliance fronts. */
export const KITCHEN_FINISH_VARIANTS = [
  { id: "default", label: "White" },
  { id: "black", label: "Black" },
  { id: "wood", label: "Wood" },
];
export function kitchenFinish(variant = "default") {
  return variant === "black" ? "#303331" : variant === "wood" ? "#bc9362" : "#f4f2ec";
}
