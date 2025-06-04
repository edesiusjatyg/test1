// "use client"

// import * as React from "react"
// import { useRouter } from "next/navigation"
// import { signIn } from "next-auth/react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import * as z from "zod"
// import { Shield, Loader2 } from "lucide-react"

// import { Button } from "@/components/ui/button"
// import { Input } from "@/components/ui/input"
// import { Label } from "@/components/ui/label"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

// const signInSchema = z.object({
//   email: z.string().email("Please enter a valid email address"),
//   password: z.string().min(1, "Password is required"),
// })

// type SignInFormData = z.infer<typeof signInSchema>

// export default function SignInPage() {
//   const router = useRouter()
//   const [isLoading, setIsLoading] = React.useState(false)
//   const [error, setError] = React.useState<string | null>(null)

//   const form = useForm<SignInFormData>({
//     resolver: zodResolver(signInSchema),
//     defaultValues: {
//       email: "",
//       password: "",
//     },
//   })

//   const onSubmit = async (data: SignInFormData) => {
//     try {
//       setIsLoading(true)
//       setError(null)

//       const result = await signIn("credentials", {
//         email: data.email,
//         password: data.password,
//         redirect: false,
//       })

//       if (result?.error) {
//         setError("Invalid email or password")
//       } else {
//         router.push("/dashboard")
//       }
//     } catch (error) {
//       setError("An error occurred. Please try again.")
//     } finally {
//       setIsLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-md w-full space-y-8">
//         <div className="text-center">
//           <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
//             <Shield className="h-8 w-8 text-primary-foreground" />
//           </div>
//           <h2 className="mt-6 text-3xl font-bold text-gray-900">
//             Welcome to GymDash
//           </h2>
//           <p className="mt-2 text-sm text-gray-600">
//             Sign in to manage your gym business
//           </p>
//         </div>

//         <Card>
//           <CardHeader>
//             <CardTitle>Sign in to your account</CardTitle>
//             <CardDescription>
//               Enter your email and password to access the dashboard
//             </CardDescription>
//           </CardHeader>
//           <CardContent>
//             <Form {...form}>
//               <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
//                 <FormField
//                   control={form.control}
//                   name="email"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Email</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="email"
//                           placeholder="Enter your email"
//                           autoComplete="email"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 <FormField
//                   control={form.control}
//                   name="password"
//                   render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Password</FormLabel>
//                       <FormControl>
//                         <Input
//                           type="password"
//                           placeholder="Enter your password"
//                           autoComplete="current-password"
//                           {...field}
//                         />
//                       </FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )}
//                 />

//                 {error && (
//                   <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
//                     {error}
//                   </div>
//                 )}

//                 <Button
//                   type="submit"
//                   className="w-full"
//                   disabled={isLoading}
//                 >
//                   {isLoading && (
//                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   )}
//                   Sign in
//                 </Button>
//               </form>
//             </Form>
//           </CardContent>
//           <CardFooter className="flex flex-col space-y-2 text-center text-sm text-gray-600">
//             <div>
//               Demo accounts available:
//             </div>
//             <div className="text-xs space-y-1">
//               <div>Owner: owner@gym.com / password123</div>
//               <div>Front Office: frontoffice@gym.com / password123</div>
//               <div>Accounting: accounting@gym.com / password123</div>
//               <div>Marketing: marketing@gym.com / password123</div>
//               <div>Supervisor: supervisor@gym.com / password123</div>
//             </div>
//           </CardFooter>
//         </Card>
//       </div>
//     </div>
//   )
// }

// src/app/auth/signin/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function SignInPage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard")
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div>Redirecting to dashboard...</div>
    </div>
  )
}