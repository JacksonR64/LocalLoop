import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-sm space-y-4 text-center">
        <h1 className="text-2xl font-bold">Authentication Error</h1>
        <p className="text-muted-foreground">
          Sorry, we couldn't sign you in. This could be due to:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• The authorization code was invalid or expired</li>
          <li>• There was a network issue during sign-in</li>
          <li>• The OAuth flow was interrupted</li>
        </ul>
        <div className="pt-4">
          <Link
            href="/auth/login"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Try Again
          </Link>
        </div>
      </div>
    </div>
  )
}