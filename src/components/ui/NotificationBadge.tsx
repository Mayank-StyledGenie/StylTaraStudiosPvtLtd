"use client";
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { CgBell } from "react-icons/cg";
import { colors } from '@/styles/colors';

export default function NotificationBadge() {
  const [count, setCount] = useState<number>(0);
  const { status } = useSession();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchCount();
      
      const interval = setInterval(fetchCount, 60000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [status]);

  const fetchCount = async () => {
    try {
      const response = await fetch('/api/notifications/count');
      if (response.ok) {
        const data = await response.json();
        setCount(data.count);
      }
    } catch (error) {
      console.error('Error fetching notification count:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status !== 'authenticated' || loading) {
    return null;
  }

  return (
    <Link href="/notifications">
      <div className="relative inline-block cursor-pointer">
        <CgBell size={24} className="text-gray-600 hover:text-gray-800 mt-2" style={{ color: colors.primary.darkpurple }}/>
        {count > 0 && (
          <span className="absolute -top-1 -right-3 bg-[#401735] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </div>
    </Link>
  );
}