import { getDashboardStats } from "@/actions/dashboard-actions"
import { DashboardContent } from "@/components/DashboardContent"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  return <DashboardContent stats={stats} />
}
