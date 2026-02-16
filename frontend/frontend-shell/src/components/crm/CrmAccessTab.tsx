import React, { useEffect, useState } from 'react';
import { useCrmStore } from '../../stores/crm.store';
import { apiService } from '../../services/api.service';
import { Shield, UserPlus, UserMinus, Search } from 'lucide-react';
import { User } from '../../types';

export const CrmAccessTab: React.FC = () => {
  const { accessList, fetchAccessList, grantAccess, revokeAccess } = useCrmStore();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAccessList();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await apiService.getUsers(1, 100);
      setAllUsers(res.data?.users || res.data || []);
    } catch (e) {
      console.error('loadUsers error', e);
    }
  };

  const activeAccessUserIds = new Set(
    accessList.filter((a) => a.isActive).map((a) => a.userId)
  );

  const handleToggle = async (userId: string) => {
    setLoading(true);
    try {
      if (activeAccessUserIds.has(userId)) {
        await revokeAccess(userId);
      } else {
        await grantAccess(userId);
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.firstName?.toLowerCase().includes(q) ||
      u.lastName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#3a73b8]" />
          <h2 className="text-lg font-semibold text-white">Управление доступом к CRM</h2>
        </div>
      </div>

      <p className="text-sm text-[#6c7883] mb-4">
        Включите доступ к CRM для нужных пользователей. Администраторы всегда имеют полный доступ.
      </p>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск пользователя..."
          className="w-full pl-10 pr-4 py-2 bg-[#0e1621] border border-[#232e3c] rounded-lg text-sm text-white placeholder-[#6c7883] outline-none focus:border-[#3a73b8]"
        />
      </div>

      {/* Users list */}
      <div className="bg-[#17212b] border border-[#232e3c] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#232e3c]">
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Пользователь</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Email</th>
              <th className="text-left text-xs text-[#6c7883] font-medium px-4 py-3">Роль</th>
              <th className="text-center text-xs text-[#6c7883] font-medium px-4 py-3">CRM доступ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => {
              const hasAccess = activeAccessUserIds.has(u.id);
              const isAdminUser = u.role === 'admin';

              return (
                <tr key={u.id} className="border-b border-[#232e3c] last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </div>
                      <span className="text-sm text-white">{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#adb5bd]">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      isAdminUser ? 'bg-red-500/20 text-red-400' :
                      u.role === 'manager' ? 'bg-blue-500/20 text-blue-400' :
                      'bg-[#232e3c] text-[#adb5bd]'
                    }`}>
                      {isAdminUser ? 'Admin' : u.role === 'manager' ? 'Manager' : 'Employee'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isAdminUser ? (
                      <span className="text-xs text-green-400">Всегда</span>
                    ) : (
                      <button
                        onClick={() => handleToggle(u.id)}
                        disabled={loading}
                        className={`relative w-11 h-6 rounded-full transition-colors ${
                          hasAccess ? 'bg-green-500' : 'bg-[#232e3c]'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                          hasAccess ? 'translate-x-[22px]' : 'translate-x-0.5'
                        }`} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#6c7883]">
                  Пользователи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
