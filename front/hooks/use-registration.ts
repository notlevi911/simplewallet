'use client'

import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSignMessage, useChainId } from 'wagmi'
import { REGISTRAR_CONTRACT } from '../lib/contracts'
import { avalancheFuji } from 'wagmi/chains'
import { useState, useEffect } from 'react'
import { i0, formatPrivKeyForBabyJub, subOrder } from '../lib/crypto-utils'
import { Base8, mulPointEscalar } from "@zk-kit/baby-jubjub"
import { poseidon3 } from "poseidon-lite"
import * as snarkjs from 'snarkjs'

export function useRegistration() {
  const { writeContract, data: hash, isPending: isWritePending, error: writeError } = useWriteContract()
  const { address } = useAccount()
  const { signMessage, data: signature, isPending: isSigning, error: signError } = useSignMessage()
  const chainId = useChainId()
  const [isPreparingProof, setIsPreparingProof] = useState(false)
  const [proofError, setProofError] = useState<Error | null>(null)
  const [generatedProof, setGeneratedProof] = useState<any>(null)

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (signature && address) {
      const handleProofGeneration = async () => {
        try {
          const privateKey = i0(signature)
          const formattedPrivateKey = formatPrivKeyForBabyJub(privateKey) % subOrder
          const publicKey = mulPointEscalar(Base8, formattedPrivateKey).map((x) => BigInt(x)) as [bigint, bigint]
          const registrationHash = poseidon3([
            BigInt(chainId.toString()),
            formattedPrivateKey,
            BigInt(address),
          ])

          try {
            const inputs = {
              SenderPrivateKey: formattedPrivateKey,
              SenderPublicKey: publicKey,
              SenderAddress: BigInt(address),
              ChainID: BigInt(chainId),
              RegistrationHash: registrationHash,
            }
            const wasmPath = '/circuits/RegistrationCircuit.wasm'
            const zkeyPath = '/circuits/RegistrationCircuit.groth16.zkey'
            const { proof, publicSignals } = await snarkjs.groth16.fullProve(inputs, wasmPath, zkeyPath)
            const formattedProof = {
              proofPoints: {
                a: [BigInt(proof.pi_a[0]), BigInt(proof.pi_a[1])] as readonly [bigint, bigint],
                b: [
                  [BigInt(proof.pi_b[0][1]), BigInt(proof.pi_b[0][0])],
                  [BigInt(proof.pi_b[1][1]), BigInt(proof.pi_b[1][0])]
                ] as readonly [readonly [bigint, bigint], readonly [bigint, bigint]],
                c: [BigInt(proof.pi_c[0]), BigInt(proof.pi_c[1])] as readonly [bigint, bigint]
              },
              publicSignals: (() => {
                const signals = publicSignals.map((signal: string) => BigInt(signal))
                if (signals.length !== 5) throw new Error(`Expected 5 public signals, got ${signals.length}`)
                return [signals[0], signals[1], signals[2], signals[3], signals[4]] as const
              })()
            }
            setGeneratedProof(formattedProof)
          } catch (e) {
            setProofError(e as Error)
          }
        } catch (error) {
          setProofError(error as Error)
        }
      }
      handleProofGeneration()
    }
  }, [signature, address, chainId])

  const register = async () => {
    if (!address) return
    if (generatedProof) {
      if (chainId !== avalancheFuji.id) {
        setProofError(new Error('Please switch to Avalanche Fuji network'))
        return
      }
      try {
        await writeContract({
          address: REGISTRAR_CONTRACT.address,
          abi: REGISTRAR_CONTRACT.abi,
          functionName: 'register',
          args: [generatedProof],
          chainId: avalancheFuji.id,
        })
      } catch (err) {
        setProofError(err as Error)
      }
      return
    }

    try {
      setIsPreparingProof(true)
      setProofError(null)
      const message = `eERC\nRegistering user with\n Address:${address.toLowerCase()}`
      await signMessage({ message })
    } catch (err) {
      setProofError(err as Error)
    } finally {
      setIsPreparingProof(false)
    }
  }

  const isPending = isPreparingProof || isWritePending || isSigning
  const error = proofError || writeError || signError

  return {
    register,
    isPending,
    isPreparingProof: isSigning,
    isConfirming,
    isConfirmed,
    error,
    hash,
    signature,
    generatedProof,
    hasProofReady: !!generatedProof,
  }
}


