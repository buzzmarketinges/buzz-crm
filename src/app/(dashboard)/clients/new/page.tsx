import { createCompany } from "@/actions/company-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default function NewClientPage() {
    return (
        <div className="container mx-auto py-10 space-y-8 max-w-2xl">
            <div className="flex items-center gap-4">
                <Link href="/clients">
                    <Button variant="ghost" size="icon"><ChevronLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-3xl font-bold">Nuevo Cliente</h1>
            </div>

            <form action={createCompany}>
                <Card>
                    <CardHeader>
                        <CardTitle>Datos de la Empresa</CardTitle>
                        <CardDescription>Información legal y de facturación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Interno (Alias)</Label>
                            <Input id="name" name="name" placeholder="Ej: TechCorp" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="businessName">Razón Social</Label>
                            <Input id="businessName" name="businessName" placeholder="Ej: Technology Corporation SL" required />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="taxId">CIF / NIF</Label>
                                <Input id="taxId" name="taxId" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="billingEmail">Email Facturas</Label>
                                <Input id="billingEmail" name="billingEmail" type="email" required />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="address">Dirección Fiscal</Label>
                            <Textarea id="address" name="address" />
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-end gap-2">
                        <Link href="/clients">
                            <Button variant="outline">Cancelar</Button>
                        </Link>
                        <Button type="submit">Guardar Cliente</Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
