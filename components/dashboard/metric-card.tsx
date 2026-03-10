import { Card, CardContent } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  hint
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-6">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{hint}</p>
        </div>
      </CardContent>
    </Card>
  );
}
