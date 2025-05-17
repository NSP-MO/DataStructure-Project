"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Search } from "lucide-react"
import { getApplications } from "@/lib/ktp-actions"
import type { Applicant } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function StatusPage() {
  const [applications, setApplications] = useState<Applicant[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Applicant[]>([])

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

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const results = applications.filter(
      (app) =>
        app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    setSearchResults(results)
  }

  // Calculate statistics
  const totalApplications = applications.length
  const pendingCount = applications.filter((app) => app.status === "pending").length
  const verifiedCount = applications.filter((app) => app.status === "verified").length
  const revisionCount = applications.filter((app) => app.status === "revision").length

  const verificationRate = totalApplications ? Math.round((verifiedCount / totalApplications) * 100) : 0

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
              <h1 className="text-2xl font-bold">Status Verifikasi KTP</h1>
              <p className="text-muted-foreground">Pantau status verifikasi pengajuan KTP</p>
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

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Total Pengajuan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalApplications}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Menunggu Verifikasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-amber-500">{pendingCount}</div>
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
                  <div className="text-3xl font-bold text-green-500">{verifiedCount}</div>
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
                  <div className="text-3xl font-bold text-blue-500">{revisionCount}</div>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                    Revision
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tingkat Verifikasi</CardTitle>
              <CardDescription>Persentase pengajuan yang telah diverifikasi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tingkat Verifikasi:</span>
                  <span className="font-bold">{verificationRate}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-4">
                  <div className="bg-green-500 h-4 rounded-full" style={{ width: `${verificationRate}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cek Status Pengajuan</CardTitle>
              <CardDescription>Cari pengajuan berdasarkan ID atau nama</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Masukkan ID atau nama..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button onClick={handleSearch} disabled={isLoading} className="flex-shrink-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : searchQuery && searchResults.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Tidak ditemukan pengajuan dengan ID atau nama tersebut
                </div>
              ) : searchResults.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.map((app) => (
                    <Card key={app.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{app.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {app.id}</div>
                            <div className="text-sm text-muted-foreground">Wilayah: {app.region}</div>
                            <div className="text-sm text-muted-foreground">
                              Tanggal: {new Date(app.submissionTime).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.status === "verified" ? (
                              <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <span className="text-green-500 font-medium">Terverifikasi</span>
                              </>
                            ) : app.status === "revision" ? (
                              <>
                                <RefreshCw className="h-5 w-5 text-blue-500" />
                                <span className="text-blue-500 font-medium">Dalam Revisi</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                                <span className="text-amber-500 font-medium">Menunggu Verifikasi</span>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
