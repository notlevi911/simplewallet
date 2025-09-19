// SPDX-License-Identifier: MIT
'use client';

import React, { useState, useCallback } from 'react';
import { useSelfKYC } from '@/lib/sdk';
import { CheckCircle, AlertCircle, Loader2, Shield, User, Globe, FileText, KeyRound, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast, removeToast } from '@/components/simple-toast';

interface KYCStepProps {
  onKYCComplete?: (kycData: any) => void;
  onKYCError?: (error: string) => void;
  onSkip?: () => void;
  className?: string;
}

export function KYCStep({ 
  onKYCComplete, 
  onKYCError, 
  onSkip,
  className = '' 
}: KYCStepProps) {
  const { 
    isVerified, 
    kycData, 
    isLoading, 
    error, 
    config, 
    verifyKYC, 
    clearError 
  } = useSelfKYC();
  
  const [proof, setProof] = useState<any>(null);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);
  const [showKYCForm, setShowKYCForm] = useState(false);

  const handleVerification = useCallback(async () => {
    if (!proof) {
      showToast('error', 'No proof provided');
      onKYCError?.('No proof provided');
      return;
    }

    try {
      const loadingId = showToast('loading', 'Verifying KYC...');
      
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Dismiss the loading toast
      removeToast(loadingId);
      
      // Simulate successful verification
      const mockResult = {
        success: true,
        kycData: {
          isVerified: true,
          nationality: proof.nationality,
          documentType: proof.documentType,
          isOfacClear: !proof.isOfacMatch,
          verificationCount: 1,
          timestamp: Date.now()
        }
      };
      
      showToast('success', '🎉 KYC Verification Successful!', 'Your identity has been verified and you can now access institutional features.');
      onKYCComplete?.(mockResult.kycData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      showToast('error', 'KYC Verification Error', errorMessage);
      onKYCError?.(errorMessage);
    }
  }, [proof, onKYCComplete, onKYCError]);

  const generateMockProof = useCallback(async () => {
    setIsGeneratingProof(true);
    const loadingId = showToast('loading', 'Generating Self.xyz proof...');
    
    // Simulate proof generation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Dismiss the loading toast
    removeToast(loadingId);
    
    const mockProof = {
      nullifier: '0x' + Math.random().toString(16).substr(2, 64),
      userIdentifier: '0x' + Math.random().toString(16).substr(2, 64),
      nationality: 'US',
      documentType: 1, // E-Passport
      ageAtLeast: 25,
      isOfacMatch: false,
      attestationId: '0x' + Math.random().toString(16).substr(2, 64),
      proof: '0x' + Math.random().toString(16).substr(2, 128),
      timestamp: Date.now()
    };
    
    setProof(mockProof);
    setIsGeneratingProof(false);
    showToast('success', '✅ Proof Generated Successfully!', 'Your Self.xyz proof is ready for verification.');
  }, []);

  const handleClearError = useCallback(() => {
    clearError();
  }, [clearError]);

  if (isVerified && kycData) {
    return (
      <div className={`backdrop-blur-3xl backdrop-saturate-200 border border-green-500/40 rounded-2xl px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_56px_rgba(0,0,0,0.35)] ${className}`} style={{ background: "rgba(34, 197, 94, 0.06)" }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-green-400">KYC Verified</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Globe className="w-4 h-4 text-white/60" />
            <span>Nationality: {kycData.nationality}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <FileText className="w-4 h-4 text-white/60" />
            <span>Document: {kycData.documentType === 1 ? 'E-Passport' : 'EU ID Card'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Shield className="w-4 h-4 text-white/60" />
            <span>OFAC Clear: {kycData.isOfacClear ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/80">
            <User className="w-4 h-4 text-white/60" />
            <span>Verifications: {kycData.verificationCount}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`backdrop-blur-3xl backdrop-saturate-200 border border-white/15 rounded-2xl px-6 py-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_16px_56px_rgba(0,0,0,0.35)] ${className}`} style={{ background: "rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-xl font-bold text-white">KYC Verification Required</h2>
      </div>

      <div className="mb-6">
        <p className="text-sm text-white/70 mb-4">
          Institutional mode requires KYC verification to ensure compliance with regulatory requirements.
        </p>
      </div>

      {config && (
        <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-sm font-semibold text-white/60 mb-3">Requirements:</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-white/50">
            <div>• Minimum age: {config.minimumAge}</div>
            <div>• OFAC check: {config.requireOfacCheck ? 'Required' : 'Not required'}</div>
            <div>• Document types: {config.allowedDocumentTypes.map(t => t === 1 ? 'E-Passport' : 'EU ID Card').join(', ')}</div>
            {config.excludedCountries.length > 0 && (
              <div>• Excluded countries: {config.excludedCountries.join(', ')}</div>
            )}
          </div>
        </div>
      )}

      {!showKYCForm ? (
        <div className="space-y-3">
          <Button
            onClick={() => {
              setShowKYCForm(true);
              showToast('info', '🔐 KYC Verification Started', 'Please generate your Self.xyz proof to continue.');
            }}
            className="w-full rounded-full bg-white/10 border border-white/15 text-white hover:bg-white/15 px-5 py-3 font-medium"
          >
            Start KYC Verification
          </Button>
          {onSkip && (
            <Button
              onClick={() => {
                showToast('warning', '⚠️ KYC Skipped', 'You can complete KYC verification later in settings.');
                onSkip();
              }}
              variant="outline"
              className="w-full rounded-full border-white/15 text-white/70 hover:bg-white/10 px-5 py-3 bg-transparent"
            >
              Skip for Now
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {!proof ? (
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-white" />
              </div>
              <p className="text-sm text-white/60 mb-6">
                Generate a Self.xyz proof to verify your identity
              </p>
              <Button
                onClick={generateMockProof}
                disabled={isGeneratingProof}
                className="w-full rounded-full bg-blue-600 hover:bg-blue-700 px-5 py-3 font-medium"
              >
                {isGeneratingProof ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Generating Proof...
                  </>
                ) : (
                  'Generate Self.xyz Proof'
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h4 className="text-sm font-semibold text-white mb-3">Proof Generated:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Nationality:</span>
                    <span className="text-white font-medium">{proof.nationality}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Document Type:</span>
                    <span className="text-white font-medium">{proof.documentType === 1 ? 'E-Passport' : 'EU ID Card'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Age:</span>
                    <span className="text-white font-medium">{proof.ageAtLeast}+</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">OFAC Clear:</span>
                    <span className="text-white font-medium">{proof.isOfacMatch ? 'No' : 'Yes'}</span>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Button
                  onClick={handleVerification}
                  disabled={isLoading}
                  className="w-full rounded-full bg-green-600 hover:bg-green-700 px-5 py-3 font-medium"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify KYC'
                  )}
                </Button>
                
                <Button
                  onClick={() => setProof(null)}
                  variant="outline"
                  className="w-full rounded-full border-white/15 text-white/70 hover:bg-white/10 px-5 py-3 bg-transparent"
                >
                  Regenerate Proof
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 text-red-300 rounded-xl border border-red-500/20">
          <AlertCircle className="w-4 h-4" />
          <span className="flex-1">{error}</span>
          <button onClick={handleClearError} className="text-red-300 hover:text-red-100">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
