import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

interface ConsultationData {
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  consultationMode: string;
  trainingLocation?: string;
  areaOfInterest: string;
  hasBackground: string;
  backgroundDetails?: string;
  trainingReason?: string;
  preferredLanguage: string;
  preferredDateTime: string | Date;
  additionalQuestions?: string;
  createdAt: Date;
  status: string;
}

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const consultationData: ConsultationData = {
      fullName: formData.get('fullName') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactPhone: formData.get('contactPhone') as string,
      consultationMode: formData.get('consultationMode') as string,
      areaOfInterest: formData.get('areaOfInterest') as string,
      hasBackground: formData.get('hasBackground') as string,
      preferredLanguage: formData.get('preferredLanguage') as string,
      preferredDateTime: formData.get('preferredDateTime') as string,
      createdAt: new Date(),
      status: 'payment_pending'
    };
    
    if (formData.get('trainingLocation')) {
      consultationData.trainingLocation = formData.get('trainingLocation') as string;
    }
    
    if (formData.get('backgroundDetails')) {
      consultationData.backgroundDetails = formData.get('backgroundDetails') as string;
    }
    
    if (formData.get('trainingReason')) {
      consultationData.trainingReason = formData.get('trainingReason') as string;
    }
    
    if (formData.get('additionalQuestions')) {
      consultationData.additionalQuestions = formData.get('additionalQuestions') as string;
    }
    
    if (typeof consultationData.preferredDateTime === 'string') {
      consultationData.preferredDateTime = new Date(consultationData.preferredDateTime);
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const collection = db.collection('user_makeup_styling_training_consultations');
    
    const result = await collection.insertOne(consultationData);
    await client.close();
    
    try {
      const emailResponse = await fetch(new URL('/api/send-emails', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'makeup_training',
          purpose: 'submission',
          data: {
            ...consultationData,
            _id: result.insertedId
          }
        }),
      });
      
      const emailResult = await emailResponse.json();
      
      if (!emailResult.success) {
        console.error("Form submission emails failed:", emailResult.message);
      }
    } catch (emailError) {
      console.error("Failed to send form submission emails:", emailError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Makeup and styling training consultation request submitted successfully',
      id: result.insertedId.toString()
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error in makeup and styling training consultation submission:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to submit makeup and styling training consultation request', 
    }, { status: 500 });
  }
}