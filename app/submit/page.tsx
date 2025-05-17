"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import { submitApplication } from "@/lib/ktp-actions"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SubmitPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await submitApplication(formData)
    router.push("/queue")
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Beranda</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 flex-grow">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Formulir Pengajuan KTP</CardTitle>
            <CardDescription>Isi data diri Anda dengan lengkap dan benar untuk pengajuan KTP</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Masukkan nama lengkap"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Input
                  id="address"
                  name="address"
                  placeholder="Masukkan alamat lengkap"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="region">Wilayah</Label>
                <Input
                  id="region"
                  name="region"
                  placeholder="Masukkan kode wilayah (contoh: JKT, BDG)"
                  value={formData.region}
                  onChange={handleChange}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full flex items-center gap-2">
                <Save className="h-4 w-4" />
                Ajukan Permohonan
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
