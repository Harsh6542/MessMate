import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const socketInstance = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      console.log('[Socket.IO] Connected to real-time server as', user.firstName);
    });

    // Real-time notification received
    socketInstance.on('notification:new', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);
      toast(notification.message, {
        icon: '🔔',
        style: {
          borderRadius: '12px',
          background: '#0f172a',
          color: '#38bdf8',
          border: '1px solid #1e293b'
        }
      });
    });

    // Real-time announcement broadcast
    socketInstance.on('announcement:new', (announcement) => {
      toast(`[Announcement] ${announcement.title}: ${announcement.content.substring(0, 50)}...`, {
        icon: '📢',
        duration: 5000,
        style: {
          borderRadius: '12px',
          background: '#0f172a',
          color: '#fbbf24',
          border: '1px solid #78350f'
        }
      });
    });

    // Manager / Warden complaint alerts
    socketInstance.on('complaint:new', (data) => {
      if (user.role === 'mess_manager' || user.role === 'warden') {
        toast(`New Complaint #${data.complaintId}: ${data.subject}`, {
          icon: '⚠️',
          style: {
            borderRadius: '12px',
            background: '#0f172a',
            color: '#f87171',
            border: '1px solid #991b1b'
          }
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [isAuthenticated, user]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        setUnreadCount
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};

export default SocketContext;

