import { resetPassword } from './actions'
import Link from 'next/link'
import { SubmitButton } from '../login/submit-button'

export default async function ForgotPasswordPage(props: {
  searchParams: Promise<{ message: string; error: string }>
}) {
  const searchParams = await props.searchParams
  return (
    <>
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Reset your password
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
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
          <div className="rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                required
                className="relative block w-full rounded-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 px-3"
                placeholder="Email address"
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <SubmitButton
              formAction={resetPassword}
              className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              pendingText="Sending reset link..."
            >
              Send reset link
            </SubmitButton>
            
            <div className="text-center text-sm">
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                Back to sign in
              </Link>
            </div>
          </div>
        </form>
    </>
  )
}
