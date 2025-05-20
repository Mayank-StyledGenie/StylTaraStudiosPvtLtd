import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

interface CoachingData {
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  occupation: string;
  coachingPurpose: string;
  coachingMode: string;
  preferredDateTime: string | Date;
  hasPreviousCoaching: string;
  preferredLanguage: string;
  additionalExpectations?: string;
  createdAt: Date;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const coachingData: CoachingData = {
      fullName: formData.get('fullName') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactPhone: formData.get('contactPhone') as string,
      occupation: formData.get('occupation') as string,
      coachingPurpose: formData.get('coachingPurpose') as string,
      coachingMode: formData.get('coachingMode') as string,
      preferredDateTime: formData.get('preferredDateTime') as string,
      hasPreviousCoaching: formData.get('hasPreviousCoaching') as string,
      preferredLanguage: formData.get('preferredLanguage') as string,
      createdAt: new Date(),
      status: 'payment_pending'
    };

    if (formData.get('additionalExpectations')) {
      coachingData.additionalExpectations = formData.get('additionalExpectations') as string;
    }
    
    if (typeof coachingData.preferredDateTime === 'string') {
      coachingData.preferredDateTime = new Date(coachingData.preferredDateTime);
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('user_soft_skills_coaching_requests');

    const result = await collection.insertOne(coachingData);
    await client.close();

    try {
      const emailResponse = await fetch(new URL('/api/send-emails', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'soft_skills',
          purpose: 'submission',
          data: {
            ...coachingData,
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
      message: 'Soft Skills and Etiquette Coaching request submitted successfully',
      id: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error in soft skills coaching submission:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit soft skills coaching request',
    }, { status: 500 });
  }
}