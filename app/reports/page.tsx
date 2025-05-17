"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, Download, Calendar } from "lucide-react"
import { getApplications } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

export default function ReportsPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [filteredApps, setFilteredApps] = useState<Applicant[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    // Set initial date after applications are loaded
    if (applications.length > 0 && !selectedDate) {
      const dates = applications
        .map((app) => {
          const date = new Date(app.submissionTime)
          return isValidDate(date) ? date.toISOString().split("T")[0] : null
        })
        .filter(Boolean) as string[]

      if (dates.length > 0) {
        // Sort dates and get the most recent
        const sortedDates = [...dates].sort().reverse()
        setSelectedDate(sortedDates[0])
      } else {
        // If no valid dates, set to today
        setSelectedDate(new Date().toISOString().split("T")[0])
      }
    }
  }, [applications, selectedDate])

  useEffect(() => {
    filterApplicationsByDate()
  }, [applications, selectedDate])

  // Helper function to check if a date is valid
  const isValidDate = (date: any): boolean => {
    return date instanceof Date && !isNaN(date.getTime())
  }

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

  const filterApplicationsByDate = () => {
    if (!selectedDate) {
      setFilteredApps([])
      return
    }

    try {
      const selectedDateObj = new Date(selectedDate)
      if (!isValidDate(selectedDateObj)) {
        console.error("Invalid selected date:", selectedDate)
        setFilteredApps([])
        return
      }

      selectedDateObj.setHours(0, 0, 0, 0)

      const nextDay = new Date(selectedDateObj)
      nextDay.setDate(nextDay.getDate() + 1)

      const filtered = applications.filter((app) => {
        try {
          const appDate = new Date(app.submissionTime)
          return isValidDate(appDate) && appDate >= selectedDateObj && appDate < nextDay
        } catch (e) {
          console.error("Error filtering application:", e)
          return false
        }
      })

      setFilteredApps(filtered)
    } catch (e) {
      console.error("Error in filterApplicationsByDate:", e)
      setFilteredApps([])
    }
  }

  // Get available dates from applications
  const availableDates = applications
    .map((app) => {
      try {
        const date = new Date(app.submissionTime)
        return isValidDate(date) ? date.toISOString().split("T")[0] : null
      } catch (e) {
        console.error("Error getting date from application:", e)
        return null
      }
    })
    .filter(Boolean) as string[]

  // Remove duplicates and sort
  const uniqueDates = [...new Set(availableDates)].sort().reverse()

  // Calculate statistics for the selected date
  const totalForDate = filteredApps.length
  const pendingForDate = filteredApps.filter((app) => app.status === "pending").length
  const verifiedForDate = filteredApps.filter((app) => app.status === "verified").length
  const revisionForDate = filteredApps.filter((app) => app.status === "revision").length

  // Group by region for the selected date
  const regionCountsForDate: Record<string, number> = {}
  filteredApps.forEach((app) => {
    if (regionCountsForDate[app.region]) {
      regionCountsForDate[app.region]++
    } else {
      regionCountsForDate[app.region] = 1
    }
  })

  // Sort regions by count
  const sortedRegionsForDate = Object.entries(regionCountsForDate).sort((a, b) => b[1] - a[1])

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (!isValidDate(date)) {
        return "Invalid Date"
      }

      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      return date.toLocaleDateString("id-ID", options)
    } catch (e) {
      console.error("Error formatting date:", e)
      return "Invalid Date"
    }
  }

  // Format time for display
  const formatTimeForDisplay = (timestamp: number) => {
    try {
      const date = new Date(timestamp)
      if (!isValidDate(date)) {
        return "Invalid Time"
      }
      return date.toLocaleTimeString()
    } catch (e) {
      console.error("Error formatting time:", e)
      return "Invalid Time"
    }
  }

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
              <h1 className="text-2xl font-bold">Laporan Harian</h1>
              <p className="text-muted-foreground">Laporan pengajuan KTP per hari</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadApplications}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh Data
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2"
                disabled={filteredApps.length === 0}
                onClick={() => {
                  // In a real app, this would generate and download a CSV/PDF
                  alert("Fitur download laporan akan diimplementasikan di versi selanjutnya")
                }}
              >
                <Download className="h-4 w-4" />
                Download Laporan
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pilih Tanggal</CardTitle>
              <CardDescription>Pilih tanggal untuk melihat laporan harian</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <Select value={selectedDate} onValueChange={setSelectedDate}>
                    <SelectTrigger className="w-[240px]">
                      <SelectValue placeholder="Pilih tanggal" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueDates.length > 0 ? (
                        uniqueDates.map((date) => (
                          <SelectItem key={date} value={date}>
                            {formatDateForDisplay(date)}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-data" disabled>
                          Tidak ada data
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedDate && <span>Menampilkan data untuk {formatDateForDisplay(selectedDate)}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApps.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  Tidak ada data pengajuan KTP pada tanggal yang dipilih
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Pengajuan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalForDate}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Menunggu Verifikasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-amber-500">{pendingForDate}</div>
                      <Badge
                        variant="outline"
                        className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                      >
                        Pending
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Terverifikasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-green-500">{verifiedForDate}</div>
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                      >
                        Verified
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Dalam Revisi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-blue-500">{revisionForDate}</div>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                      >
                        Revision
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Distribusi Wilayah</CardTitle>
                  <CardDescription>Distribusi pengajuan berdasarkan wilayah</CardDescription>
                </CardHeader>
                <CardContent>
                  {sortedRegionsForDate.length > 0 ? (
                    <div className="space-y-4">
                      {sortedRegionsForDate.map(([region, count]) => (
                        <div key={region} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{region}</span>
                            <span>{count} pengajuan</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(count / sortedRegionsForDate[0][1]) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">Tidak ada data wilayah</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daftar Pengajuan</CardTitle>
                  <CardDescription>Daftar pengajuan KTP pada tanggal yang dipilih</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 px-4">ID</th>
                          <th className="text-left py-2 px-4">Nama</th>
                          <th className="text-left py-2 px-4">Wilayah</th>
                          <th className="text-left py-2 px-4">Waktu</th>
                          <th className="text-left py-2 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredApps.map((app) => (
                          <tr key={app.id} className="border-b">
                            <td className="py-2 px-4 text-sm">{app.id}</td>
                            <td className="py-2 px-4">{app.name}</td>
                            <td className="py-2 px-4">{app.region}</td>
                            <td className="py-2 px-4 text-sm">{formatTimeForDisplay(app.submissionTime)}</td>
                            <td className="py-2 px-4">
                              {app.status === "verified" ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  Terverifikasi
                                </Badge>
                              ) : app.status === "revision" ? (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  Dalam Revisi
                                </Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                                  Menunggu Verifikasi
                                </Badge>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
