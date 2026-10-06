import type { PlanPoint } from "../types";

import {
  type RawObject
} from "./core";

export type ValidWall = RawObject & {
  id: string;
  from: PlanPoint;
  to: PlanPoint;
  thicknessMeters: number;
};

export interface ValidJunction {
  at: PlanPoint;
  wallIds: string[];
  path: string;
}
