import { login } from './actions'
import Link from 'next/link'
import { SubmitButton } from './submit-button'

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <>
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          {searchParams?.message && (
            <p className="mt-2 text-center text-sm text-green-600 font-medium bg-green-50 p-3 rounded-md border border-green-200">
              {searchParams.message}
            </p>
          )}
          {searchParams?.error && (
            <p className="mt-2 text-center text-sm text-red-600 font-medium bg-red-50 p-3 rounded-md border border-red-200">
              {searchParams.error}
            </p>
          )}
        </div>
        <form className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-end mb-4">
            <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
              Forgot password?
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            <SubmitButton
              formAction={login}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              pendingText="Signing In..."
            >
              Sign in
            </SubmitButton>
            
            <div className="text-center text-sm">
              <span className="text-gray-500">Don&apos;t have an account? </span>
              <Link href="/signup" className="font-semibold text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </div>
          </div>
        </form>
    </>
  )
}

