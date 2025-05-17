"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Search } from "lucide-react"
import { getApplications, editApplication } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"

export default function EditPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [searchId, setSearchId] = useState("")
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    region: "",
  })

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const apps = await getApplications()
    setApplications(apps)
  }

  const handleSearch = () => {
    const app = applications.find((a) => a.id === searchId)
    if (app) {
      setSelectedApp(app)
      setFormData({
        name: app.name,
        address: app.address,
        region: app.region,
      })
    } else {
      setSelectedApp(null)
      setFormData({
        name: "",
        address: "",
        region: "",
      })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedApp) {
      await editApplication(selectedApp.id, formData)
      setSearchId("")
      setSelectedApp(null)
      setFormData({
        name: "",
        address: "",
        region: "",
      })
      loadApplications()
    }
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
            <CardTitle>Edit Pengajuan KTP</CardTitle>
            <CardDescription>Cari dan edit data pengajuan KTP yang sudah ada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Masukkan ID Pengajuan"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
              <Button type="button" onClick={handleSearch} className="flex-shrink-0">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {selectedApp ? (
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="region">Wilayah</Label>
                    <Input id="region" name="region" value={formData.region} onChange={handleChange} required />
                  </div>

                  <Button type="submit" className="w-full flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            ) : searchId ? (
              <div className="py-4 text-center text-muted-foreground">Pengajuan dengan ID tersebut tidak ditemukan</div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
