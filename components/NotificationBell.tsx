'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageSquare, Calendar, Info, Check } from 'lucide-react';
import { db, auth } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, updateDoc, doc, deleteDoc, limit } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.read).length);
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare size={16} className="text-blue-500" />;
      case 'event': return <Calendar size={16} className="text-green-500" />;
      case 'update': return <Info size={16} className="text-yellow-500" />;
      case 'grade': return <Check size={16} className="text-purple-500" />;
      default: return <Bell size={16} className="text-gray-500" />;
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 hover:bg-white/10 rounded-full transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-[#1a365d]">
            {unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            className="fixed inset-0 z-30" 
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-40 overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm">Obavijesti</h3>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                  {unreadCount} nove
                </span>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    onClick={() => markAsRead(n.id)}
                    className={`p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${!n.read ? 'bg-blue-50/30' : ''}`}
                  >
                    <div className="mt-1">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${!n.read ? 'font-bold text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                        <button 
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="text-gray-300 hover:text-red-500 p-1"
                        >
                          <Bell size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {new Date(n.createdAt).toLocaleString('hr-HR', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-400 italic text-sm">
                  Nema novih obavijesti.
                </div>
              )}
            </div>
            <div className="bg-gray-50 p-2 text-center border-t border-gray-200">
              <button className="text-xs text-blue-600 font-bold hover:underline">Vidi sve obavijesti</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
