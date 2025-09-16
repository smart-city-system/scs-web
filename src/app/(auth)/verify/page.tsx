'use client'

import { userService } from '@/services/userService'
import { useMutation } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

function VerifyPage() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const verifyMutation = useMutation({
    mutationFn: () => userService.verifyEmail(token as string),
    onSuccess: () => {
      setVerified(true)
    },
    onError: (err: any) => {
      setError(err?.message || 'Verification failed. Please try again.')
    },
  })
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!token) {
      setError('No verification token found.')
      return
    }
    verifyMutation.mutate()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6 items-center">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">Verify Your Email</h1>
        {verifyMutation.isPending && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin w-8 h-8 text-blue-500" />
            <span className="text-gray-600">Verifying your email...</span>
          </div>
        )}
        {verified && !error && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-green-600 text-lg font-semibold">
              Email verified successfully!
            </span>
            <span className="text-gray-500 text-sm">You can now sign in to your account.</span>

            <Link href="/sign-in">
              <Button className="mt-2 w-full">Sign in</Button>
            </Link>
          </div>
        )}
        {error && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-red-600 text-lg font-semibold">{error}</span>
            <Button onClick={() => verifyMutation.mutate()} className="mt-2 w-full">
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyPage />
    </Suspense>
  )
}
