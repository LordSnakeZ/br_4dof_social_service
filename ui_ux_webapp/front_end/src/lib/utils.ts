import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** mapa UI → ID Dynamixel */
export const jointToServo: Record<string, number> = {
  base: 1,
  hombro: 2,
  codo: 3,
  gripper: 4
};
