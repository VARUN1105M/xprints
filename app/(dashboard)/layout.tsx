import { RealtimeRefresh } from "@/components/dashboard/realtime-refresh";
import { Topbar } from "@/components/layout/topbar";
import { FeedbackProvider } from "@/components/providers/feedback-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <FeedbackProvider>
      <div className="min-h-screen bg-background">
        <Topbar />
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <main className="min-w-0 overflow-x-hidden">{children}</main>
        </div>
        <RealtimeRefresh />
      </div>
    </FeedbackProvider>
  );
}
