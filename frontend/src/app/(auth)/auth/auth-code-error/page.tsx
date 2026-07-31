import Link from 'next/link'

export default function AuthCodeErrorPage() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Reset link failed
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          The reset link is invalid or expired. Please request a new one.
        </p>
      </div>

      <div className="mt-8 space-y-4">
        <Link
          href="/forgot-password"
          className="flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Send a new reset link
        </Link>
        <p className="text-center text-sm text-gray-500">
          If you keep seeing this, open the link in Safari or Chrome instead of
          an in-app email browser.
        </p>
      </div>
    </div>
  )
}
