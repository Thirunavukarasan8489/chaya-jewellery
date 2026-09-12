import React, { useState } from 'react';

export function CheckoutStepper() {
  const [step, setStep] = useState(1);
  const [purchaseType, setPurchaseType] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-sm">
      {/* Stepper Header */}
      <div className="flex items-center justify-between mb-8 border-b border-plum-200 pb-4">
        <h2 className="text-xl font-bold text-plum-900">Checkout</h2>
        <div className="text-sm text-plum-600 font-medium">Step {step} of 4</div>
      </div>

      {/* Step 1: Customer Info & Purchase Type */}
      {step === 1 && (
        <div className="space-y-6 animate-rise">
          <h3 className="text-lg font-semibold text-plum-900">1. Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" placeholder="Full Name" className="border border-plum-200 rounded-md p-3" />
            <input type="tel" placeholder="Phone Number" className="border border-plum-200 rounded-md p-3" />
            <input type="email" placeholder="Email (Optional)" className="border border-plum-200 rounded-md p-3 col-span-2" />
          </div>

          <h3 className="text-lg font-semibold text-plum-900 mt-8">Purchase Type</h3>
          <div className="flex space-x-4">
            <button 
              className={`flex-1 p-4 border rounded-lg text-center font-medium ${purchaseType === 'PERSONAL' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-plum-200 text-plum-600'}`}
              onClick={() => setPurchaseType('PERSONAL')}
            >
              Personal Purchase
            </button>
            <button 
              className={`flex-1 p-4 border rounded-lg text-center font-medium ${purchaseType === 'BUSINESS' ? 'border-gold-500 bg-gold-50 text-gold-900' : 'border-plum-200 text-plum-600'}`}
              onClick={() => setPurchaseType('BUSINESS')}
            >
              Business Purchase
            </button>
          </div>

          <button onClick={() => setStep(2)} className="w-full mt-6 bg-gold-500 hover:bg-gold-600 text-plum-950 font-bold py-3 rounded-md transition-colors">
            Continue to Address
          </button>
        </div>
      )}

      {/* Step 2: Address (Simplified) */}
      {step === 2 && (
        <div className="space-y-6 animate-rise">
          <h3 className="text-lg font-semibold text-plum-900">2. Shipping Address</h3>
          {/* Address form fields would go here */}
          <div className="h-32 bg-plum-50 rounded-md border border-plum-200 flex items-center justify-center text-plum-400">
            Address Form Placeholder
          </div>
          <div className="flex space-x-4">
            <button onClick={() => setStep(1)} className="flex-1 py-3 border border-plum-300 text-plum-700 font-bold rounded-md">Back</button>
            <button onClick={() => setStep(3)} className="flex-1 py-3 bg-gold-500 hover:bg-gold-600 text-plum-950 font-bold rounded-md">Continue</button>
          </div>
        </div>
      )}

      {/* Step 3: Summary & Step 4: Payment would follow similar patterns... */}
      {step > 2 && (
        <div className="space-y-6 animate-rise">
           <h3 className="text-lg font-semibold text-plum-900">Review & Payment</h3>
           <div className="h-32 bg-plum-50 rounded-md border border-plum-200 flex items-center justify-center text-plum-400">
            Payment Methods Placeholder
          </div>
          <div className="flex space-x-4">
            <button onClick={() => setStep(step - 1)} className="flex-1 py-3 border border-plum-300 text-plum-700 font-bold rounded-md">Back</button>
            <button className="flex-1 py-3 bg-gold-500 hover:bg-gold-600 text-plum-950 font-bold rounded-md">Complete Order</button>
          </div>
        </div>
      )}
    </div>
  );
}
