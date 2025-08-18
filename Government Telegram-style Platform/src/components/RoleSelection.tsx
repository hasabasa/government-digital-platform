import React, { useState } from 'react';
import { Crown, Shield, Star, User } from 'lucide-react';

interface RoleSelectionProps {
  onRoleSelect: (role: string) => void;
}

export default function RoleSelection({ onRoleSelect }: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');

  const roles = [
    {
      id: 'minister',
      title: 'Министр',
      description: 'Управляет министерством, создает приказы и задачи',
      icon: Crown,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'department_head',
      title: 'Начальник департамента',
      description: 'Управляет департаментом, создает приказы и задачи',
      icon: Shield,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'division_head',
      title: 'Начальник отдела',
      description: 'Управляет отделом, создает задачи сотрудникам',
      icon: Star,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'employee',
      title: 'Сотрудник',
      description: 'Получает задачи, общается, видет новости',
      icon: User,
      color: 'from-gray-500 to-gray-600'
    }
  ];

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Выберите вашу роль</h1>
          <p className="text-xl text-gray-400">Выберите роль для доступа к системе управления</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {roles.map((role) => {
            const IconComponent = role.icon;
            const isSelected = selectedRole === role.id;
            
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`
                  relative p-8 rounded-2xl border-2 transition-all duration-300 text-left group
                  ${isSelected 
                    ? 'border-[#2D7DD2] bg-[#2D7DD2]/10 transform scale-105' 
                    : 'border-gray-700 bg-[#2a2a2a] hover:border-[#2D7DD2]/50 hover:bg-[#2D7DD2]/5 hover:transform hover:scale-102'
                  }
                `}
              >
                <div className="flex items-start space-x-4">
                  <div className={`
                    w-16 h-16 rounded-xl flex items-center justify-center bg-gradient-to-r ${role.color}
                    ${isSelected ? 'shadow-lg' : 'group-hover:shadow-md'}
                    transition-shadow duration-300
                  `}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`
                      text-2xl font-bold mb-3 transition-colors
                      ${isSelected ? 'text-[#2D7DD2]' : 'text-white group-hover:text-[#2D7DD2]'}
                    `}>
                      {role.title}
                    </h3>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      {role.description}
                    </p>
                  </div>
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-[#2D7DD2] rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className={`
              px-12 py-4 rounded-xl text-xl font-bold transition-all duration-300
              ${selectedRole
                ? 'bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white hover:shadow-lg hover:transform hover:scale-105'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            Продолжить
          </button>
        </div>
      </div>
    </div>
  );
}