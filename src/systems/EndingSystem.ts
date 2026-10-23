import type { SizeState } from './SizeSystem';

export type Ending = { title: string; message: string; color: string };

export function getEnding({ politician, citizen }: SizeState): Ending {
  if (politician >= 7 && citizen <= 3) {
    return { title: 'THE GOLDEN THRONE', message: 'The throne is shiny. The crowd is not impressed. Someone is knocking at the door.', color: '#f5bb45' };
  }
  if (citizen >= 7 && politician <= 3) {
    return { title: 'THE PEOPLE CARRY ON', message: 'You lost the party vote. The people you helped carry you into a better kind of victory.', color: '#63c7a2' };
  }
  return { title: 'A BALANCED LEGACY', message: 'It took work to share the plate. The whole neighbourhood gets to celebrate.', color: '#65b9e8' };
}
