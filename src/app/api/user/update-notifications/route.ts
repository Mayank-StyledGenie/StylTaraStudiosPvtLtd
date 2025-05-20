import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { connectToDatabase } from '@/lib/mongodb';
import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import { MongoClient } from 'mongodb';

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const email = session.user.email;
    const { db } = await connectToDatabase();
    
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const userId = user._id;
    
    await db.collection('accounts').deleteMany({ userId });
    
    await db.collection('sessions').deleteMany({ 
      $or: [
        { userId: userId.toString() },
        { "session.user.email": email }
      ]
    });
    
    if (await db.listCollections({ name: 'user_notifications' }).hasNext()) {
      await db.collection('user_notifications').deleteMany({ userEmail: email });
    }
    
    try {
      const uri = process.env.MONGODB_URI as string;
      const client = new MongoClient(uri);
      await client.connect();
      
      const testDb = client.db("test");
      
      const testUser = await testDb.collection('users').findOne({ email });
      
      if (testUser) {
        console.log(`Found user in test database with ID: ${testUser._id}`);
        
        const accountsDeleted = await testDb.collection('accounts').deleteMany({
          userId: testUser._id
        });
        
        console.log(`Deleted ${accountsDeleted.deletedCount} accounts from test database`);
        
        const sessionsDeleted = await testDb.collection('sessions').deleteMany({ 
          $or: [
            { "session.user.email": email },
            { userId: testUser._id.toString() }
          ]
        });
        
        console.log(`Deleted ${sessionsDeleted.deletedCount} sessions from test database`);
        
        const testUserDeleted = await testDb.collection('users').deleteOne({ _id: testUser._id });
        console.log(`Deleted user from test.users: ${testUserDeleted.deletedCount === 1}`);
      } else {
        console.log(`User not found in test database with email: ${email}`);
      }
      
      await client.close();
    } catch (testDbError) {
      console.error('Error cleaning up test database:', testDbError);
    }
    
    const userResult = await db.collection('users').deleteOne({ _id: userId });
    
    if (userResult.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Account has been permanently deleted from all databases'
    });
  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An error occurred while deleting the account'
      },
      { status: 500 }
    );
  }
}