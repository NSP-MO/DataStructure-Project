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

interface DailyActivity {
  application: Applicant
  activityType: "submitted" | "modified" | "verified"
  activityTime: number
}

export default function ReportsPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string>("")
  const [dailyActivities, setDailyActivities] = useState<DailyActivity[]>([])

  useEffect(() => {
    loadApplications()
  }, [])

  useEffect(() => {
    // Set initial date to today after applications are loaded
    if (!selectedDate) {
      const today = new Date()
      setSelectedDate(today.toISOString().split("T")[0])
    }
  }, [selectedDate])

  useEffect(() => {
    filterDailyActivities()
  }, [applications, selectedDate])

  // Helper function to safely create and validate dates
  const createSafeDate = (timestamp: number | string | Date): Date | null => {
    try {
      let date: Date

      if (typeof timestamp === "number") {
        // Handle both milliseconds and seconds timestamps
        date = timestamp > 1000000000000 ? new Date(timestamp) : new Date(timestamp * 1000)
      } else if (typeof timestamp === "string") {
        date = new Date(timestamp)
      } else if (timestamp instanceof Date) {
        date = timestamp
      } else {
        return null
      }

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return null
      }

      return date
    } catch (error) {
      console.error("Error creating date:", error)
      return null
    }
  }

  const loadApplications = async () => {
    setIsLoading(true)
    try {
      const apps = await getApplications()
      console.log("Loaded applications:", apps)
      setApplications(apps)
    } catch (error) {
      console.error("Error loading applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterDailyActivities = () => {
    if (!selectedDate || applications.length === 0) {
      setDailyActivities([])
      return
    }

    try {
      const selectedDateObj = new Date(selectedDate)
      selectedDateObj.setHours(0, 0, 0, 0)

      const nextDay = new Date(selectedDateObj)
      nextDay.setDate(nextDay.getDate() + 1)

      console.log("Filtering for date range:", selectedDateObj, "to", nextDay)

      const activities: DailyActivity[] = []

      applications.forEach((app) => {
        // Check submission time
        const submissionDate = createSafeDate(app.submissionTime)
        if (submissionDate && submissionDate >= selectedDateObj && submissionDate < nextDay) {
          activities.push({
            application: app,
            activityType: "submitted",
            activityTime: submissionDate.getTime(),
          })
        }

        // For revision status, consider it as a modification activity
        if (app.status === "revision") {
          const modificationDate = createSafeDate(app.submissionTime)
          if (modificationDate && modificationDate >= selectedDateObj && modificationDate < nextDay) {
            activities.push({
              application: app,
              activityType: "modified",
              activityTime: modificationDate.getTime(),
            })
          }
        }

        // For verified status, consider it as a verification activity
        if (app.status === "verified") {
          const verificationDate = createSafeDate(app.submissionTime)
          if (verificationDate && verificationDate >= selectedDateObj && verificationDate < nextDay) {
            activities.push({
              application: app,
              activityType: "verified",
              activityTime: verificationDate.getTime(),
            })
          }
        }
      })

      console.log("Found activities:", activities)

      // Sort activities by time (most recent first)
      activities.sort((a, b) => b.activityTime - a.activityTime)
      setDailyActivities(activities)
    } catch (e) {
      console.error("Error in filterDailyActivities:", e)
      setDailyActivities([])
    }
  }

  // Get available dates from applications (last 30 days + dates with actual data)
  const getAvailableDates = () => {
    const dates = new Set<string>()

    // Add last 30 days
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.add(date.toISOString().split("T")[0])
    }

    // Add dates from actual application data
    applications.forEach((app) => {
      const appDate = createSafeDate(app.submissionTime)
      if (appDate) {
        dates.add(appDate.toISOString().split("T")[0])
      }
    })

    return Array.from(dates).sort().reverse()
  }

  const availableDates = getAvailableDates()

  // Calculate statistics for the selected date
  const submittedToday = dailyActivities.filter((activity) => activity.activityType === "submitted").length
  const modifiedToday = dailyActivities.filter((activity) => activity.activityType === "modified").length
  const verifiedToday = dailyActivities.filter((activity) => activity.activityType === "verified").length
  const totalActivities = dailyActivities.length

  // Group by region for daily activities
  const regionActivityCounts: Record<string, number> = {}
  dailyActivities.forEach((activity) => {
    const region = activity.application.region
    regionActivityCounts[region] = (regionActivityCounts[region] || 0) + 1
  })

  // Sort regions by activity count
  const sortedRegionActivities = Object.entries(regionActivityCounts).sort((a, b) => b[1] - a[1])

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    try {
      const date = new Date(dateString + "T00:00:00")
      const options: Intl.DateTimeFormatOptions = {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }
      return date.toLocaleDateString("id-ID", options)
    } catch (e) {
      console.error("Error formatting date:", e)
      return dateString
    }
  }

  // Format time for display
  const formatTimeForDisplay = (timestamp: number) => {
    try {
      const date = createSafeDate(timestamp)
      if (!date) {
        return "Waktu tidak valid"
      }
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (e) {
      console.error("Error formatting time:", e)
      return "Waktu tidak valid"
    }
  }

  // Format full date and time for display
  const formatFullDateTime = (timestamp: number) => {
    try {
      const date = createSafeDate(timestamp)
      if (!date) {
        return "Tanggal tidak valid"
      }
      return date.toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (e) {
      console.error("Error formatting full date time:", e)
      return "Tanggal tidak valid"
    }
  }

  const getActivityTypeLabel = (type: string) => {
    switch (type) {
      case "submitted":
        return "Diajukan"
      case "modified":
        return "Dimodifikasi"
      case "verified":
        return "Diverifikasi"
      default:
        return "Aktivitas"
    }
  }

  const getActivityTypeBadge = (type: string) => {
    switch (type) {
      case "submitted":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Pengajuan Baru</Badge>
      case "modified":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">Modifikasi</Badge>
      case "verified":
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Verifikasi</Badge>
      default:
        return <Badge variant="outline">Aktivitas</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">Terverifikasi</Badge>
        )
      case "revision":
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Dalam Revisi</Badge>
      case "pending":
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
            Menunggu Verifikasi
          </Badge>
        )
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
              <h1 className="text-2xl font-bold">Laporan Aktivitas Harian</h1>
              <p className="text-muted-foreground">
                Laporan aktivitas pengajuan, modifikasi, dan verifikasi KTP per hari
              </p>
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
                disabled={dailyActivities.length === 0}
                onClick={() => {
                  const csvContent = dailyActivities
                    .map(
                      (activity) =>
                        `${formatFullDateTime(activity.activityTime)},${activity.application.id},${activity.application.name},${activity.application.region},${getActivityTypeLabel(activity.activityType)},${activity.application.status}`,
                    )
                    .join("\n")
                  const blob = new Blob([`Waktu,ID,Nama,Wilayah,Aktivitas,Status\n${csvContent}`], { type: "text/csv" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `laporan-harian-${selectedDate}.csv`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
              >
                <Download className="h-4 w-4" />
                Download CSV
              </Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Pilih Tanggal</CardTitle>
              <CardDescription>Pilih tanggal untuk melihat aktivitas harian</CardDescription>
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
                      {availableDates.map((date) => (
                        <SelectItem key={date} value={date}>
                          {formatDateForDisplay(date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedDate && <span>Menampilkan aktivitas untuk {formatDateForDisplay(selectedDate)}</span>}
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Aktivitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalActivities}</div>
                    <p className="text-xs text-muted-foreground mt-1">{applications.length} total aplikasi</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Pengajuan Baru</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-blue-500">{submittedToday}</div>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">Baru</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Modifikasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-amber-500">{modifiedToday}</div>
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                        Diubah
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Verifikasi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-3xl font-bold text-green-500">{verifiedToday}</div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                        Selesai
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {sortedRegionActivities.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Aktivitas per Wilayah</CardTitle>
                    <CardDescription>Distribusi aktivitas berdasarkan wilayah</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {sortedRegionActivities.map(([region, count]) => (
                        <div key={region} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{region}</span>
                            <span>{count} aktivitas</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{
                                width: `${(count / sortedRegionActivities[0][1]) * 100}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Riwayat Aktivitas</CardTitle>
                  <CardDescription>
                    {dailyActivities.length > 0
                      ? `Daftar ${dailyActivities.length} aktivitas pada tanggal yang dipilih (diurutkan berdasarkan waktu terbaru)`
                      : "Tidak ada aktivitas pada tanggal yang dipilih"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {dailyActivities.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        Tidak ada aktivitas pada tanggal {formatDateForDisplay(selectedDate)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">Coba pilih tanggal lain atau refresh data</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 px-4">Waktu</th>
                            <th className="text-left py-2 px-4">ID Aplikasi</th>
                            <th className="text-left py-2 px-4">Nama</th>
                            <th className="text-left py-2 px-4">Wilayah</th>
                            <th className="text-left py-2 px-4">Jenis Aktivitas</th>
                            <th className="text-left py-2 px-4">Status Saat Ini</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailyActivities.map((activity, index) => (
                            <tr
                              key={`${activity.application.id}-${activity.activityType}-${index}`}
                              className="border-b hover:bg-muted/50"
                            >
                              <td className="py-2 px-4 text-sm font-mono">
                                {formatTimeForDisplay(activity.activityTime)}
                              </td>
                              <td className="py-2 px-4 text-sm font-mono">{activity.application.id}</td>
                              <td className="py-2 px-4">{activity.application.name}</td>
                              <td className="py-2 px-4">{activity.application.region}</td>
                              <td className="py-2 px-4">{getActivityTypeBadge(activity.activityType)}</td>
                              <td className="py-2 px-4">{getStatusBadge(activity.application.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
