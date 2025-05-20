import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

interface ReferenceImage {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: Buffer;
}

interface PhotoshootConsultationData {
  fullName: string;
  email: string;
  phone: string;
  photoshootType: string;
  location: string;
  preferredDate: string | Date;
  hasPhotographer: string;
  stylingRequirements: string;
  needsHairMakeup: string;
  theme?: string;
  budgetRange: number;
  additionalNotes?: string;
  references?: ReferenceImage[];
  createdAt: Date;
  status: string;
  [key: string]: unknown;
}

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const consultationData: PhotoshootConsultationData = {
      fullName: formData.get('fullName') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      photoshootType: formData.get('photoshootType') as string,
      location: formData.get('location') as string,
      preferredDate: formData.get('preferredDate') as string,
      hasPhotographer: formData.get('hasPhotographer') as string,
      stylingRequirements: formData.get('stylingRequirements') as string,
      needsHairMakeup: formData.get('needsHairMakeup') as string,
      budgetRange: parseInt(formData.get('budgetRange') as string, 10),
      createdAt: new Date(),
      status: 'payment_pending'
    };

    if (formData.get('theme')) {
      consultationData.theme = formData.get('theme') as string;
    }

    if (formData.get('additionalNotes')) {
      consultationData.additionalNotes = formData.get('additionalNotes') as string;
    }

    if (typeof consultationData.preferredDate === 'string') {
      consultationData.preferredDate = new Date(consultationData.preferredDate);
    }

    const references: ReferenceImage[] = [];
    for (let i = 1; i <= 5; i++) {
      const reference = formData.get(`reference${i}`) as File | null;
      if (reference) {
        const refBuffer = await reference.arrayBuffer();
        references.push({
          name: reference.name,
          type: reference.type,
          size: reference.size,
          lastModified: reference.lastModified,
          data: Buffer.from(refBuffer)
        });
      }
    }

    if (references.length > 0) {
      consultationData.references = references;
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('user_photoshoot_styling_management_requests');

    const result = await collection.insertOne(consultationData);
    await client.close();

    try {
      const emailData = {
        ...consultationData,
        _id: result.insertedId,
        references: consultationData.references ? consultationData.references.map(img => ({
          ...img,
          data: img.data.toString('base64')
        })) : undefined
      };

      const emailResponse = await fetch(new URL('/api/send-emails', request.url).toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formType: 'photoshoot_styling',
          purpose: 'submission',
          data: emailData
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
      message: 'Photoshoot styling request submitted successfully',
      id: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error in Photoshoot styling request submission:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit photoshoot styling request',
    }, { status: 500 });
  }
}