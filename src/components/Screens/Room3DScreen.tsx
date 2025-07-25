import React from 'react';
import { Room3D } from '../Room3D/Room3D';

// Mock user ID - em produção viria do sistema de autenticação
const MOCK_USER_ID = 'user_123';

export const Room3DScreen: React.FC = () => {
  return (
    <div className="w-full h-screen bg-gray-100">
      <Room3D userId={MOCK_USER_ID} />
    </div>
  );
};
