import { cn } from "@/lib/utils";
import { metricasPlaceholder } from "./placeholder-data";

export function MetricsRow() {
  return (
    <div className="mt-20 grid grid-cols-2 gap-6 border-t border-hairline pt-12 md:grid-cols-4">
      {metricasPlaceholder.map(({ label, valor, tono }) => (
        <div key={label} className="text-center">
          <p className="text-label-caps uppercase text-ink-muted">{label}</p>
          <p
            className={cn(
              "text-h2",
              tono === "warning" ? "text-accent-orange" : "text-ink",
            )}
          >
            {valor}
          </p>
        </div>
      ))}
    </div>
  );
}
