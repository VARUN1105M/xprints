import { AppSidebar } from "@/components/layout/app-sidebar";
import { RealtimeRefresh } from "@/components/dashboard/realtime-refresh";
import { Topbar } from "@/components/layout/topbar";
import { FeedbackProvider } from "@/components/providers/feedback-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider>
      <div className="min-h-screen bg-background">
        <div className="mx-auto flex w-full max-w-[1600px] gap-4 px-3 py-3 sm:gap-6 sm:px-6 sm:py-4 lg:px-8">
          <AppSidebar />
          <div className="flex min-h-[calc(100vh-1.5rem)] flex-1 flex-col gap-4 sm:min-h-[calc(100vh-2rem)] sm:gap-6">
            <Topbar />
            <main className="flex-1">{children}</main>
          </div>
        </div>
        <RealtimeRefresh />
      </div>
    </FeedbackProvider>
  );
}
