"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Clock, Map, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { getApplications, sortByRegion, sortByTime } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"

export default function QueuePage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [sortType, setSortType] = useState<"time" | "region">("time")
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

  const handleSort = async (type: "time" | "region") => {
    setSortType(type)
    setIsLoading(true)
    try {
      if (type === "region") {
        const sorted = await sortByRegion()
        setApplications(sorted)
      } else {
        const sorted = await sortByTime()
        setApplications(sorted)
      }
    } catch (error) {
      console.error("Error sorting applications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const pendingCount = applications.filter((app) => app.status === "pending").length
  const verifiedCount = applications.filter((app) => app.status === "verified").length
  const revisionCount = applications.filter((app) => app.status === "revision").length

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
              <h1 className="text-2xl font-bold">Antrean Verifikasi KTP</h1>
              <p className="text-muted-foreground">Pantau status pengajuan KTP dalam antrean verifikasi</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={sortType === "time" ? "default" : "outline"}
                onClick={() => handleSort("time")}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Clock className="h-4 w-4" />
                Urutkan berdasar Waktu
              </Button>
              <Button
                variant={sortType === "region" ? "default" : "outline"}
                onClick={() => handleSort("region")}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <Map className="h-4 w-4" />
                Urutkan berdasar Wilayah
              </Button>
              <Button
                variant="outline"
                onClick={loadApplications}
                className="flex items-center gap-2"
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Menunggu Verifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100"
                  >
                    Pending
                  </Badge>
                  <span className="text-2xl font-bold">{pendingCount}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Terverifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    Verified
                  </Badge>
                  <span className="text-2xl font-bold">{verifiedCount}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Dalam Revisi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    Revision
                  </Badge>
                  <span className="text-2xl font-bold">{revisionCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">Tidak ada pengajuan KTP dalam antrean</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {applications.map((app, index) => (
                <Card key={app.id} className="overflow-hidden">
                  <div
                    className={`h-2 ${
                      app.status === "verified"
                        ? "bg-green-500"
                        : app.status === "revision"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                    }`}
                  />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {app.status === "verified" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : app.status === "revision" ? (
                            <RefreshCw className="h-5 w-5 text-blue-500" />
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
                        <span
                          className={
                            app.status === "verified"
                              ? "text-green-500"
                              : app.status === "revision"
                                ? "text-blue-500"
                                : "text-amber-500"
                          }
                        >
                          {app.status === "verified"
                            ? "Terverifikasi"
                            : app.status === "revision"
                              ? "Dalam Revisi"
                              : "Menunggu Verifikasi"}
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
