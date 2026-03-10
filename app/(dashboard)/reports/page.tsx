import { getReportsData } from "@/lib/data";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { ExportReportsButton } from "@/components/reports/export-reports-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ReportsPage() {
  const reports = await getReportsData();
  const maxDepartment = Math.max(...reports.departmentUsage.map((item) => item.total), 1);
  const maxService = Math.max(...reports.otherServicesUsage.map((item) => item.total), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Department print usage, other services usage, and daily revenue snapshots.</p>
        </div>
        <ExportReportsButton reports={reports} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Department print usage</CardTitle>
            <CardDescription>Total copies by department.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.departmentUsage.map((item) => (
              <div key={item.department} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.department}</span>
                  <span>{formatNumber(item.total)} copies</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${(item.total / maxDepartment) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Other services usage</CardTitle>
            <CardDescription>Quantities by non-print service.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.otherServicesUsage.map((item) => (
              <div key={item.service} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{item.service}</span>
                  <span>{formatNumber(item.total)}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground" style={{ width: `${(item.total / maxService) * 100}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily revenue</CardTitle>
            <CardDescription>Revenue totals across recorded orders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {reports.dailyRevenue.map((item) => (
              <div key={item.date} className="flex items-center justify-between rounded-2xl border px-4 py-3 text-sm">
                <span>{item.date}</span>
                <span className="font-medium">{formatCurrency(item.total)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
