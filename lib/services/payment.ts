import { Order } from '../models/order';

/**
 * Generic Payment Service mapping to future Gateway integrations
 */
export class PaymentService {
  /**
   * Initializes a payment intent with the gateway.
   * To be implemented once a provider (e.g. Razorpay, Stripe) is chosen.
   */
  static async initializePayment(orderId: string, amount: number, currency: string = 'INR') {
    // 1. Fetch Order
    const order = await Order.findById(orderId);
    if (!order) throw new Error('Order not found');

    if (order.paymentStatus !== 'PENDING') {
      throw new Error(`Order payment status is ${order.paymentStatus}. Cannot initialize.`);
    }

    // 2. Mock Gateway Response
    // TODO: Replace with actual Gateway API call (e.g., razorpay.orders.create)
    return {
      gatewayOrderId: `mock_gw_${Date.now()}`,
      amount,
      currency,
      status: 'created'
    };
  }

  /**
   * Verifies the webhook signature and extracts the Order ID and status.
   * This ensures the payload actually came from the Payment Gateway.
   */
  static verifyWebhookSignature(_payload: unknown, _signature: string, _secret: string): boolean {
    // TODO: Implement crypto.createHmac verification based on Gateway docs
    // Mocking true for development
    return true; 
  }
}
