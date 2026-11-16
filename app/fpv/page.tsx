import { Hero } from "@/components/worlds/fpv/Hero";
import { Drones } from "@/components/worlds/fpv/Drones";
import { Features, Maps, Pipeline, Status } from "@/components/worlds/fpv/Sections";

export default function FpvPage() {
  return (
    <>
      <Hero />
      <Drones />
      <Pipeline />
      <Features />
      <Maps />
      <Status />
    </>
  );
}
