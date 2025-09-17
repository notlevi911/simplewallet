"use client"
import { Shield, Home, ArrowLeftRight, BarChart3, Plus, Minus, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAccount, useChainId, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { toast } from 'sonner'

export default function Navbar() {
  const router = useRouter()
  const { address } = useAccount()
  const chainId = useChainId()
  const { connect } = useConnect()
  const { disconnect } = useDisconnect()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto">
        <div
          className="backdrop-blur-3xl backdrop-saturate-200 border border-white/15 rounded-2xl px-6 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_56px_rgba(0,0,0,0.35)]"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <button onClick={() => router.push("/")} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center shadow-sm">
                <Shield className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-xl text-white tracking-wide">tZunami</span>
            </button>
            <div className="flex items-center gap-6">
              <button
                onClick={() => router.push("/")}
                className="flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-white hover:text-[#E8CFEA] hover:bg-white/10"
              >
                <Home className="w-4 h-4" />
                Home
              </button>
              <button
                onClick={() => router.push("/deposit")}
                className="flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-white hover:text-[#E8CFEA] hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
                Deposit
              </button>
              <button
                onClick={() => router.push("/withdraw")}
                className="flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-white hover:text-[#E8CFEA] hover:bg-white/10"
              >
                <Minus className="w-4 h-4" />
                Withdraw
              </button>
              <button
                onClick={() => router.push("/swap")}
                className="flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-white hover:text-[#E8CFEA] hover:bg-white/10"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Swap
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2 text-sm transition-colors px-3 py-2 rounded-lg text-white hover:text-[#E8CFEA] hover:bg-white/10"
              >
                <BarChart3 className="w-4 h-4" />
                Dashboard
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (address) {
                      await disconnect()
                      toast("Disconnected")
                    } else {
                      try {
                        await connect({ connector: injected() })
                        toast("Wallet connected")
                      } catch (e) {
                        toast.error("Failed to connect")
                      }
                    }
                  }}
                  className="flex items-center gap-2 text-sm transition-colors px-4 py-2 rounded-lg border border-white/20 bg-white/10 text-white hover:bg-white/15 font-medium"
                >
                  {address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'Connect'}
                </button>
                <span className="text-xs text-white/60">{chainId ? `Chain: ${chainId}` : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
