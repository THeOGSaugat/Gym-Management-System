import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string | number;
  description?: string;
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="text-sm font-normal text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight">{value}</p>
        {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
      </CardContent>
    </Card>
  );
}
