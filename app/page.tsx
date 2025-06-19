import type { Metadata } from "next"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { BadgeIcon as IdCard, Clock, Map, BarChart, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export const metadata: Metadata = {
  title: "KTP Monitoring Dashboard",
  description: "Dashboard for monitoring KTP applications",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-6 sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <IdCard className="h-8 w-8" />
              <h1 className="text-2xl font-bold">KTP Monitoring Dashboard</h1>
            </div>
            <div>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-grow">
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Sistem Monitoring KTP Online</h2>
          <p className="text-muted-foreground text-center max-w-2xl mx-auto">
            Dashboard untuk memantau antrean verifikasi KTP, melihat statistik, dan menganalisis data pengajuan KTP.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-12">
          {[
            {
              icon: <Clock className="h-5 w-5" />,
              title: "Antrean Verifikasi",
              description: "Lihat status antrean verifikasi KTP",
              content: "Pantau status pengajuan KTP dan posisi dalam antrean verifikasi secara real-time.",
              link: "/queue",
              buttonText: "Lihat Antrean",
            },
            {
              icon: <Map className="h-5 w-5" />,
              title: "Pengurutan Data",
              description: "Urutkan data berdasarkan wilayah atau waktu",
              content: "Lihat data pengajuan KTP yang diurutkan berdasarkan wilayah atau waktu pengajuan.",
              link: "/sort",
              buttonText: "Lihat Data",
            },
            {
              icon: <BarChart className="h-5 w-5" />,
              title: "Statistik Pengajuan",
              description: "Lihat statistik pengajuan KTP",
              content: "Analisis statistik pengajuan KTP berdasarkan wilayah, waktu, dan status verifikasi.",
              link: "/statistics",
              buttonText: "Lihat Statistik",
            },
            {
              icon: <RefreshCw className="h-5 w-5" />,
              title: "Status Verifikasi",
              description: "Pantau status verifikasi KTP",
              content: "Lihat status verifikasi pengajuan KTP dan persentase penyelesaian.",
              link: "/status",
              buttonText: "Lihat Status",
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
            &copy; {new Date().getFullYear()} KTP Monitoring Dashboard
          </p>
        </div>
      </footer>
    </div>
  )
}
