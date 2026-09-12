import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mb-6 shadow-sm ring-1 ring-emerald-100">
        <CheckCircle2 className="w-12 h-12 text-emerald-500" />
      </div>
      <h1 className="text-3xl font-display font-bold text-plum-950 mb-4">
        Order Placed Successfully
      </h1>
      <p className="text-plum-600 max-w-md mx-auto mb-2">
        Thank you for your purchase! Your order has been placed and is currently being processed.
      </p>
      {searchParams.orderId && (
        <p className="text-plum-900 font-medium mb-8">
          Order Reference: #{searchParams.orderId.slice(-6).toUpperCase()}
        </p>
      )}
      
      <div className="flex gap-4">
        <Link 
          href="/account/dashboard"
          className="bg-gold-500 hover:bg-gold-600 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          View My Orders
        </Link>
        <Link 
          href="/collections"
          className="bg-white border border-plum-200 text-plum-900 hover:bg-plum-50 px-6 py-2.5 rounded-xl font-medium transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
