import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { Db, Collection, MongoClient, ObjectId, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

// Payment signature verification - no changes here
function verifySignature(orderId: string, paymentId: string, signature?: string): boolean {
  if (!signature) {
    console.log("No signature provided - marking for manual verification");
    return false;
  }
  
  const secret = process.env.RAZORPAY_KEY_SECRET ?? '6h9R2gOFyAFksAAmV0XClVNE';
  const body = orderId + '|' + paymentId;
  
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  const isValid = expectedSignature === signature;
  
  
  return isValid;
}

// Create a MongoDB client with improved configuration
function createMongoClient(): MongoClient {
  const options: MongoClientOptions = {
    connectTimeoutMS: 10000, // 10 seconds connection timeout
    socketTimeoutMS: 45000,  // 45 seconds socket timeout
    serverSelectionTimeoutMS: 10000, // 10 seconds server selection timeout
    maxPoolSize: 10, // Maintain up to 10 connections
    minPoolSize: 1,  // Keep at least one connection ready
    retryWrites: true,
    retryReads: true
  };
  
  return new MongoClient(uri, options);
}

// Fix 'any' type by creating interfaces for various data structures
interface PaymentUpdateResult {
  _id: ObjectId;
  status: string;
  paymentId: string;
  orderId: string;
  paymentVerified: boolean;
  paymentDate: Date;
  formType: string;
  [key: string]: unknown; // For other dynamic properties from safeDoc
}

interface FormData {
  _id?: string | ObjectId;
  serviceType?: string;
  companyName?: string;
  contactInfo?: string;
  email?: string;
  [key: string]: unknown; // Allow other properties
}

// Helper function to get appropriate collection based on form type
function getFormCollection(db: Db, formType?: string): Collection {
  if (formType === 'personalized_consultation') {
    return db.collection('user_personalized_styling_consultations');
  } else if (formType === 'photoshoot_styling') {
    return db.collection('user_photoshoot_styling_management_requests');
  } else if (formType === 'wedding_styling') {
    return db.collection('user_wedding_styling_consultations');
  } else if (formType === 'makeup_training') {
    return db.collection('user_makeup_styling_training_consultations');
  } else if (formType === 'soft_skills') {
    return db.collection('user_soft_skills_coaching_requests');
  } 
  
  // Default to corporate styling
  return db.collection('user_corporate_styling_requests');
}

interface PaymentRecordParams {
  orderId: string;
  paymentId: string;
  signature: string | undefined;
  isValid: boolean;
  formId: string | undefined;
  formType: string | undefined;
}

// Helper function to create payment record
async function storePaymentRecord(db: Db, params: PaymentRecordParams): Promise<void> {
  const { orderId, paymentId, signature, isValid, formId, formType } = params;
  const paymentsCollection = db.collection('payments');
  
  await paymentsCollection.insertOne({
    orderId,
    paymentId,
    signature: signature ?? 'missing',
    status: isValid ? 'verified' : 'requires_verification',
    verified: isValid,
    formId: formId ? new ObjectId(String(formId)) : null,
    formType: formType ?? 'corporate_styling',
    createdAt: new Date()
  });
}

// Helper function to update form record
async function updateFormRecord(
  collection: Collection, 
  formId: string, 
  paymentId: string, 
  orderId: string, 
  isValid: boolean
): Promise<Record<string, unknown> | null> {
  const currentDoc = await collection.findOne({ _id: new ObjectId(String(formId)) });
  if (!currentDoc) {
    return null;
  }
  
  const safeDoc = JSON.parse(JSON.stringify(currentDoc));
  
  await collection.updateOne(
    { _id: new ObjectId(String(formId)) },
    { 
      $set: { 
        status: isValid ? 'paid' : 'payment_pending_verification',
        paymentId,
        orderId,
        paymentVerified: isValid,
        paymentDate: new Date()
      } 
    }
  );
  
  return safeDoc;
}

interface FallbackParams {
  orderId: string;
  paymentId: string;
  signature?: string;
  formId?: string;
  formType?: string;
  isValid: boolean;
  error: Error | unknown;
}

// Helper function to save failed payment to fallback collection
async function saveToFallbackCollection(client: MongoClient | null, params: FallbackParams): Promise<void> {
  try {
    if (client) {
      const db = client.db(dbName);
      await db.collection('failed_payment_verifications').insertOne({
        ...params,
        error: String(params.error),
        createdAt: new Date()
      });
    }
  } catch (fallbackError) {
    console.error("Even fallback save failed:", fallbackError);
  }
}

// Database operations with retry logic
async function handleDatabaseOperations(
  orderId: string, 
  paymentId: string, 
  signature: string | undefined, 
  formId: string | undefined,
  formType: string | undefined,
  isValid: boolean,
  retryCount: number = 0
): Promise<PaymentUpdateResult | null> {
  const maxRetries = 3;
  let client: MongoClient | null = null;
  
  try {
    client = createMongoClient();
    await client.connect();
    
    const db = client.db(dbName);
    
    // Store payment record
    await storePaymentRecord(db, { orderId, paymentId, signature, isValid, formId, formType });
    
    if (!formId) return null;
    
    // Get appropriate collection
    const collection = getFormCollection(db, formType);
    
    // Update form record
    const safeDoc = await updateFormRecord(collection, formId, paymentId, orderId, isValid);
    if (!safeDoc) {
      console.error(`Could not find ${formType} request with ID:`, formId);
      return null;
    }
    
    return {
      ...safeDoc as Record<string, unknown>,
      status: isValid ? 'paid' : 'payment_pending_verification',
      paymentId,
      orderId,
      paymentVerified: isValid,
      paymentDate: new Date(),
      formType: formType ?? 'corporate_styling',
      _id: safeDoc._id as ObjectId
    } as PaymentUpdateResult;
  } catch (error) {
    console.error(`Database operation error (Attempt ${retryCount + 1}/${maxRetries}):`, error);
    
    // Retry logic
    if (retryCount < maxRetries) {
      console.log(`Retrying database operation (Attempt ${retryCount + 2}/${maxRetries + 1})...`);
      // Wait with exponential backoff (1s, 2s, 4s...)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      return handleDatabaseOperations(orderId, paymentId, signature, formId, formType, isValid, retryCount + 1);
    }
    
    // Save to a fallback collection if all retries failed
    await saveToFallbackCollection(client, {
      orderId, paymentId, signature, formId, formType, isValid, error
    });
    
    throw error;
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing MongoDB connection:", closeError);
      }
    }
  }
}

