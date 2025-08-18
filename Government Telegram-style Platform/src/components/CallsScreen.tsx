import React, { useState } from 'react';
import { ArrowLeft, Phone, VideoIcon, PhoneIncoming, PhoneOutgoing, PhoneMissed, Plus } from 'lucide-react';

interface CallsScreenProps {
  onBackToChats: () => void;
}

export default function CallsScreen({ onBackToChats }: CallsScreenProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'missed'>('all');

  const calls = [
    {
      id: 1,
      name: 'Министр экономики',
      role: 'Министр',
      time: '14:32',
      date: 'Сегодня',
      duration: '12:34',
      type: 'incoming',
      isVideo: false,
      avatar: '🏛️',
    },
    {
      id: 2,
      name: 'Департамент финансов',
      role: 'Групповой чат',
      time: '13:15',
      date: 'Сегодня',
      duration: '25:12',
      type: 'outgoing',
      isVideo: true,
      avatar: '💰',
      isGroup: true,
    },
    {
      id: 3,
      name: 'Начальник отдела кадров',
      role: 'Начальник отдела',
      time: '11:45',
      date: 'Сегодня',
      duration: null,
      type: 'missed',
      isVideo: false,
      avatar: '👤',
    },
    {
      id: 4,
      name: 'Петров А.И.',
      role: 'Сотрудник',
      time: '16:20',
      date: 'Вчера',
      duration: '8:45',
      type: 'incoming',
      isVideo: false,
      avatar: '👨‍💼',
    },
    {
      id: 5,
      name: 'Козлова Е.А.',
      role: 'Начальник отдела',
      time: '14:10',
      date: 'Вчера',
      duration: null,
      type: 'missed',
      isVideo: true,
      avatar: '👩‍💼',
    },
    {
      id: 6,
      name: 'Морозов А.В.',
      role: 'Специалист',
      time: '10:30',
      date: 'Вчера',
      duration: '15:22',
      type: 'outgoing',
      isVideo: false,
      avatar: '💻',
    },
  ];

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return <PhoneIncoming className="w-4 h-4 text-green-400" />;
      case 'outgoing':
        return <PhoneOutgoing className="w-4 h-4 text-blue-400" />;
      case 'missed':
        return <PhoneMissed className="w-4 h-4 text-red-400" />;
      default:
        return <Phone className="w-4 h-4 text-[#aaaaaa]" />;
    }
  };

  const filteredCalls = activeTab === 'all' ? calls : calls.filter(call => call.type === 'missed');

  const groupedCalls = filteredCalls.reduce((groups, call) => {
    const date = call.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(call);
    return groups;
  }, {} as Record<string, typeof calls>);

  return (
    <div className="h-full bg-[#212121] flex flex-col">
      {/* Header */}
      <div className="bg-[#2b2b2b] p-4 border-b border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToChats}
              className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#aaaaaa]" />
            </button>
            <h1 className="text-xl text-white">Звонки</h1>
          </div>
          <button className="flex items-center gap-2 bg-[#8bb5ff] hover:bg-[#7ba3ff] text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-4 h-4" />
            Начать новый звонок
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'all'
                ? 'bg-[#8bb5ff] text-white'
                : 'bg-[#3a3a3a] text-[#aaaaaa] hover:bg-[#4a4a4a]'
            }`}
          >
            Все звонки
          </button>
          <button
            onClick={() => setActiveTab('missed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'missed'
                ? 'bg-[#8bb5ff] text-white'
                : 'bg-[#3a3a3a] text-[#aaaaaa] hover:bg-[#4a4a4a]'
            }`}
          >
            Пропущенные
          </button>
        </div>
      </div>

      {/* Calls List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedCalls).map(([date, dateCalls]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="sticky top-0 bg-[#2b2b2b] px-4 py-2 border-b border-[#3a3a3a]">
              <h2 className="text-sm text-[#8bb5ff]">{date}</h2>
            </div>

            {/* Date Calls */}
            {dateCalls.map((call) => (
              <div
                key={call.id}
                className="flex items-center p-4 hover:bg-[#2a2a2a] cursor-pointer border-b border-[#2a2a2a] transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-[#4a4a4a] flex items-center justify-center text-xl mr-3">
                  {call.avatar}
                </div>

                {/* Call Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-white truncate ${call.type === 'missed' ? 'text-red-400' : ''}`}>
                      {call.name}
                    </h3>
                    {call.isGroup && <span className="text-xs text-[#888888]">👥</span>}
                    {call.isVideo && <VideoIcon className="w-3 h-3 text-[#8bb5ff]" />}
                  </div>
                  <p className="text-sm text-[#aaaaaa] truncate">{call.role}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getCallIcon(call.type)}
                    <span className="text-xs text-[#888888]">{call.time}</span>
                    {call.duration && (
                      <>
                        <span className="text-xs text-[#888888]">•</span>
                        <span className="text-xs text-[#888888]">{call.duration}</span>
                      </>
                    )}
                    {call.type === 'missed' && (
                      <>
                        <span className="text-xs text-[#888888]">•</span>
                        <span className="text-xs text-red-400">Пропущенный</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Call Actions */}
                <div className="flex items-center gap-2 ml-3">
                  <button className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors" title="Аудио звонок">
                    <Phone className="w-4 h-4 text-[#aaaaaa]" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors" title="Видео звонок">
                    <VideoIcon className="w-4 h-4 text-[#aaaaaa]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {filteredCalls.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">📞</div>
            <p className="text-[#aaaaaa] text-lg">
              {activeTab === 'missed' ? 'Нет пропущенных звонков' : 'История звонков пуста'}
            </p>
            <p className="text-[#888888] text-sm mt-2">
              {activeTab === 'missed' 
                ? 'Пропущенные звонки будут отображаться здесь'
                : 'Совершите звонок, чтобы увидеть историю'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}