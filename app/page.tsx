import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeIcon as IdCard, Users, Clock, Map, FileEdit, RotateCcw, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "KTP Online Application System",
  description: "System for submitting and managing KTP applications",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-6 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IdCard className="h-8 w-8" />
              <h1 className="text-2xl font-bold">KTP Online System</h1>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Sistem Pengajuan KTP Online</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Sistem untuk mengajukan pembuatan/perpanjangan KTP, dengan fitur antrean verifikasi, pengurutan berdasar
            wilayah/waktu, enkripsi data pemohon, dan riwayat revisi data.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {[
            {
              icon: <Users className="h-5 w-5" />,
              title: "Pengajuan KTP",
              description: "Ajukan pembuatan atau perpanjangan KTP secara online",
              content: "Isi formulir dengan data diri lengkap untuk mengajukan KTP baru atau perpanjangan.",
              link: "/submit",
              buttonText: "Ajukan Sekarang",
            },
            {
              icon: <Clock className="h-5 w-5" />,
              title: "Antrean Verifikasi",
              description: "Lihat status antrean verifikasi KTP",
              content: "Pantau status pengajuan KTP dan posisi dalam antrean verifikasi.",
              link: "/queue",
              buttonText: "Lihat Antrean",
            },
            {
              icon: <Map className="h-5 w-5" />,
              title: "Pengurutan Data",
              description: "Urutkan data berdasarkan wilayah atau waktu",
              content: "Fitur pengurutan data berdasarkan wilayah atau waktu pengajuan.",
              link: "/sort",
              buttonText: "Urutkan Data",
            },
            {
              icon: <FileEdit className="h-5 w-5" />,
              title: "Edit Pengajuan",
              description: "Edit data pengajuan KTP",
              content: "Ubah data pengajuan KTP jika terdapat kesalahan atau perubahan.",
              link: "/edit",
              buttonText: "Edit Pengajuan",
            },
            {
              icon: <RotateCcw className="h-5 w-5" />,
              title: "Batalkan Revisi",
              description: "Batalkan revisi data yang telah dilakukan",
              content: "Kembalikan data ke versi sebelumnya jika terjadi kesalahan saat revisi.",
              link: "/undo",
              buttonText: "Batalkan Revisi",
            },
            {
              icon: <Code className="h-5 w-5" />,
              title: "Integrasi C++",
              description: "Integrasi dengan program C++",
              content: "Panduan untuk menghubungkan aplikasi C++ dengan aplikasi web KTP Online.",
              link: "/integration",
              buttonText: "Lihat Panduan",
            },
          ].map((item, index) => (
            <Card key={index} className="flex flex-col h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {item.icon}
                  <span>{item.title}</span>
                </CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>{item.content}</p>
              </CardContent>
              <CardFooter className="pt-2">
                <Link href={item.link} className="w-full">
                  <Button className="w-full">{item.buttonText}</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </section>
      </main>

      <footer className="bg-muted py-6 mt-auto">
        <div className="container mx-auto px-4">
          <p className="text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} KTP Online Application System
          </p>
        </div>
      </footer>
    </div>
  )
}
