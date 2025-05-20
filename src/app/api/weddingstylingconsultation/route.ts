import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

interface InspirationImage {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: Buffer;
}

interface WeddingStylingRequest {
  fullName: string;
  contactEmail: string;
  contactPhone: string;
  weddingLocation: string;
  weddingDate: string;
  package: string;
  events: string[];
  hasVendors: string;
  consultationMode: string;
  budgetRange: string;
  additionalNotes?: string;
  inspirationImages?: InspirationImage[];
  createdAt: Date;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const weddingData: WeddingStylingRequest = {
      fullName: formData.get('fullName') as string,
      contactEmail: formData.get('contactEmail') as string,
      contactPhone: formData.get('contactPhone') as string,
      weddingLocation: formData.get('weddingLocation') as string,
      weddingDate: formData.get('weddingDate') as string,
      package: formData.get('package') as string,
      events: JSON.parse(formData.get('events') as string),
      hasVendors: formData.get('hasVendors') as string,
      consultationMode: formData.get('consultationMode') as string,
      budgetRange: formData.get('budgetRange') as string,
      createdAt: new Date(),
      status: 'payment_pending'
    };

    if (formData.get('additionalNotes')) {
      weddingData.additionalNotes = formData.get('additionalNotes') as string;
    }

    const inspirationImages: InspirationImage[] = [];
    for (let i = 1; i <= 5; i++) {
      const image = formData.get(`inspiration${i}`) as File | null;
      if (image) {
        const imageBuffer = await image.arrayBuffer();
        inspirationImages.push({
          name: image.name,
          type: image.type,
          size: image.size,
          lastModified: image.lastModified,
          data: Buffer.from(imageBuffer)
        });
      }
    }

    if (inspirationImages.length > 0) {
      weddingData.inspirationImages = inspirationImages;
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('user_wedding_styling_consultations');

    const result = await collection.insertOne(weddingData);
    await client.close();

    try {
      const emailData = {
        ...weddingData,
        _id: result.insertedId,
        inspirationImages: weddingData.inspirationImages ? weddingData.inspirationImages.map(img => ({
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
          formType: 'wedding_styling',
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
      message: 'Wedding styling consultation request submitted successfully',
      id: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error in wedding styling consultation submission:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit wedding styling consultation request',
    }, { status: 500 });
  }
}