
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { getSettings } from "@/actions/settings-actions";
import { SimulationBar } from "@/components/SimulationBar";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const settings = await getSettings()
    const simulatedDate = settings?.simulatedDate ? new Date(settings.simulatedDate).toISOString() : null

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            <Sidebar />
            <div className="flex-1 md:ml-64 flex flex-col h-full bg-slate-50 transition-all duration-300">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center p-4 bg-white border-b border-slate-200 sticky top-0 z-30 shrink-0">
                    <MobileNav />
                    <span className="ml-3 font-bold text-slate-800">BuzzMarketing</span>
                </div>

                <SimulationBar simulatedDate={simulatedDate} />
                <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full overflow-hidden flex flex-col">
                    {children}
                </main>
            </div>
        </div>
    );
}
