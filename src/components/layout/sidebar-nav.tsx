import { useLocation, useNavigate } from 'react-router-dom'
import { Database, Building2, DollarSign, CreditCard, Library, LogOut } from 'lucide-react'

const navItems = [
  { label: 'Support Data', icon: Database, path: '#' },
  { label: 'Deposit IQ', icon: Building2, path: '#' },
  { label: 'Loan IQ', icon: DollarSign, path: '#', active: true, children: [
    { label: 'Segmentation', path: '/' },
  ]},
  { label: 'Credit IQ', icon: CreditCard, path: '#' },
  { label: 'Model Library', icon: Library, path: '#' },
]

export function SidebarNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <aside className="h-screen bg-primary-500 flex flex-col w-[280px] min-w-[280px]">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center">
            <span className="text-white text-xs font-bold">MIQ</span>
          </div>
          <span className="text-white text-sm font-medium">Model IQ</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-0.5 px-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isExpanded = item.active
          return (
            <div key={item.label}>
              <button
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-colors text-left ${
                  isExpanded ? 'bg-white/10 text-white' : ''
                }`}
                onClick={() => item.children ? undefined : undefined}
              >
                <Icon size={18} strokeWidth={1.5} />
                <span className="text-[15px]">{item.label}</span>
              </button>
              {isExpanded && item.children && (
                <div className="ml-8 mt-0.5">
                  {item.children.map(child => {
                    const isActive = location.pathname === child.path || location.pathname.startsWith(child.path + '/')
                    return (
                      <button
                        key={child.label}
                        onClick={() => navigate(child.path)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? 'text-white bg-white/15 font-medium'
                            : 'text-white/70 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        {child.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="px-2 pb-4 mt-auto">
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors text-left">
          <LogOut size={18} strokeWidth={1.5} />
          <span className="text-[15px]">Logout</span>
        </button>
      </div>
    </aside>
  )
}
