import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { apiService } from '../services/api.service';
import { useAuthStore } from '../stores/auth.store';
import { Contact, User } from '../types';
import {
  Search,
  UserPlus,
  MessageSquare,
  Check,
  X,
  Trash2,
  Loader2,
  Users,
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

type Tab = 'contacts' | 'pending' | 'search';

const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pendingContacts, setPendingContacts] = useState<Contact[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load contacts
  const loadContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getUserContacts();
      const list = response.data?.contacts || response.data || [];
      setContacts(Array.isArray(list) ? list : []);
    } catch {
      console.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load pending
  const loadPending = useCallback(async () => {
    try {
      const response = await apiService.getPendingContacts();
      const list = response.data?.contacts || response.data || [];
      setPendingContacts(Array.isArray(list) ? list : []);
    } catch {
      console.error('Failed to load pending contacts');
    }
  }, []);

  useEffect(() => {
    loadContacts();
    loadPending();
  }, [loadContacts, loadPending]);

  // Search users
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiService.searchUsers(query);
      const users = response.data?.users || response.data || [];
      setSearchResults(
        Array.isArray(users) ? users.filter((u: User) => u.id !== user?.id) : []
      );
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddContact = async (userId: string) => {
    try {
      await apiService.addContact(userId);
      toast.success('Запрос отправлен');
      // Remove from search results visually
      setSearchResults((prev) => prev.filter((u) => u.id !== userId));
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка');
    }
  };

  const handleAccept = async (contactId: string) => {
    try {
      await apiService.acceptContact(contactId);
      toast.success('Контакт добавлен');
      loadContacts();
      loadPending();
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleDecline = async (contactId: string) => {
    try {
      await apiService.declineContact(contactId);
      setPendingContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleRemove = async (contactUserId: string) => {
    try {
      await apiService.removeContact(contactUserId);
      setContacts((prev) => prev.filter((c) => c.contactUserId !== contactUserId));
      toast.success('Контакт удалён');
    } catch {
      toast.error('Ошибка');
    }
  };

  const handleStartChat = async (targetUser: User) => {
    try {
      const response = await apiService.createChat({
        type: 'direct',
        participantIds: [targetUser.id],
      });
      const chat = response.data;
      if (chat?.id) {
        navigate(`/chat/${chat.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка создания чата');
    }
  };

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'contacts', label: 'Контакты', count: contacts.length },
    { id: 'pending', label: 'Входящие', count: pendingContacts.length },
    { id: 'search', label: 'Поиск' },
  ];

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col bg-[#0e1621] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#232e3c] bg-[#17212b]">
          <h1 className="text-lg font-bold text-white mb-3">Контакты</h1>

          {/* Tabs */}
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-[#3a73b8] text-white'
                    : 'text-[#6c7883] hover:text-white hover:bg-[#232e3c]'
                )}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Contacts tab */}
          {activeTab === 'contacts' && (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center py-12 text-[#6c7883]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Загрузка...</span>
                </div>
              ) : contacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#6c7883]">
                  <Users className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Нет контактов</p>
                  <button
                    onClick={() => setActiveTab('search')}
                    className="mt-3 text-xs text-[#3a73b8] hover:underline"
                  >
                    Найти людей
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-[#232e3c]">
                  {contacts.map((contact) => {
                    const u = contact.user;
                    if (!u) return null;
                    const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`;

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-[#232e3c]/50 transition-colors"
                      >
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
                            {initials || '??'}
                          </div>
                          {u.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-[#0e1621] rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-[#6c7883] truncate">
                            {u.position || u.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartChat(u)}
                            className="p-2 text-[#6c7883] hover:text-white hover:bg-[#232e3c] rounded-lg transition-colors"
                            title="Написать"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(contact.contactUserId)}
                            className="p-2 text-[#6c7883] hover:text-red-400 hover:bg-[#232e3c] rounded-lg transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Pending tab */}
          {activeTab === 'pending' && (
            <div>
              {pendingContacts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[#6c7883]">
                  <UserPlus className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">Нет входящих запросов</p>
                </div>
              ) : (
                <div className="divide-y divide-[#232e3c]">
                  {pendingContacts.map((contact) => {
                    const u = contact.user;
                    if (!u) return null;
                    const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`;

                    return (
                      <div
                        key={contact.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {initials || '??'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {u.firstName} {u.lastName}
                          </p>
                          <p className="text-xs text-[#6c7883] truncate">
                            {contact.note || u.position || u.email}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleAccept(contact.id)}
                            className="p-2 text-green-400 hover:bg-green-500/10 rounded-lg transition-colors"
                            title="Принять"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDecline(contact.id)}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Отклонить"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Search tab */}
          {activeTab === 'search' && (
            <div>
              <div className="px-4 py-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
                  <input
                    type="text"
                    placeholder="Поиск по имени или email..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
                    autoFocus
                  />
                </div>
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-8 text-[#6c7883]">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm">Поиск...</span>
                </div>
              )}

              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <p className="text-center text-sm text-[#6c7883] py-8">Пользователи не найдены</p>
              )}

              <div className="divide-y divide-[#232e3c]">
                {searchResults.map((u) => {
                  const initials = `${u.firstName?.[0] || ''}${u.lastName?.[0] || ''}`;
                  const isContact = contacts.some((c) => c.contactUserId === u.id);

                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-[#232e3c]/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        {initials || '??'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-[#6c7883] truncate">
                          {u.position || u.email}
                        </p>
                      </div>
                      {isContact ? (
                        <span className="text-xs text-[#6c7883] px-3 py-1 bg-[#232e3c] rounded-full">
                          В контактах
                        </span>
                      ) : (
                        <button
                          onClick={() => handleAddContact(u.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3a73b8] text-white text-xs rounded-lg hover:bg-[#4a83c8] transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Добавить
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ContactsPage;
