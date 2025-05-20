import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: NextRequest) {
  try {
    const { amount, currency, receipt, notes } = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID ?? 'rzp_test_WhaC8N83mqJULN',
      key_secret: process.env.RAZORPAY_KEY_SECRET ?? '6h9R2gOFyAFksAAmV0XClVNE',
    });

    const options = {
      amount: amount * 100, 
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order, { status: 200 });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json({ 
      error: 'Failed to create payment order' 
    }, { status: 500 });
  }
}