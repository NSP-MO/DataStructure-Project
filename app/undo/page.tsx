"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, RotateCcw, Search } from "lucide-react"
import { getApplications, undoRevision } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"

export default function UndoPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [searchId, setSearchId] = useState("")
  const [selectedApp, setSelectedApp] = useState<Applicant | null>(null)

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
    } else {
      setSelectedApp(null)
    }
  }

  const handleUndo = async () => {
    if (selectedApp) {
      await undoRevision(selectedApp.id)
      setSearchId("")
      setSelectedApp(null)
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
            <CardTitle>Batalkan Revisi</CardTitle>
            <CardDescription>Kembalikan data pengajuan KTP ke versi sebelumnya</CardDescription>
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

            {selectedApp && (
              <Card className="mt-6">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{selectedApp.name}</CardTitle>
                  <CardDescription>ID: {selectedApp.id}</CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Alamat:</div>
                      <div className="text-sm text-muted-foreground">{selectedApp.address}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Wilayah:</div>
                      <div className="text-sm text-muted-foreground">{selectedApp.region}</div>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-sm">
                      <span className="font-medium">Status: </span>
                      <span className={selectedApp.status === "verified" ? "text-green-500" : "text-amber-500"}>
                        {selectedApp.status === "verified" ? "Terverifikasi" : "Menunggu Verifikasi"}
                      </span>
                    </div>
                  </div>

                  <Button className="w-full mt-4 flex items-center gap-2" onClick={handleUndo}>
                    <RotateCcw className="h-4 w-4" />
                    Batalkan Revisi Terakhir
                  </Button>
                </CardContent>
              </Card>
            )}

            {searchId && !selectedApp && (
              <div className="py-4 text-center text-muted-foreground">Pengajuan dengan ID tersebut tidak ditemukan</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
