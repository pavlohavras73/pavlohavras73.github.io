import { Hero } from "@/components/worlds/fpv/Hero";
import { Drones } from "@/components/worlds/fpv/Drones";
import { Features, Maps, Pipeline, Status } from "@/components/worlds/fpv/Sections";
import { Hazard } from "@/components/worlds/fpv/Kit";

export default function FpvPage() {
  return (
    <>
      <Hero />
      <Hazard items={["ARMED", "ACRO", "6S 25.2V", "RADIOMASTER POCKET", "UNITY 6", "PHYSICS FIRST"]} />
      <Drones />
      <Pipeline />
      <Hazard items={["GOLDEN VECTORS", "PID AUTO-TUNE", "VOLTAGE SAG", "VORTEX RING", "ACRO RATES"]} />
      <Features />
      <Maps />
      <Hazard items={["22 GATES", "48 × 28 M", "4 STOREYS", "VOXEL CHECK", "IN DEVELOPMENT"]} />
      <Status />
    </>
  );
}
