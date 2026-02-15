import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

// === Types ===
interface CallRecord {
  id: string;
  type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined';
  direction: 'incoming' | 'outgoing';
  contact: string;
  duration?: string;
  timestamp: string;
}

// === Demo Data ===
const CONTACTS = [
  { id: '1', name: 'Хасенхан Казимов', role: 'Управляющий партнёр', isOnline: true },
  { id: '2', name: 'Адиль Хамитов', role: 'Партнёр', isOnline: true },
  { id: '3', name: 'Азамат Бекхалиев', role: 'Партнёр', isOnline: false },
  { id: '4', name: 'Алпамыс Мақажан', role: 'Разработчик', isOnline: true },
];

const CALL_HISTORY: CallRecord[] = [
  { id: '1', type: 'video', status: 'completed', direction: 'outgoing', contact: 'Адиль Хамитов', duration: '12:34', timestamp: 'Сегодня, 15:30' },
  { id: '2', type: 'audio', status: 'missed', direction: 'incoming', contact: 'Азамат Бекхалиев', timestamp: 'Сегодня, 14:00' },
  { id: '3', type: 'audio', status: 'completed', direction: 'incoming', contact: 'Алпамыс Мақажан', duration: '5:12', timestamp: 'Сегодня, 11:00' },
  { id: '4', type: 'video', status: 'completed', direction: 'outgoing', contact: 'Хасенхан Казимов', duration: '45:07', timestamp: 'Вчера, 16:00' },
  { id: '5', type: 'audio', status: 'declined', direction: 'outgoing', contact: 'Азамат Бекхалиев', timestamp: 'Вчера, 10:20' },
];

const CallsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<'history' | 'contacts'>('history');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCall, setActiveCall] = useState<{ contact: string; type: 'audio' | 'video' } | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const handleStartCall = (contact: string, type: 'audio' | 'video') => {
    setActiveCall({ contact, type });
    toast.success(`Звоним: ${contact}`);
  };

  const handleEndCall = () => {
    toast.success(`Звонок завершён`);
    setActiveCall(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const getCallIcon = (call: CallRecord) => {
    if (call.status === 'missed') return <PhoneMissed className="w-4 h-4 text-red-400" />;
    if (call.direction === 'incoming') return <PhoneIncoming className="w-4 h-4 text-green-400" />;
    return <PhoneOutgoing className="w-4 h-4 text-blue-400" />;
  };

  const filteredHistory = CALL_HISTORY.filter((c) =>
    c.contact.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = CONTACTS.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      c.name !== `${user?.firstName} ${user?.lastName}`.trim()
  );

  return (
    <MainLayout>
      <div className="h-full overflow-auto bg-[#0e1621]">
        {/* Header */}
        <div className="bg-[#17212b]/95 backdrop-blur-sm border-b border-[#232e3c] px-6 py-4">
          <h1 className="text-xl font-semibold text-white mb-4">Звонки</h1>

          {/* Tabs */}
          <div className="flex gap-1 bg-[#0e1621] rounded-xl p-1">
            <button
              onClick={() => setTab('history')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'history' ? 'bg-[#3a73b8] text-white' : 'text-[#6c7883] hover:text-white'
                }`}
            >
              История
            </button>
            <button
              onClick={() => setTab('contacts')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${tab === 'contacts' ? 'bg-[#3a73b8] text-white' : 'text-[#6c7883] hover:text-white'
                }`}
            >
              Контакты
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6c7883]" />
            <input
              type="text"
              placeholder={tab === 'history' ? 'Поиск звонков...' : 'Поиск контактов...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#17212b] border border-[#232e3c] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] transition-colors"
            />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {tab === 'history' && (
            <div className="space-y-1">
              {filteredHistory.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center gap-3 bg-[#17212b] border border-[#232e3c] rounded-xl p-3 hover:border-[#3a73b8]/30 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-semibold text-white flex-shrink-0">
                    {call.contact.split(' ').map((n) => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{call.contact}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {getCallIcon(call)}
                      <span className="text-[11px] text-[#6c7883]">
                        {call.type === 'video' ? 'Видео' : 'Аудио'}
                        {call.duration && ` · ${call.duration}`}
                      </span>
                    </div>
                  </div>

                  {/* Time + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-[#6c7883]">{call.timestamp}</span>
                    <button
                      onClick={() => handleStartCall(call.contact, 'audio')}
                      className="p-1.5 text-[#6c7883] hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredHistory.length === 0 && (
                <div className="text-center py-12">
                  <Phone className="w-10 h-10 text-[#6c7883]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#6c7883]">Нет звонков</p>
                </div>
              )}
            </div>
          )}

          {tab === 'contacts' && (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className="flex items-center gap-3 bg-[#17212b] border border-[#232e3c] rounded-xl p-3 hover:border-[#3a73b8]/30 transition-colors"
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-xs font-semibold text-white">
                      {contact.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    {contact.isOnline && (
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#17212b]" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{contact.name}</p>
                    <p className="text-[11px] text-[#6c7883]">{contact.role}</p>
                  </div>

                  {/* Call buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartCall(contact.name, 'audio')}
                      className="p-2 text-[#6c7883] hover:text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStartCall(contact.name, 'video')}
                      className="p-2 text-[#6c7883] hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredContacts.length === 0 && (
                <div className="text-center py-12">
                  <Phone className="w-10 h-10 text-[#6c7883]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#6c7883]">Нет контактов</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === Active Call Overlay === */}
      {activeCall && (
        <div className="fixed inset-0 z-50 bg-[#0e1621]/95 backdrop-blur-md flex flex-col items-center justify-center">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl font-bold text-white mb-4 animate-pulse">
            {activeCall.contact.split(' ').map((n) => n[0]).join('')}
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">{activeCall.contact}</h2>
          <p className="text-sm text-[#6c7883] mb-10">
            {activeCall.type === 'video' ? 'Видеозвонок' : 'Аудиозвонок'} · Вызов...
          </p>

          {/* Controls */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500/20 text-red-400' : 'bg-[#232e3c] text-white hover:bg-[#2b3a4c]'
                }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {activeCall.type === 'video' && (
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500/20 text-red-400' : 'bg-[#232e3c] text-white hover:bg-[#2b3a4c]'
                  }`}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
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
