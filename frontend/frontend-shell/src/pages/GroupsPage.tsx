import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { apiService } from '../services/api.service';
import { useAuthStore } from '../stores/auth.store';
import { Chat } from '../types';
import {
  Users,
  Plus,
  Search,
  X,
  Loader2,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

const GroupsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [groups, setGroups] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create modal state
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  const loadGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getUserChats();
      const allChats = response.data?.chats || response.data || [];
      const groupChats = Array.isArray(allChats)
        ? allChats.filter((c: Chat) => c.type === 'group' || c.type === 'channel')
        : [];
      setGroups(groupChats);
    } catch {
      console.error('Failed to load groups');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  const handleSearchMembers = async (query: string) => {
    setMemberSearch(query);
    if (query.length < 2) {
      setMemberSearchResults([]);
      return;
    }
    setIsSearchingMembers(true);
    try {
      const response = await apiService.searchUsers(query);
      const users = response.data?.users || response.data || [];
      const filtered = Array.isArray(users)
        ? users.filter(
            (u: any) =>
              u.id !== user?.id &&
              !selectedMembers.some((m) => m.id === u.id)
          )
        : [];
      setMemberSearchResults(filtered);
    } catch {
      setMemberSearchResults([]);
    } finally {
      setIsSearchingMembers(false);
    }
  };

  const addMember = (u: any) => {
    setSelectedMembers((prev) => [...prev, u]);
    setMemberSearchResults((prev) => prev.filter((r) => r.id !== u.id));
    setMemberSearch('');
  };

  const removeMember = (id: string) => {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const handleCreate = async () => {
    if (!newGroupName.trim()) {
      toast.error('Введите название группы');
      return;
    }
    if (selectedMembers.length === 0) {
      toast.error('Добавьте хотя бы одного участника');
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiService.createChat({
        type: 'group',
        name: newGroupName.trim(),
        participantIds: selectedMembers.map((m) => m.id),
      });

      const newChat = response.data;
      setShowCreateModal(false);
      setNewGroupName('');
      setSelectedMembers([]);
      setMemberSearch('');

      toast.success('Группа создана');

      if (newChat?.id) {
        navigate(`/chat/${newChat.id}`);
      } else {
        loadGroups();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка создания группы');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredGroups = groups.filter((g) => {
    if (!searchQuery) return true;
    return g.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col bg-[#0e1621] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#232e3c] bg-[#17212b]">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-white">Группы</h1>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3a73b8] text-white text-sm rounded-lg hover:bg-[#4a83c8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Создать
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type="text"
              placeholder="Поиск групп..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
            />
          </div>
        </div>

        {/* Groups list */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-[#6c7883]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Загрузка...</span>
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-[#6c7883]">
              <Users className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">{searchQuery ? 'Группы не найдены' : 'Нет групп'}</p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="mt-3 text-xs text-[#3a73b8] hover:underline"
                >
                  Создать первую группу
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#232e3c]">
              {filteredGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => navigate(`/chat/${group.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#232e3c]/50 transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
                    {group.type === 'channel' ? (
                      <Hash className="w-6 h-6" />
                    ) : (
                      <Users className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-medium text-white truncate">
                        {group.name || 'Группа'}
                      </p>
                      <span className="text-[10px] text-[#6c7883] flex-shrink-0 ml-2">
                        {formatTime(group.lastMessageAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#6c7883] truncate">
                        {group.participantCount || group.participants?.length || 0} участников
                      </p>
                      {group.unreadCount && group.unreadCount > 0 && (
                        <span className="ml-2 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-[#3a73b8] text-[10px] text-white font-bold px-1.5 flex-shrink-0">
                          {group.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="bg-[#17212b] border border-[#232e3c] rounded-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#232e3c]">
                <h3 className="text-base font-semibold text-white">Новая группа</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-[#6c7883] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Group name */}
                <div>
                  <label className="block text-xs text-[#6c7883] uppercase tracking-wider mb-1.5">
                    Название
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Название группы..."
                    className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
                    autoFocus
                  />
                </div>

                {/* Selected members */}
                {selectedMembers.length > 0 && (
                  <div>
                    <label className="block text-xs text-[#6c7883] uppercase tracking-wider mb-1.5">
                      Участники ({selectedMembers.length})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedMembers.map((m) => (
                        <span
                          key={m.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-[#3a73b8]/20 text-[#3a73b8] text-xs rounded-full"
                        >
                          {m.firstName} {m.lastName?.[0]}.
                          <button onClick={() => removeMember(m.id)} className="hover:text-white">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search members */}
                <div>
                  <label className="block text-xs text-[#6c7883] uppercase tracking-wider mb-1.5">
                    Добавить участников
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
                    <input
                      type="text"
                      value={memberSearch}
                      onChange={(e) => handleSearchMembers(e.target.value)}
                      placeholder="Поиск пользователей..."
                      className="w-full bg-[#0e1621] border border-[#232e3c] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto mt-2 space-y-1">
                    {isSearchingMembers && (
                      <div className="flex items-center justify-center py-3 text-[#6c7883]">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span className="text-xs">Поиск...</span>
                      </div>
                    )}
                    {memberSearchResults.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => addMember(u)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#232e3c] transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                          {u.firstName?.[0] || '?'}{u.lastName?.[0] || ''}
                        </div>
                        <div className="text-left min-w-0">
                          <p className="text-sm text-white truncate">{u.firstName} {u.lastName}</p>
                          <p className="text-[10px] text-[#6c7883] truncate">{u.position || u.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Create button */}
                <button
                  onClick={handleCreate}
                  disabled={isCreating || !newGroupName.trim() || selectedMembers.length === 0}
                  className="w-full py-2.5 bg-[#3a73b8] text-white text-sm rounded-xl hover:bg-[#4a83c8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Создать группу
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default GroupsPage;