// No changes to determineFormType function
function determineFormType(formData: FormData): string {
  // Your existing implementation
  if (formData._id && String(formData._id).startsWith('corporate')) {
    return 'corporate_styling';
  } else if (formData.serviceType?.includes('Corporate')) {
    return 'corporate_styling';
  } else if (formData.companyName) {
    return 'corporate_styling';
  } else if (formData.serviceType?.includes('Personal')) {
    return 'personalized_consultation'; 
  } else if (formData._id && String(formData._id).startsWith('personal')) {
    return 'personalized_consultation'; 
  }
  
  return 'personalized_consultation';
}

interface EmailResult {
  success: boolean;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, formId, formType = 'corporate_styling' } = data;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ 
        status: 'failed',
        message: 'Missing required parameters' 
      }, { status: 400 });
    }

    const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
    let updatedRequest: PaymentUpdateResult | null = null;

    try {
      // Use the new approach where retry is built into the function
      updatedRequest = await handleDatabaseOperations(
        razorpay_order_id, 
        razorpay_payment_id, 
        razorpay_signature, 
        formId,
        formType, 
        isValid
      );

    } catch (dbError) {
      // We'll still return a 202 Accepted status if the payment is valid
      // even if database operations failed - we have the data in fallback collection
      console.error("Database operations failed, but continuing:", dbError);
      
      if (isValid) {
        // Even in failure case, return "success" to the client if signature is valid
        return NextResponse.json({ 
          status: 'success',
          verified: true,
          message: 'Payment signature verified successfully. Data will be processed shortly.' 
        }, { status: 202 });
      } else {
        return NextResponse.json({ 
          status: 'failed',
          verified: false,
          message: 'Payment verification failed and database operation failed' 
        }, { status: 500 });
      }
    }

    
    // If verification was successful and we have updated data, send emails
    if (isValid && updatedRequest) {
      let emailFormType = formType ?? determineFormType(updatedRequest);
      
      if (emailFormType === 'personalized_styling') {
        emailFormType = 'personalized_consultation';
      }
      
      // Send emails in the background without waiting
      try {
        

        // Using Promise.race with a timeout to ensure email sending doesn't block request
        const emailPromise = fetch(new URL('/api/send-emails', request.url).toString(), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            formType: emailFormType,
            purpose: 'payment',
            data: updatedRequest
          }),
        });
        
        // Set a 5-second timeout for email sending
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Email sending timeout')), 5000)
        );
        
        // Race the email sending against the timeout
        // Not awaiting this promise allows the function to continue
        Promise.race<Response | never>([emailPromise, timeoutPromise])
          .then((response: Response) => {
            return response.json();
          })
          .then((emailResult: EmailResult) => {
            console.log("Email service response:", emailResult);
            if (!emailResult.success) {
              console.error("Failed to send emails:", emailResult.message);
            }
          })
          .catch((emailError: Error) => {
            console.error("Error in background email sending:", emailError);
          });
      } catch (emailError) {
        console.error("Error preparing email request:", emailError);
        // Continue anyway - emails are not critical path
      }
    }

    return NextResponse.json({ 
      status: 'success',
      verified: isValid,
      message: isValid ? 'Payment verified successfully' : 'Payment recorded but requires verification' 
    }, { status: 200 });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json({ 
      status: 'error',
      message: 'Server error during payment verification' 
    }, { status: 500 });
  }
}