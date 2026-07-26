import { listLocations } from "./location.repository";

export function getLocations() {
  return listLocations();
}
