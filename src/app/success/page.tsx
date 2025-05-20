"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { colors } from '@/styles/colors';

function deobfuscateData(data: string): string {
  const key = 'styltara_styledgenie'; 
  let result = '';
  
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  
  return result;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    const legacyPaymentId = searchParams.get('payment_id');
    
    if (legacyPaymentId) {
      const orderId = searchParams.get('order_id');
      const signature = searchParams.get('signature');
      const formId = searchParams.get('form_id');
      let formType = searchParams.get('form_type');
      
      if (formType === 'personalized_styling') {
        formType = 'personalized_consultation';
      }
      
      handlePaymentVerification({
        razorpay_payment_id: legacyPaymentId,
        razorpay_order_id: orderId ?? '',
        razorpay_signature: signature ?? '',
        formId: formId ?? '',
        formType: formType ?? 'corporate_styling'
      });
      
      return;
    }
    
    // Check for the new format with encoded reference
    const ref = searchParams.get('ref');
    
    if (ref) {
      try {
        // Decode the Base64 string
        const obfuscatedData = atob(ref);
        
        // Deobfuscate the data
        const jsonString = deobfuscateData(obfuscatedData);
        
        // Parse the JSON
        const paymentData = JSON.parse(jsonString);
        
        // Extract the values
        handlePaymentVerification({
          razorpay_payment_id: paymentData.pid,
          razorpay_order_id: paymentData.oid,
          razorpay_signature: paymentData.sig,
          formId: paymentData.fid,
          formType: paymentData.typ
        });
      } catch (error) {
        console.error('Failed to decode payment reference:', error);
        setVerificationStatus('failed');
      }
      return;
    }
    
    // If we don't have legacy params or new format, check for simple success flag
    const isSuccess = searchParams.get('success');
    if (isSuccess === 'true') {
      setVerificationStatus('success');
    } else {
      setVerificationStatus('failed');
    }
  }, [searchParams]);
  
  function handlePaymentVerification(verificationData: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    formId: string;
    formType: string;
  }) {
    console.log("Payment verification parameters:", verificationData);
    
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationData),
    })
    .then(response => response.json())
    .then(data => {
      if (data.status === 'success') {
        setVerificationStatus('success');
      } else {
        setVerificationStatus('failed');
      }
    })
    .catch(error => {
      console.error('Verification error:', error);
      setVerificationStatus('failed');
    });
  }

  const renderLoadingState = () => (
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto mb-4" 
          style={{ borderColor: colors.primary.darkpurple }}></div>
      <h2 className="text-xl font-semibold text-gray-800">Verifying your payment...</h2>
      <p className="mt-2 text-gray-500">Please wait a moment.</p>
    </div>
  );

  const renderSuccessState = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
        <svg className="h-10 w-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Thank You!</h1>
      <p className="my-4 text-gray-600">Your request has been successfully submitted and payment confirmed.</p>
      <p className="text-gray-600">Our team will get in touch with you shortly to discuss further details.</p>
      <div className="mt-8">
        <Link href="/" 
          className="inline-block px-6 py-3 text-white font-medium rounded-md"
          style={{ backgroundColor: colors.primary.darkpurple }}>
          Return to Homepage
        </Link>
      </div>
    </div>
  );

  const renderFailedState = () => (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <svg className="h-10 w-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-800">Payment Verification Failed</h1>
      <p className="my-4 text-gray-600">There was an issue verifying your payment. Your form has been submitted, but please contact us regarding the payment.</p>
      <div className="mt-8">
        <Link href="/" 
          className="inline-block px-6 py-3 text-white font-medium rounded-md"
          style={{ backgroundColor: colors.primary.darkpurple }}>
          Return to Homepage
        </Link>
      </div>
    </div>
  );

  const renderContent = () => {
    if (verificationStatus === 'loading') return renderLoadingState();
    if (verificationStatus === 'success') return renderSuccessState();
    return renderFailedState();
  };

  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      {renderContent()}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 mx-auto mb-4" 
            style={{ borderColor: '#401735' }}></div>
        <h2 className="text-xl font-semibold text-gray-800">Loading...</h2>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<LoadingFallback />}>
        <SuccessContent />
      </Suspense>
    </div>
  );
}