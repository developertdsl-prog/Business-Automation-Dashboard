"use client"

import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import Link from "next/link"
import { Mail, Lock } from "lucide-react"

const schema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type FormData = z.infer<typeof schema>

export default function SignIn() {
  const router = useRouter()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    })

    if (result?.error) {
      alert("Invalid email or password")
      return
    }

    router.push("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="text-3xl font-bold">Sign in</h2>
          <p className="text-muted-foreground">
            Welcome back to your automation dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 pl-2 border-b border-border">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <input
                {...register("email")}
                type="email"
                placeholder="Email"
                className="flex-1 bg-transparent outline-none"
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="flex items-center gap-2 pl-2 border-b border-border">
              <Lock className="w-5 h-5 text-muted-foreground" />
              <input
                {...register("password")}
                type="password"
                placeholder="Password"
                className="flex-1 bg-transparent outline-none"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            Sign in
          </button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/auth/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
