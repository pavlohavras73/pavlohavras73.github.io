// Activity level shared by the page (writers: chat, diagram) and the orb (reader). No three.js here.
export const pulse = {
  energy: 0,
  /** 0..1: how "busy" Jarvis looks right now; decays in the orb's frame loop. */
  kick(amount = 1) { pulse.energy = Math.min(1.4, pulse.energy + amount); },
};
