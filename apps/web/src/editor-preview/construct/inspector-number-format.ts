import {
  type ChangeEvent
} from "react";

const numberValue = (event: ChangeEvent<HTMLInputElement>) => Number(event.target.value);

export const formatPlanValue = (value: number) => Number.isInteger(value)
  ? value.toFixed(0)
  : value.toFixed(2).replace(/0+$/, "");
