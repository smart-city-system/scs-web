// app/signup/page.tsx
'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useMutation } from '@/hooks/use-async'
import { HttpError } from '@/lib/http'
import { authService } from '@/services/authService'
import { zodResolver } from '@hookform/resolvers/zod'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().nonempty(),
  password: z.string().nonempty(),
})
type FormData = z.infer<typeof loginSchema>
function SignInPage() {
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin/dashboard'
  const {
    control,
    formState: { errors },
    handleSubmit,
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(loginSchema),
  })
  const [error, setError] = useState<string | null>(null)
  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data)
  }
  const loginMutation = useMutation(
    (data) => {
      return authService.login(
        data.email.trim(),
        data.password,
        process.env.NEXT_PUBLIC_USER_ENDPOINT || '',
      )
    },
    {
      onSuccess: async (data) => {
        await authService.auth(data.token)
        localStorage.setItem('sessionToken', data.token)
        setError(null)
        window.location.href = redirect
      },
      onError: (error) => {
        if (error instanceof HttpError) {
          if (error.status === 401) {
            setError('Invalid email or password')
            return
          }
        } else {
          setError('An error occurred. Please try again.')
        }
      },
    },
  )

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <Card className="w-full max-w-sm shadow-lg rounded-2xl">
        <CardHeader>
          <CardTitle className="text-center text-xl font-semibold">Login</CardTitle>
        </CardHeader>
        <div className="h-[10px]">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        </div>
        <CardContent className="space-y-1">
          {/* OAuth buttons */}
          {/* <div className="flex gap-2">
            <Button variant="outline" className="w-1/2">
              <Github className="mr-2 h-4 w-4" />
              GitHub
            </Button>
            <Button variant="outline" className="w-1/2">
              <Chrome className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
            <Separator className="flex-1" />
          </div> */}

          {/* Email + Password form */}

          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <Input {...field} error={errors.password?.message} placeholder="Email" />
                )}
              />
            </div>

            <div className="space-y-1">
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <Input
                    {...field}
                    error={errors.password?.message}
                    placeholder="Password"
                    type="password"
                  />
                )}
              />
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* Your component that uses useSearchParams */}
      <SignInPage />
    </Suspense>
  )
}
