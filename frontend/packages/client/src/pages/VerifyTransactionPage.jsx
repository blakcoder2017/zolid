import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button } from '@zolid/shared/components';
import apiClient from '@zolid/shared/utils/apiClient';
import logo from '../assets/logos/logo.png'; 

const VerifyTransactionPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('VERIFYING'); // 'VERIFYING', 'SUCCESS', 'FAILED'
  const [message, setMessage] = useState('Confirming your secure payment...');

  useEffect(() => {
    let isMounted = true;

    const verify = async () => {
      // 1. Extract reference from URL parameters
      // Paystack sends 'reference' or 'trxref' query params
      const reference = searchParams.get('reference') || searchParams.get('trxref');

      if (!reference) {
        if (isMounted) {
          setStatus('FAILED');
          setMessage('Invalid link. No transaction reference found.');
        }
        return;
      }

      try {
        // 2. Call Backend Verification Endpoint
        // Updated to match your financeRoutes: router.get('/payment/verify/:reference', ...)
        const response = await apiClient.get(`/finance/payment/verify/${reference}`);

        if (isMounted) {
          if (response.data.status === 'success') {
            setStatus('SUCCESS');
            setMessage('Payment confirmed! Your funds are securely held in Escrow.');
            
            // 3. Auto-redirect to the specific job page
            setTimeout(() => {
              if (response.data.data?.job_id) {
                navigate(`/jobs/${response.data.data.job_id}`);
              } else {
                navigate('/dashboard');
              }
            }, 2500);
          } else {
            setStatus('FAILED');
            setMessage(response.data.message || 'Payment verification failed.');
          }
        }
      } catch (error) {
        console.error('Verification Error:', error);
        if (isMounted) {
          setStatus('FAILED');
          // Extract specific error message from backend if available
          const errorMsg = error.response?.data?.message || 'Server error verifying payment.';
          setMessage(errorMsg);
        }
      }
    };

    verify();

    return () => { isMounted = false; };
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-grey-50 flex flex-col items-center justify-center p-6">
      <img src={logo} alt="ZOLID" className="h-10 w-auto mb-8" />
      
      <Card className="max-w-md w-full text-center py-12 px-6 shadow-lg border-0">
        
        {/* LOADING STATE */}
        {status === 'VERIFYING' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-14 w-14 border-t-4 border-b-4 border-indigo-600 mb-6"></div>
            <h2 className="font-condensed font-bold text-2xl text-navy-900 mb-2">Verifying Payment</h2>
            <p className="text-navy-600">Please wait while we secure your transaction...</p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="h-20 w-20 bg-mint-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">✅</span>
            </div>
            <h2 className="font-condensed font-bold text-2xl text-mint-700 mb-2">Payment Successful</h2>
            <p className="text-navy-600 mb-6">{message}</p>
            <p className="text-xs text-navy-400">Redirecting you to job details...</p>
          </div>
        )}

        {/* FAILED STATE */}
        {status === 'FAILED' && (
          <div className="flex flex-col items-center">
             <div className="h-20 w-20 bg-coral-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-4xl">❌</span>
            </div>
            <h2 className="font-condensed font-bold text-2xl text-coral-600 mb-2">Verification Failed</h2>
            <p className="text-navy-600 mb-8">{message}</p>
            <div className="space-y-3 w-full">
              <Button 
                variant="primary" 
                fullWidth
                onClick={() => window.location.reload()}
              >
                Try Again
              </Button>
              <Button 
                variant="secondary" 
                fullWidth
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </Button>
            </div>
          </div>
        )}

      </Card>
    </div>
  );
};

export default VerifyTransactionPage;