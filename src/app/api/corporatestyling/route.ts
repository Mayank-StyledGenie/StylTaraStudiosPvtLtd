import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

interface CorporateStyleRequest {
  companyName: string;
  contactPersonName: string;
  designation: string;
  contactInfo: string;
  numberOfParticipants: string;
  exactNumberOfParticipants?: string;
  serviceType: string;
  industryType: string;
  otherIndustryType?: string;
  companyLocation: string;
  preferredDates: string | Date;
  serviceMode: string;
  dressCodeGuidelines?: string;
  sessionObjectives: string;
  additionalNotes?: string;
  createdAt: Date;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const corporateData: CorporateStyleRequest = {
      companyName: formData.get('companyName') as string,
      contactPersonName: formData.get('contactPersonName') as string,
      designation: formData.get('designation') as string,
      contactInfo: formData.get('contactInfo') as string,
      numberOfParticipants: formData.get('numberOfParticipants') as string,
      serviceType: formData.get('serviceType') as string,
      industryType: formData.get('industryType') as string,
      companyLocation: formData.get('companyLocation') as string,
      preferredDates: formData.get('preferredDates') as string,
      serviceMode: formData.get('serviceMode') as string,
      sessionObjectives: formData.get('sessionObjectives') as string,
      createdAt: new Date(),
      status: 'payment_pending'
    };

    if (formData.get('exactNumberOfParticipants')) {
      corporateData.exactNumberOfParticipants = formData.get('exactNumberOfParticipants') as string;
    }
    
    if (formData.get('otherIndustryType')) {
      corporateData.otherIndustryType = formData.get('otherIndustryType') as string;
    }
    
    if (formData.get('dressCodeGuidelines')) {
      corporateData.dressCodeGuidelines = formData.get('dressCodeGuidelines') as string;
    }
    
    if (formData.get('additionalNotes')) {
      corporateData.additionalNotes = formData.get('additionalNotes') as string;
    }
    
    if (typeof corporateData.preferredDates === 'string') {
      corporateData.preferredDates = new Date(corporateData.preferredDates);
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('user_corporate_styling_requests');

    const result = await collection.insertOne(corporateData);
    await client.close();

    try {
      const emailResponse = await fetch(new URL('/api/send-emails', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'corporate_styling',
          purpose: 'submission',
          data: {
            ...corporateData,
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
      message: 'Corporate styling request submitted successfully',
      id: result.insertedId.toString() 
    }, { status: 201 });

  } catch (error) {
    console.error('Error in corporate styling request submission:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit corporate styling request',
    }, { status: 500 });
  }
}