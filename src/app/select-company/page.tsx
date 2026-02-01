
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import prisma from "@/lib/prisma"
import { selectCompany } from "@/actions/tenant-actions"
import { Building2, Globe } from "lucide-react"

export default async function SelectCompanyPage() {
    const settings = await prisma.settings.findMany({
        select: {
            id: true,
            companyName: true
        }
    })

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-2xl shadow-xl border-none">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold text-slate-800">Selecciona una Empresa</CardTitle>
                    <CardDescription className="text-lg">
                        Elige el espacio de trabajo que deseas gestionar
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6 p-8">
                    {settings.map((company) => (
                        <form key={company.id} action={selectCompany.bind(null, company.id)}>
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full h-auto flex flex-col items-center p-8 gap-4 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                            >
                                <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    {company.companyName.includes('ES') ? (
                                        <Globe className="h-8 w-8 text-slate-600 group-hover:text-blue-600" />
                                    ) : (
                                        <Building2 className="h-8 w-8 text-slate-600 group-hover:text-blue-600" />
                                    )}
                                </div>
                                <div className="space-y-1 text-center">
                                    <h3 className="font-bold text-xl text-slate-800">{company.companyName}</h3>
                                    <p className="text-sm text-slate-500">
                                        {company.companyName.includes('ES') ? 'Espacio nuevo' : 'Datos históricos'}
                                    </p>
                                </div>
                            </Button>
                        </form>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
