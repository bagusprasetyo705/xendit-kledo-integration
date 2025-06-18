'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error) => {
    switch (error) {
      case 'Configuration':
        return 'There is a configuration error. Please check your environment variables.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token is invalid or has expired.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from the OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create an account in the OAuth provider.';
      case 'EmailCreateAccount':
        return 'Could not create an account with the provided email.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'The account is not linked. Please sign in with your original account.';
      case 'EmailSignin':
        return 'Sending the email with the verification token failed.';
      case 'CredentialsSignin':
        return 'The authorization credentials are not valid.';
      case 'no_code':
        return 'No authorization code received from Kledo.';
      case 'callback_error':
        return 'Error occurred during the OAuth callback process.';
      default:
        return 'An unknown error occurred during authentication.';
    }
  };

  return (
    <div className="text-center">
      <div className="text-red-500 text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Authentication Error</h1>
      <p className="text-gray-600 mb-6">
        {getErrorMessage(error)}
      </p>
      <div className="space-y-3">
        <Link 
          href="/"
          className="block w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Back to Dashboard
        </Link>
        <p className="text-sm text-gray-500">
          If the problem persists, please check your Kledo OAuth configuration.
        </p>
      </div>
    </div>
  );
}

export default function AuthError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <Suspense fallback={
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Loading...</h1>
          </div>
        }>
          <ErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
