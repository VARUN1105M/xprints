"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";

export function ExportReportsButton({
  reports
}: {
  reports: {
    departmentUsage: Array<{ department: string; total: number }>;
    otherServicesUsage: Array<{ service: string; total: number }>;
    dailyRevenue: Array<{ date: string; total: number }>;
  };
}) {
  return (
    <Button
      variant="outline"
      onClick={() => {
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reports.departmentUsage), "Department Usage");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reports.otherServicesUsage), "Other Services");
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(reports.dailyRevenue), "Daily Revenue");
        XLSX.writeFile(workbook, `xprints-reports-${new Date().toISOString().slice(0, 10)}.xlsx`);
      }}
    >
      Export to Excel
    </Button>
  );
}
