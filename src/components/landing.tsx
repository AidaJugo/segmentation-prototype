import { useNavigate } from 'react-router-dom'
import { GitBranch } from 'lucide-react'

const cards = [
  {
    path: '/prototype',
    title: 'User Testing Prototype',
    description: 'Explore the segmentation experience. Select dimensions, define buckets for ranges, and build segment rules with conditions and exceptions.',
    icon: GitBranch,
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    iconColor: 'text-blue-500',
  },
]

export function Landing() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 flex items-center justify-center bg-surface-50 p-8">
      <div className="max-w-3xl w-full">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-surface-800 mb-2">
            Loan Segmentation
          </h2>
          <p className="text-surface-500">
            Prototype for defining loan portfolio segments using dimension-based rules.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {cards.map(card => {
            const Icon = card.icon
            return (
              <button
                key={card.path}
                onClick={() => navigate(card.path)}
                className={`flex items-start gap-4 p-5 rounded-lg border text-left transition-all hover:shadow-md ${card.color}`}
              >
                <div className={`mt-0.5 ${card.iconColor}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{card.title}</h3>
                  <p className="text-sm opacity-80">{card.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
