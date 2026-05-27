import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/admin-sidebar'

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const isSuperAdmin = (session?.user as any)?.isSuperAdmin === true

  if (!session || !isSuperAdmin) {
    redirect('/admin-panel/login')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 border-b border-white/[0.06] flex items-center justify-between px-6 bg-[#0a0a12]/80 backdrop-blur-sm shrink-0">
          <div />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-white/80">{(session.user as any)?.name}</p>
              <p className="text-[10px] text-red-400 font-medium">Super Admin</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              {((session.user as any)?.name ?? 'A')[0].toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
