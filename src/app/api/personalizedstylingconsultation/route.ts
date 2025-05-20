import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

interface ConsultationImage {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  data: Buffer;
}

interface ConsultationData {
  fullName: string;
  email: string;
  phone: string;
  consultationMode: string;
  ageGroup: string;
  gender: string;
  occupation?: string;
  location: string;
  preferredDateTime: string | Date;
  stylingGoals: string[];
  bodyConcerns?: string;
  additionalNotes?: string;
  images?: ConsultationImage[];
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
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      consultationMode: formData.get('consultationMode') as string,
      ageGroup: formData.get('ageGroup') as string,
      gender: formData.get('gender') as string,
      location: formData.get('location') as string,
      preferredDateTime: formData.get('preferredDateTime') as string,
      stylingGoals: JSON.parse(formData.get('stylingGoals') as string),
      createdAt: new Date(),
      status: 'payment_pending'
    };

    if (formData.get('occupation')) {
      consultationData.occupation = formData.get('occupation') as string;
    }

    if (formData.get('bodyConcerns')) {
      consultationData.bodyConcerns = formData.get('bodyConcerns') as string;
    }

    if (formData.get('additionalNotes')) {
      consultationData.additionalNotes = formData.get('additionalNotes') as string;
    }

    if (typeof consultationData.preferredDateTime === 'string') {
      consultationData.preferredDateTime = new Date(consultationData.preferredDateTime);
    }

    const images: ConsultationImage[] = [];
    for (let i = 1; i <= 3; i++) {
      const image = formData.get(`image${i}`) as File | null;
      if (image) {
        const imageBuffer = await image.arrayBuffer();
        images.push({
          name: image.name,
          type: image.type,
          size: image.size,
          lastModified: image.lastModified,
          data: Buffer.from(imageBuffer)
        });
      }
    }

    if (images.length > 0) {
      consultationData.images = images;
    }

    const client = new MongoClient(uri);
    await client.connect();

    const db = client.db(dbName);
    const collection = db.collection('user_personalized_styling_consultations');

    const result = await collection.insertOne(consultationData);
    await client.close();

    try {
      const emailData = {
        ...consultationData,
        _id: result.insertedId,
        images: consultationData.images ? consultationData.images.map(img => ({
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
          formType: 'personalized_consultation',
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
      message: 'Styling consultation request submitted successfully',
      id: result.insertedId.toString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error in styling consultation submission:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to submit styling consultation request',
    }, { status: 500 });
  }
}