import { Constellation } from "./Constellation";
import { GridScan } from "./GridScan";

/** Fixed ambient background: grid with a scan wave, constellation and noise. */
export function Background() {
  return (
    <div aria-hidden className="pointer-events-none">
      <div className="grid-bg" />
      <GridScan />
      <Constellation />
      <div className="noise" />
    </div>
  );
}
