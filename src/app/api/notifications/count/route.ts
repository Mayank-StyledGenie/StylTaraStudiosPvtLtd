import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';

const uri = process.env.MONGODB_URI as string;
const dbName = process.env.MONGODB_DB as string;

export async function GET(): Promise<NextResponse> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({
      success: false,
      message: 'Authentication required',
      count: 0
    }, { status: 401 });
  }
  
  let client: MongoClient | null = null;
  
  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(dbName);
    
    const unreadCount = await db.collection('user_notifications').countDocuments({
      userEmail: session.user.email,
      read: false
    });
    
    return NextResponse.json({
      success: true,
      count: unreadCount
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch notification count',
      count: 0
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}