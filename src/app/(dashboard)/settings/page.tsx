import { getSettings } from "@/actions/settings-actions"
import { SettingsContent } from "@/components/settings/SettingsContent"

export default async function SettingsPage() {
    const settings = await getSettings()

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-7xl">
            <h1 className="text-3xl font-bold">Ajustes</h1>
            <SettingsContent settings={{
                ...settings,
                yearlyGoal: settings?.yearlyGoal ? Number(settings.yearlyGoal) : 100000,
                taxRate: settings?.taxRate ? Number(settings.taxRate) : 0,
                withholdingRate: settings?.withholdingRate ? Number(settings.withholdingRate) : 0
            }} />
        </div>
    )
}
