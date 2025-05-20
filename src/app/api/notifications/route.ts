import { NextRequest, NextResponse } from 'next/server';
import { Db, MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'submission' | 'payment' | 'update';
  formType: string;
  formId: string;
  details?: Record<string, unknown>;
}

interface CollectionConfig {
  name: string;
  field: string;
  type: string;
  label: string;
}

async function processCollection(db: Db, collection: CollectionConfig, userEmail: string): Promise<NotificationItem[]> {
  const notifications: NotificationItem[] = [];
    
  const query = {
    $or: [
      { [collection.field]: userEmail },
      { email: userEmail },
      { contactEmail: userEmail },
      { contactInfo: { $regex: userEmail, $options: 'i' } }
    ]
  };
  
  try {
    const forms = await db.collection(collection.name).find(query).sort({ createdAt: -1 }).toArray();    

    forms.forEach((form: Record<string, unknown>) => {
      
      notifications.push({
        id: `${collection.type}_submission_${form._id}`,
        title: `${collection.label} Request Submitted`,
        message: `Your ${collection.label} request has been successfully submitted.`,
        date: form.createdAt ? new Date(form.createdAt as string | Date).toISOString() : new Date().toISOString(),
        read: false,
        type: 'submission',
        formType: collection.type,
        formId: (form._id as { toString(): string }).toString(),
        details: {
          status: form.status,
          submissionDate: form.createdAt
        }
      });
      
      if (form.status === 'paid' || form.paymentVerified) {
        notifications.push({
          id: `${collection.type}_payment_${form._id}`,
          title: `Payment Confirmed for ${collection.label}`,
          message: `Your payment for ${collection.label} has been successfully processed.`,
          date: form.paymentDate ? new Date(form.paymentDate as string | Date).toISOString() : new Date().toISOString(),
          read: false,
          type: 'payment',
          formType: collection.type,
          formId: (form._id as { toString(): string }).toString(),
          details: {
            paymentId: form.paymentId,
            paymentDate: form.paymentDate,
            orderId: form.orderId
          }
        });
      }
    });
  } catch (error) {
    console.error(`Error processing collection ${collection.name}:`, error);
  }
  
  return notifications;
}

async function updateNotificationStatus(db: Db, notifications: NotificationItem[], userEmail: string): Promise<void> {
  const notificationCollection = db.collection('user_notifications');
  
  for (const notification of notifications) {
    const existingNotification = await notificationCollection.findOne({ 
      notificationId: notification.id,
      userEmail: userEmail
    });
    
    if (existingNotification) {
      notification.read = existingNotification.read ?? false;
    } else {
      await notificationCollection.insertOne({
        notificationId: notification.id,
        userEmail: userEmail,
        read: false,
        createdAt: new Date(),
        details: notification
      });
    }
  }
}

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({
      success: false,
      message: 'Authentication required',
    }, { status: 401 });
  }
  
  const userEmail = session.user.email;
  
  let client: MongoClient | null = null;
  
  try {
    client = new MongoClient(uri, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
    });
    
    await client.connect();
    
    const db = client.db(dbName);
    let notifications: NotificationItem[] = [];
    
    const collections: CollectionConfig[] = [
      { name: 'user_corporate_styling_requests', field: 'contactInfo', type: 'corporate_styling', label: 'Corporate Styling' },
      { name: 'user_personalized_styling_consultations', field: 'contactEmail', type: 'personalized_consultation', label: 'Personalized Styling' },
      { name: 'user_photoshoot_styling_management_requests', field: 'email', type: 'photoshoot_styling', label: 'Photoshoot Styling' },
      { name: 'user_wedding_styling_consultations', field: 'contactEmail', type: 'wedding_styling', label: 'Wedding Styling' },
      { name: 'user_makeup_styling_training_consultations', field: 'contactEmail', type: 'makeup_training', label: 'Makeup Training' },
      { name: 'user_soft_skills_coaching_requests', field: 'contactEmail', type: 'soft_skills', label: 'Soft Skills Coaching' }
    ];
    
    for (const collection of collections) {
      const collectionNotifications = await processCollection(db, collection, userEmail);
      notifications = [...notifications, ...collectionNotifications];
    }
    
    if (notifications.length > 0) {
      await updateNotificationStatus(db, notifications, userEmail);
    }
    
    notifications.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
    return NextResponse.json({
      success: true,
      notifications
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({
      success: false,
      message: 'Authentication required',
    }, { status: 401 });
  }
  
  try {
    const { notificationId } = await request.json();
    
    if (!notificationId) {
      return NextResponse.json({
        success: false,
        message: 'Notification ID is required',
      }, { status: 400 });
    }
    
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    await db.collection('user_notifications').updateOne(
      { 
        notificationId: notificationId,
        userEmail: session.user.email
      },
      { 
        $set: { 
          read: true,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    await client.close();
    
    return NextResponse.json({
      success: true,
      message: 'Notification marked as read'
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update notification',
    }, { status: 500 });
  }
}