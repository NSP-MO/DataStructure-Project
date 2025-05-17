"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, Map, CheckCircle2, AlertCircle } from "lucide-react"
import { getApplications, sortByRegion, sortByTime } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"

export default function SortPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [sortType, setSortType] = useState<"time" | "region">("time")

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    const apps = await getApplications()
    setApplications(apps)
  }

  const handleSort = async (type: "time" | "region") => {
    setSortType(type)
    if (type === "region") {
      const sorted = await sortByRegion()
      setApplications(sorted)
    } else {
      const sorted = await sortByTime()
      setApplications(sorted)
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
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Pengurutan Data KTP</h1>
            <div className="flex gap-2">
              <Button
                variant={sortType === "time" ? "default" : "outline"}
                onClick={() => handleSort("time")}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Urutkan berdasar Waktu
              </Button>
              <Button
                variant={sortType === "region" ? "default" : "outline"}
                onClick={() => handleSort("region")}
                className="flex items-center gap-2"
              >
                <Map className="h-4 w-4" />
                Urutkan berdasar Wilayah
              </Button>
            </div>
          </div>

          {applications.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">Tidak ada data pengajuan KTP</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app, index) => (
                <Card key={app.id} className="overflow-hidden">
                  <div className={`h-2 ${app.status === "verified" ? "bg-green-500" : "bg-amber-500"}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {app.status === "verified" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-amber-500" />
                          )}
                          <span>{app.name}</span>
                        </CardTitle>
                        <CardDescription>ID: {app.id}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">Posisi: {index + 1}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(app.submissionTime).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium">Alamat:</div>
                        <div className="text-sm text-muted-foreground">{app.address}</div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">Wilayah:</div>
                        <div className="text-sm text-muted-foreground">{app.region}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm">
                        <span className="font-medium">Status: </span>
                        <span className={app.status === "verified" ? "text-green-500" : "text-amber-500"}>
                          {app.status === "verified" ? "Terverifikasi" : "Menunggu Verifikasi"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
