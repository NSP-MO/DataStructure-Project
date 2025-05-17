import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileCode, Globe, RefreshCw } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function IntegrationPage() {
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
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Integrasi C++ dengan Web</CardTitle>
            <CardDescription>Panduan untuk menghubungkan aplikasi C++ dengan aplikasi web KTP Online</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cara Kerja Integrasi</h3>
              <p>
                Aplikasi C++ dan aplikasi web berbagi data melalui file JSON yang sama. Ketika Anda menambahkan data di
                aplikasi C++, data tersebut akan tersedia di aplikasi web, dan sebaliknya.
              </p>

              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <FileCode className="h-4 w-4" />
                  Struktur File
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <code className="bg-muted-foreground/20 px-1 rounded">data/ktp_applications.json</code> - Menyimpan
                    data aplikasi KTP
                  </li>
                  <li>
                    <code className="bg-muted-foreground/20 px-1 rounded">data/ktp_revisions.json</code> - Menyimpan
                    riwayat revisi
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Langkah-langkah Penggunaan</h3>
              <ol className="list-decimal list-inside space-y-3">
                <li className="space-y-2">
                  <p>Kompilasi dan jalankan program C++ yang telah dimodifikasi:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>g++ -std=c++17 ktp_system_modified.cpp -o ktp_system -lnlohmann_json</p>
                    <p>./ktp_system</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Catatan: Anda perlu menginstal library nlohmann/json untuk C++
                  </p>
                </li>
                <li>Gunakan program C++ untuk menambah, mengedit, atau memverifikasi aplikasi KTP</li>
                <li>Buka aplikasi web dan lihat data yang sama yang telah Anda masukkan melalui program C++</li>
                <li>
                  Anda juga dapat menambah atau mengedit data melalui aplikasi web, dan data tersebut akan tersedia di
                  program C++
                </li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Persyaratan Sistem</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>C++17 atau lebih baru</li>
                <li>
                  Library nlohmann/json untuk C++ (
                  <a
                    href="https://github.com/nlohmann/json"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    https://github.com/nlohmann/json
                  </a>
                  )
                </li>
                <li>Node.js dan npm untuk menjalankan aplikasi web</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Link href="/queue">
                <Button className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Lihat Data di Web
                </Button>
              </Link>
              <Link href="/queue">
                <Button variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Refresh Data
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
