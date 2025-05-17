import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Globe, RefreshCw, Database, FileText } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

export default function IntegrationPage() {
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
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Integrasi C++ dengan Supabase (Windows)</CardTitle>
            <CardDescription>
              Panduan untuk menjalankan aplikasi C++ di Windows yang terhubung dengan database Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cara Kerja Integrasi</h3>
              <p>
                Aplikasi C++ berjalan secara lokal di komputer Windows Anda dan berkomunikasi dengan Supabase melalui
                file teks dan script Node.js. Data disimpan di database Supabase dan dapat diakses melalui dashboard
                web.
              </p>

              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Arsitektur Sistem
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <span className="font-medium">Aplikasi C++ Lokal</span> - Menulis perintah ke file teks
                  </li>
                  <li>
                    <span className="font-medium">Script Node.js</span> - Membaca perintah dan berkomunikasi dengan
                    Supabase
                  </li>
                  <li>
                    <span className="font-medium">Database Supabase</span> - Menyimpan semua data aplikasi KTP
                  </li>
                  <li>
                    <span className="font-medium">Dashboard Web</span> - Menampilkan data dari Supabase untuk monitoring
                  </li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Langkah-langkah Penggunaan</h3>
              <ol className="list-decimal list-inside space-y-3">
                <li className="space-y-2">
                  <p>Pastikan Node.js sudah terinstal di komputer Anda</p>
                </li>
                <li className="space-y-2">
                  <p>Instal dependensi Node.js yang diperlukan:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>npm install</p>
                  </div>
                </li>
                <li className="space-y-2">
                  <p>Sinkronkan data awal dari Supabase:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>npm run sync</p>
                  </div>
                </li>
                <li className="space-y-2">
                  <p>Kompilasi dan jalankan program C++ di Windows:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>// Gunakan compiler C++ yang tersedia di Windows</p>
                    <p>g++ -std=c++17 cpp/ktp_system_simple.cpp -o ktp_system.exe</p>
                    <p>// Atau jalankan langsung dengan C++ runner</p>
                  </div>
                </li>
                <li>
                  Gunakan program C++ untuk menambah, mengedit, atau memverifikasi aplikasi KTP. Program akan
                  berkomunikasi dengan Supabase melalui file teks dan script Node.js.
                </li>
                <li>Buka dashboard web untuk melihat dan menganalisis data yang telah diinput melalui program C++.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Struktur File</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <FileText className="h-4 w-4 inline mr-1" />
                  <code className="bg-muted-foreground/20 px-1 rounded">data/ktp_applications_sync.txt</code> - File
                  sinkronisasi data aplikasi
                </li>
                <li>
                  <FileText className="h-4 w-4 inline mr-1" />
                  <code className="bg-muted-foreground/20 px-1 rounded">data/ktp_command.txt</code> - File perintah dari
                  C++ ke Node.js
                </li>
                <li>
                  <FileText className="h-4 w-4 inline mr-1" />
                  <code className="bg-muted-foreground/20 px-1 rounded">data/ktp_response.txt</code> - File respons dari
                  Node.js ke C++
                </li>
                <li>
                  <FileText className="h-4 w-4 inline mr-1" />
                  <code className="bg-muted-foreground/20 px-1 rounded">scripts/sync_command.js</code> - Script untuk
                  memproses perintah
                </li>
                <li>
                  <FileText className="h-4 w-4 inline mr-1" />
                  <code className="bg-muted-foreground/20 px-1 rounded">scripts/sync_data.js</code> - Script untuk
                  sinkronisasi data
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Persyaratan Sistem</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>Windows dengan C++ compiler atau C++ runner</li>
                <li>Node.js dan npm</li>
                <li>Koneksi internet untuk mengakses Supabase</li>
              </ul>
            </div>

            <div className="flex justify-center gap-4 pt-4">
              <Link href="/queue">
                <Button className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Lihat Data di Dashboard
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
