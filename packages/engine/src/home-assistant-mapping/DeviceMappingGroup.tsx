import type { ReactNode } from "react";
import { DeviceCategoryIcon } from "../DeviceCategoryIcon";
import type { DeviceMappingGroup as DeviceMappingGroupModel } from "./device-mapping-groups";

export function DeviceMappingGroup({
  group,
  children,
}: {
  group: DeviceMappingGroupModel;
  children: ReactNode;
}) {
  return (
    <section className="device-mapping-group" data-group={group.id}>
      <header>
        <h3>
          <span aria-hidden="true">
            <DeviceCategoryIcon domain={group.iconDomain} size={16} />
          </span>
          {group.label}
        </h3>
      </header>
      <div className="device-mapping-group__rows">{children}</div>
    </section>
  );
}
