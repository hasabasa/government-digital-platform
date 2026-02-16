import React, { useState, useEffect, useCallback } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import {
  Phone,
  Video,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Mic,
  MicOff,
  VideoOff,
  Loader2,
} from 'lucide-react';
import { apiService } from '../services/api.service';
import { useAuthStore } from '../stores/auth.store';
import { User } from '../types';
import toast from 'react-hot-toast';

interface CallRecord {
  id: string;
  type: 'audio' | 'video';
  status: 'pending' | 'active' | 'ended' | 'missed' | 'declined';
  participants?: Array<{
    userId: string;
    userName?: string;
    status: string;
    joinedAt?: string;
    leftAt?: string;
  }>;
  initiatorId?: string;
  title?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

const CallsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'history' | 'contacts'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCall, setActiveCall] = useState<{
    contact: string;
    type: 'audio' | 'video';
  } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [contacts, setContacts] = useState<User[]>([]);
  const [isLoadingCalls, setIsLoadingCalls] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  // Load call history
  const loadCalls = useCallback(async () => {
    setIsLoadingCalls(true);
    try {
      const response = await apiService.getCalls();
      const list = response.data?.calls || response.data || [];
      setCalls(Array.isArray(list) ? list : []);
    } catch {
      // Бэкенд может быть недоступен
    } finally {
      setIsLoadingCalls(false);
    }
  }, []);

  // Load contacts for "contacts" tab
  const loadContacts = useCallback(async () => {
    setIsLoadingContacts(true);
    try {
      const response = await apiService.getUserContacts();
      const list = response.data?.contacts || response.data || [];
      const users = Array.isArray(list)
        ? list.map((c: any) => c.user).filter(Boolean)
        : [];
      setContacts(users);
    } catch {
      // Бэкенд может быть недоступен
    } finally {
      setIsLoadingContacts(false);
    }
  }, []);

  useEffect(() => {
    loadCalls();
  }, [loadCalls]);

  useEffect(() => {
    if (tab === 'contacts' && contacts.length === 0) {
      loadContacts();
    }
  }, [tab, contacts.length, loadContacts]);

  const handleStartCall = async (
    contactName: string,
    type: 'audio' | 'video',
    targetUserId?: string
  ) => {
    setActiveCall({ contact: contactName, type });

    if (targetUserId) {
      try {
        await apiService.initiateCall({
          type,
          participantIds: [targetUserId],
          title: `${type === 'video' ? 'Видео' : 'Аудио'}звонок`,
        });
      } catch {
        // Бэкенд звонков может быть не готов
      }
    }

    toast.success(`Звоним: ${contactName}`);
  };

  const handleEndCall = () => {
    toast.success('Звонок завершён');
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const getCallDirection = (call: CallRecord) => {
    if (call.initiatorId === user?.id) return 'outgoing';
    return 'incoming';
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === 'missed' || call.status === 'declined') {
      return <PhoneMissed className="w-4 h-4 text-red-400" />;
    }
    if (getCallDirection(call) === 'incoming') {
      return <PhoneIncoming className="w-4 h-4 text-green-400" />;
    }
    return <PhoneOutgoing className="w-4 h-4 text-blue-400" />;
  };

  const getCallContactName = (call: CallRecord) => {
    if (call.title) return call.title;
    const otherParticipant = call.participants?.find(
      (p) => p.userId !== user?.id
    );
    return otherParticipant?.userName || 'Неизвестный';
  };

  const getCallDuration = (call: CallRecord) => {
    if (!call.startedAt || !call.endedAt) return null;
    const start = new Date(call.startedAt).getTime();
    const end = new Date(call.endedAt).getTime();
    const secs = Math.floor((end - start) / 1000);
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return `Сегодня, ${d.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) {
      return `Вчера, ${d.toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    }
    return d.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredCalls = calls.filter((c) =>
    getCallContactName(c).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      `${c.firstName} ${c.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) &&
      c.id !== user?.id
  );

  return (
    <MainLayout>
      <div className="h-full overflow-auto bg-[#0e1621]">
        {/* Header */}
        <div className="bg-[#17212b]/95 backdrop-blur-sm border-b border-[#232e3c] px-4 md:px-6 py-4">
          <h1 className="text-lg font-semibold text-white mb-4">Звонки</h1>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0e1621] rounded-xl p-1 max-w-xs">
            <button
              onClick={() => setTab('history')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === 'history'
                  ? 'bg-[#3a73b8] text-white'
                  : 'text-[#6c7883] hover:text-white'
              }`}
            >
              История
            </button>
            <button
              onClick={() => setTab('contacts')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                tab === 'contacts'
                  ? 'bg-[#3a73b8] text-white'
                  : 'text-[#6c7883] hover:text-white'
              }`}
            >
              Контакты
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 md:px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type="text"
              placeholder={
                tab === 'history' ? 'Поиск звонков...' : 'Поиск контактов...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-4 md:px-6 pb-6">
          {tab === 'history' && (
            <div className="space-y-1">
              {isLoadingCalls ? (
                <div className="flex items-center justify-center py-12 text-[#6c7883]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Загрузка...</span>
                </div>
              ) : filteredCalls.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="w-10 h-10 text-[#6c7883]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#6c7883]">
                    {searchQuery ? 'Звонки не найдены' : 'Нет звонков'}
                  </p>
                  <p className="text-xs text-[#6c7883]/60 mt-1">
                    Перейдите на вкладку "Контакты" чтобы начать звонок
                  </p>
                </div>
              ) : (
                filteredCalls.map((call) => {
                  const contactName = getCallContactName(call);
                  const duration = getCallDuration(call);
                  const initials = contactName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2);

                  return (
                    <div
                      key={call.id}
                      className="flex items-center gap-3 bg-[#17212b] border border-[#232e3c] rounded-xl p-3 hover:border-[#3a73b8]/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {contactName}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getCallIcon(call)}
                          <span className="text-[11px] text-[#6c7883]">
                            {call.type === 'video' ? 'Видео' : 'Аудио'}
                            {duration && ` · ${duration}`}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[10px] text-[#6c7883]">
                          {formatTime(call.createdAt)}
                        </span>
                        <button
                          onClick={() =>
                            handleStartCall(contactName, call.type)
                          }
                          className="p-2.5 text-[#6c7883] hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-1">
              {isLoadingContacts ? (
                <div className="flex items-center justify-center py-12 text-[#6c7883]">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  <span className="text-sm">Загрузка контактов...</span>
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="text-center py-12">
                  <Phone className="w-10 h-10 text-[#6c7883]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#6c7883]">
                    {searchQuery ? 'Контакты не найдены' : 'Нет контактов'}
                  </p>
                  <p className="text-xs text-[#6c7883]/60 mt-1">
                    Добавьте контакты на странице "Контакты"
                  </p>
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const initials = `${contact.firstName?.[0] || ''}${contact.lastName?.[0] || ''}`;

                  return (
                    <div
                      key={contact.id}
                      className="flex items-center gap-3 bg-[#17212b] border border-[#232e3c] rounded-xl p-3 hover:border-[#3a73b8]/30 transition-colors"
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-semibold text-white">
                          {initials || '??'}
                        </div>
                        {contact.isOnline && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#17212b]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {contact.firstName} {contact.lastName}
                        </p>
                        <p className="text-[11px] text-[#6c7883]">
                          {contact.position || contact.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() =>
                            handleStartCall(
                              `${contact.firstName} ${contact.lastName}`,
                              'audio',
                              contact.id
                            )
                          }
                          className="p-2 text-[#6c7883] hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleStartCall(
                              `${contact.firstName} ${contact.lastName}`,
                              'video',
                              contact.id
                            )
                          }
                          className="p-2 text-[#6c7883] hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
                        >
                          <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>

      {/* Active Call Overlay */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-[#0e1621]/95 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white mb-4 animate-pulse">
            {activeCall.contact
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">
            {activeCall.contact}
          </h2>
          <p className="text-sm text-[#6c7883] mb-10">
            {activeCall.type === 'video' ? 'Видеозвонок' : 'Аудиозвонок'} ·
            Вызов...
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? 'bg-red-500/20 text-red-400'
                  : 'bg-[#232e3c] text-white hover:bg-[#2b3a4c]'
              }`}
            >
              {isMuted ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>

            {activeCall.type === 'video' && (
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  isVideoOff
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[#232e3c] text-white hover:bg-[#2b3a4c]'
                }`}
              >
                {isVideoOff ? (
                  <VideoOff className="w-5 h-5" />
                ) : (
                  <Video className="w-5 h-5" />
                )}
              </button>
            )}

            <button
              onClick={handleEndCall}
              className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Phone className="w-5 h-5 rotate-[135deg]" />
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default CallsPage;
