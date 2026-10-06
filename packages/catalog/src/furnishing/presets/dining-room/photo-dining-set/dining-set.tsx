import { CustomDiningChair } from "./dining-chair";
import { CustomDiningTable } from "./dining-table";
import { LivingRoomTablePlant } from "./table-plant";

export function CustomDiningSet({ footprintScale = 1 }: { readonly footprintScale?: number }) {
  return (
    <group
      name="coin-repas-salon-custom"
      scale={[footprintScale, 1, footprintScale]}
      userData={{ walkCollider: true }}
    >
      <CustomDiningTable />
      <LivingRoomTablePlant />
      <CustomDiningChair position={[0, 0, -0.79]} rotationY={0} />
      <CustomDiningChair position={[0, 0, 0.79]} rotationY={Math.PI} />
      <CustomDiningChair position={[-0.79, 0, 0]} rotationY={Math.PI / 2} />
      <CustomDiningChair position={[0.79, 0, 0]} rotationY={-Math.PI / 2} />
    </group>
  );
}
