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
    // Set initial date after applications are loaded
    if (applications.length > 0 && !selectedDate) {
      const today = new Date().toISOString().split("T")[0]
      setSelectedDate(today)
    }
  }, [applications, selectedDate])

  useEffect(() => {
    filterDailyActivities()
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

  const filterDailyActivities = () => {
    if (!selectedDate) {
      setDailyActivities([])
      return
    }

    try {
      const selectedDateObj = new Date(selectedDate)
      if (!isValidDate(selectedDateObj)) {
        console.error("Invalid selected date:", selectedDate)
        setDailyActivities([])
        return
      }

      selectedDateObj.setHours(0, 0, 0, 0)
      const nextDay = new Date(selectedDateObj)
      nextDay.setDate(nextDay.getDate() + 1)

      const activities: DailyActivity[] = []

      applications.forEach((app) => {
        try {
          // Check if submitted on this date
          const submissionDate = new Date(app.submissionTime)
          if (isValidDate(submissionDate) && submissionDate >= selectedDateObj && submissionDate < nextDay) {
            activities.push({
              application: app,
              activityType: "submitted",
              activityTime: app.submissionTime,
            })
          }

          // Check if modified on this date (for revision status)
          if (app.status === "revision") {
            // For revision status, we assume it was modified recently
            // In a real system, you'd have a lastModified timestamp
            const modificationTime = app.submissionTime + Math.random() * 86400000 // Simulate modification time
            const modificationDate = new Date(modificationTime)

            if (isValidDate(modificationDate) && modificationDate >= selectedDateObj && modificationDate < nextDay) {
              activities.push({
                application: app,
                activityType: "modified",
                activityTime: modificationTime,
              })
            }
          }

          // Check if verified on this date
          if (app.status === "verified") {
            // For verified status, we assume it was verified recently
            // In a real system, you'd have a verificationTime timestamp
            const verificationTime = app.submissionTime + Math.random() * 172800000 // Simulate verification time
            const verificationDate = new Date(verificationTime)

            if (isValidDate(verificationDate) && verificationDate >= selectedDateObj && verificationDate < nextDay) {
              activities.push({
                application: app,
                activityType: "verified",
                activityTime: verificationTime,
              })
            }
          }
        } catch (e) {
          console.error("Error processing application activity:", e)
        }
      })

      // Sort activities by time (most recent first)
      activities.sort((a, b) => b.activityTime - a.activityTime)
      setDailyActivities(activities)
    } catch (e) {
      console.error("Error in filterDailyActivities:", e)
      setDailyActivities([])
    }
  }

  // Get available dates from activities (last 30 days)
  const getAvailableDates = () => {
    const dates: string[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      dates.push(date.toISOString().split("T")[0])
    }

    return dates
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
      return date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (e) {
      console.error("Error formatting time:", e)
      return "Invalid Time"
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
          ) : dailyActivities.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">Tidak ada aktivitas pada tanggal yang dipilih</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Total Aktivitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{totalActivities}</div>
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
                    Daftar aktivitas pada tanggal yang dipilih (diurutkan berdasarkan waktu terbaru)
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                          <tr key={`${activity.application.id}-${activity.activityType}-${index}`} className="border-b">
                            <td className="py-2 px-4 text-sm font-mono">
                              {formatTimeForDisplay(activity.activityTime)}
                            </td>
                            <td className="py-2 px-4 text-sm">{activity.application.id}</td>
                            <td className="py-2 px-4">{activity.application.name}</td>
                            <td className="py-2 px-4">{activity.application.region}</td>
                            <td className="py-2 px-4">{getActivityTypeBadge(activity.activityType)}</td>
                            <td className="py-2 px-4">
                              {activity.application.status === "verified" ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  Terverifikasi
                                </Badge>
                              ) : activity.application.status === "revision" ? (
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
