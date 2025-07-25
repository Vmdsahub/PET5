import React from 'react';
import { Room3D } from '../Room3D/Room3D';
import { useAuthStore } from '../../store/authStore';

// Mock user ID - em produção viria do sistema de autenticação
const MOCK_USER_ID = 'user_123';

export const Room3DScreen: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.isAdmin || false;

  // Debug: Log user and admin status
  console.log("Room3DScreen - user:", user);
  console.log("Room3DScreen - isAdmin:", isAdmin);

  return (
    <div className="w-full h-screen bg-gray-100">
      <Room3D userId={MOCK_USER_ID} isAdmin={isAdmin} />
    </div>
  );
};
