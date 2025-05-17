"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, PieChart, BarChartIcon, Map } from "lucide-react"
import { getApplications } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"

export default function StatisticsPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const apps = await getApplications()
      setApplications(apps)
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Calculate statistics
  const totalApplications = applications.length
  const pendingCount = applications.filter((app) => app.status === "pending").length
  const verifiedCount = applications.filter((app) => app.status === "verified").length
  const revisionCount = applications.filter((app) => app.status === "revision").length

  const pendingPercentage = totalApplications ? Math.round((pendingCount / totalApplications) * 100) : 0
  const verifiedPercentage = totalApplications ? Math.round((verifiedCount / totalApplications) * 100) : 0
  const revisionPercentage = totalApplications ? Math.round((revisionCount / totalApplications) * 100) : 0

  // Group by region
  const regionCounts: Record<string, number> = {}
  applications.forEach((app) => {
    if (regionCounts[app.region]) {
      regionCounts[app.region]++
    } else {
      regionCounts[app.region] = 1
    }
  })

  // Sort regions by count
  const sortedRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5) // Top 5 regions

  // Group by day
  const dayStats: Record<string, number> = {}
  applications.forEach((app) => {
    const date = new Date(app.submissionTime).toLocaleDateString()
    if (dayStats[date]) {
      dayStats[date]++
    } else {
      dayStats[date] = 1
    }
  })

  // Get last 7 days
  const last7Days = Object.entries(dayStats)
    .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
    .slice(0, 7)
    .reverse()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-4 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 flex-grow">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Statistik Pengajuan KTP</h1>
              <p className="text-muted-foreground">Analisis data pengajuan KTP</p>
            </div>
            <Button
              variant="outline"
              onClick={loadApplications}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Data
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <PieChart className="h-5 w-5" />
                      Status Pengajuan
                    </CardTitle>
                    <CardDescription>Distribusi status pengajuan KTP</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total Pengajuan:</span>
                        <span className="font-bold">{totalApplications}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-amber-500">Menunggu Verifikasi</span>
                          <span>
                            {pendingCount} ({pendingPercentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full"
                            style={{ width: `${pendingPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-green-500">Terverifikasi</span>
                          <span>
                            {verifiedCount} ({verifiedPercentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${verifiedPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-blue-500">Dalam Revisi</span>
                          <span>
                            {revisionCount} ({revisionPercentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${revisionPercentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Map className="h-5 w-5" />
                      Top 5 Wilayah
                    </CardTitle>
                    <CardDescription>Wilayah dengan pengajuan terbanyak</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sortedRegions.length > 0 ? (
                        sortedRegions.map(([region, count], index) => (
                          <div key={region} className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>{region}</span>
                              <span>{count} pengajuan</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(count / sortedRegions[0][1]) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Tidak ada data wilayah</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChartIcon className="h-5 w-5" />
                      Tren 7 Hari Terakhir
                    </CardTitle>
                    <CardDescription>Jumlah pengajuan per hari</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {last7Days.length > 0 ? (
                        last7Days.map(([date, count], index) => (
                          <div key={date} className="space-y-2">
                            <div className="flex justify-between text-xs">
                              <span>{date}</span>
                              <span>{count} pengajuan</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{
                                  width: `${(count / Math.max(...last7Days.map((d) => d[1]))) * 100}%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-center text-muted-foreground py-4">Tidak ada data tren</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Statistik</CardTitle>
                  <CardDescription>Ringkasan statistik pengajuan KTP</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Total Pengajuan</div>
                      <div className="text-2xl font-bold">{totalApplications}</div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Wilayah Terbanyak</div>
                      <div className="text-2xl font-bold">{sortedRegions.length > 0 ? sortedRegions[0][0] : "-"}</div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Tingkat Verifikasi</div>
                      <div className="text-2xl font-bold">{verifiedPercentage}%</div>
                    </div>
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="text-sm text-muted-foreground">Pengajuan Hari Ini</div>
                      <div className="text-2xl font-bold">{dayStats[new Date().toLocaleDateString()] || 0}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
