import { Hero } from "@/components/worlds/hangar/Hero";
import { Doors } from "@/components/worlds/hangar/Doors";
import { About } from "@/components/worlds/hangar/About";
import { Contact } from "@/components/worlds/hangar/Contact";

export default function HangarPage() {
  return (
    <>
      <Hero />
      <Doors />
      <About />
      <Contact />
    </>
  );
}
