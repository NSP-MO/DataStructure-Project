import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Globe, RefreshCw, Database } from "lucide-react"
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
            <CardTitle className="text-2xl">Integrasi C++ dengan Supabase</CardTitle>
            <CardDescription>
              Panduan untuk menjalankan aplikasi C++ lokal yang terhubung dengan database Supabase
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cara Kerja Integrasi</h3>
              <p>
                Aplikasi C++ berjalan secara lokal di komputer Anda, tetapi data disimpan di database Supabase. Aplikasi
                C++ berkomunikasi dengan API Next.js yang kemudian meneruskan data ke Supabase.
              </p>

              <div className="bg-muted p-4 rounded-md">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Arsitektur Sistem
                </h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>
                    <span className="font-medium">Aplikasi C++ Lokal</span> - Mengirim permintaan HTTP ke API Next.js
                  </li>
                  <li>
                    <span className="font-medium">API Next.js</span> - Menerima permintaan dan berkomunikasi dengan
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
                  <p>Pastikan Anda telah menginstal dependensi yang diperlukan:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p># Untuk Ubuntu/Debian</p>
                    <p>sudo apt-get install libcurl4-openssl-dev nlohmann-json3-dev</p>
                    <p># Untuk macOS</p>
                    <p>brew install curl nlohmann-json</p>
                  </div>
                </li>
                <li className="space-y-2">
                  <p>Kompilasi program C++ menggunakan script yang disediakan:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>chmod +x scripts/compile_cpp_supabase.sh</p>
                    <p>./scripts/compile_cpp_supabase.sh</p>
                  </div>
                </li>
                <li className="space-y-2">
                  <p>Jalankan aplikasi Next.js secara lokal:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>npm run dev</p>
                  </div>
                </li>
                <li className="space-y-2">
                  <p>Jalankan program C++ yang telah dikompilasi:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <p>./build/ktp_system</p>
                  </div>
                </li>
                <li>
                  Gunakan program C++ untuk menambah, mengedit, atau memverifikasi aplikasi KTP. Data akan otomatis
                  disimpan di Supabase.
                </li>
                <li>Buka dashboard web untuk melihat dan menganalisis data yang telah diinput melalui program C++.</li>
              </ol>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Persyaratan Sistem</h3>
              <ul className="list-disc list-inside space-y-2">
                <li>C++17 atau lebih baru</li>
                <li>Library libcurl untuk HTTP requests</li>
                <li>Library nlohmann/json untuk parsing JSON</li>
                <li>Node.js dan npm untuk menjalankan aplikasi Next.js</li>
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
