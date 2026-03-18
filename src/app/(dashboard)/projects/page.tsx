import { getProjects } from "@/actions/projects-actions"
import { getCompanies } from "@/actions/company-actions"
import { ProjectsTable } from "@/components/ProjectsTable"

export default async function ProjectsPage() {
    const rawProjects = await getProjects()
    const companies = await getCompanies() // helpful for dialog forms

    return (
        <div className="container mx-auto py-10 space-y-8 max-w-7xl">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Proyectos</h1>
            </div>

            <ProjectsTable initialData={rawProjects} clients={companies} />
        </div>
    )
}
