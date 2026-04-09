import Image from 'next/image'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="relative w-[100vmin] h-[100vmin]">
          <Image
            src="/icon.png"
            alt=""
            fill
            className="opacity-5 object-contain"
            priority
          />
        </div>
      </div>
      <div className="relative w-full max-w-md space-y-8">{children}</div>
    </div>
  )
}
