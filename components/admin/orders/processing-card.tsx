"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/lib/actions/order.actions";
import { Check, Package, Truck, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ProcessingCardProps {
  orderId: string;
  currentStatus: string;
}

const FLOW = [
  { status: "PAYMENT_PENDING", label: "Payment Pending", icon: Loader2 },
  { status: "CONFIRMED", label: "Confirmed", icon: Check },
  { status: "PROCESSING", label: "Processing", icon: Loader2 },
  { status: "PACKED", label: "Packed", icon: Package },
  { status: "SHIPPED", label: "Shipped", icon: Truck },
  { status: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: Check },
];

export function ProcessingCard({ orderId, currentStatus }: ProcessingCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const currentIndex = FLOW.findIndex(s => s.status === currentStatus);
  const nextStep = currentIndex >= 0 && currentIndex < FLOW.length - 1 ? FLOW[currentIndex + 1] : null;

  const handleAdvance = async () => {
    if (!nextStep) return;
    setIsUpdating(true);
    const res = await updateOrderStatus(orderId, { orderStatus: nextStep.status });
    if (res.success) {
      toast.success(`Order advanced to ${nextStep.label}`);
    } else {
      toast.error(res.error || "Failed to advance order status");
    }
    setIsUpdating(false);
  };

  if (currentStatus === "CANCELLED" || currentStatus === "RETURNED" || currentStatus === "PAYMENT_FAILED") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center justify-center text-center">
        <h3 className="font-semibold text-red-900 mb-2">Order Processing Halted</h3>
        <p className="text-sm text-red-700">This order is {currentStatus.toLowerCase()} and cannot be advanced further.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Pipeline</h3>
      
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-4">
        {FLOW.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = currentIndex >= idx;
          const isCurrent = currentIndex === idx;
          
          return (
            <div key={step.status} className="flex flex-col items-center relative z-10 flex-shrink-0 mx-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isCompleted ? 'bg-green-100 text-green-700 border-2 border-green-500' : 
                isCurrent ? 'bg-blue-100 text-blue-700 border-2 border-blue-500 shadow-[0_0_0_4px_rgba(59,130,246,0.1)]' : 
                'bg-gray-100 text-gray-400 border border-gray-300'
              }`}>
                <Icon size={18} className={isCurrent ? "animate-pulse" : ""} />
              </div>
              <span className={`text-xs mt-2 font-medium ${isCurrent ? 'text-blue-700' : isCompleted ? 'text-green-700' : 'text-gray-500'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {nextStep ? (
        <div className="flex flex-col items-center bg-blue-50 border border-blue-100 p-4 rounded-md">
          <p className="text-sm text-blue-800 mb-3 text-center">
            The next step in the pipeline is <strong>{nextStep.label}</strong>.
          </p>
          <button 
            onClick={handleAdvance}
            disabled={isUpdating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-md font-medium text-sm transition-colors"
          >
            {isUpdating ? <Loader2 className="animate-spin w-4 h-4" /> : "Advance Order Status"}
            {!isUpdating && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 p-4 rounded-md text-center">
          <p className="text-sm font-medium text-green-800">Order processing is complete!</p>
        </div>
      )}
    </div>
  );
}
