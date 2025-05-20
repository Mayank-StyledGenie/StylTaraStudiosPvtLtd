"use client";
import Container from '@/components/ui/Container';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import {FaCheckCircle, FaRupeeSign, FaInfoCircle } from 'react-icons/fa';

interface Notification {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: 'submission' | 'payment' | 'update';
  formType: string;
  formId: string;
  details?: {
    paymentId?: string;
    orderId?: string;
    paymentDate?: string;
    status?: string;
    submissionDate?: string;
    [key: string]: unknown;
  };
}

export default function UserNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?callbackUrl=/notifications');
      return;
    }
    
    if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/notifications', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API error:", errorText);
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.notifications);
      } else {
        console.error("API returned error:", data.message);
        toast.error(data.message ?? 'Failed to load notifications');
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error('Error loading notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notificationId: id,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update notification');
      }
      
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to update notification');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString;
    }
  };
  
  const getNotificationColorClass = (type: string) => {
    switch (type) {
      case 'submission':
        return 'bg-blue-100 text-blue-700';
      case 'payment':
        return 'bg-green-100 text-green-700';
      case 'update':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };
  
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'submission':
      return <FaCheckCircle className="h-5 w-5" />;
    case 'payment':
      return <FaRupeeSign className="h-5 w-5" />;
    default:
      return <FaInfoCircle className="h-5 w-5" />;
  }
};

  if (status === 'loading' || loading) {
    return (
      <Container marginLeft='5vw' marginRight='5vw'>
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          <p className="ml-3 text-xl">Loading notifications...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container marginLeft='5vw' marginRight='5vw'>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Notifications</h1>
        
        {notifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-xl text-gray-500">You have no notifications.</p>
            <p className="mt-2 text-gray-400">Notifications will appear here when you submit service requests or make payments.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border rounded-lg shadow-sm ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
              >
                <div className="flex items-start">
                  <div className={`p-2 rounded-full mr-4 ${getNotificationColorClass(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-grow">
                    <div className="flex justify-between">
                      <h2 className="text-xl font-semibold">{notification.title}</h2>
                      <span className="text-sm text-gray-500">{formatDate(notification.date)}</span>
                    </div>
                    <p className="mt-2">{notification.message}</p>
                    
                    {notification.type === 'payment' && notification.details && (
                      <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
                        {notification.details.paymentId && (
                          <p><strong>Payment ID:</strong> {String(notification.details.paymentId)}</p>
                        )}
                        {notification.details.orderId && (
                            <p className="hidden"><strong>Order ID:</strong> {String(notification.details.orderId)}</p>
                        )}
                        {notification.details.paymentDate && (
                          <p><strong>Date:</strong> {formatDate(String(notification.details.paymentDate))}</p>
                        )}
                      </div>
                    )}
                    
                    {!notification.read && (
                      <button 
                        onClick={() => markAsRead(notification.id)}
                        className="mt-3 text-sm text-blue-600 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}