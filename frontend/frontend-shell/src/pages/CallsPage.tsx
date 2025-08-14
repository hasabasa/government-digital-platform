import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Phone, 
  Video, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Calendar,
  Clock,
  Users,
  Mic,
  MicOff,
  VideoOff,
  Share,
  MoreVertical
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

interface Call {
  id: string;
  type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined';
  direction: 'incoming' | 'outgoing';
  participant: string;
  participants?: string[];
  duration?: string;
  timestamp: string;
  isGroup?: boolean;
}

const CallsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'recent' | 'schedule' | 'ongoing'>('recent');
  const [inCall, setInCall] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);

  // Mock data
  const recentCalls: Call[] = [
    {
      id: '1',
      type: 'video',
      status: 'completed',
      direction: 'outgoing',
      participant: 'Иван Иванов',
      duration: '25:30',
      timestamp: '10:30',
    },
    {
      id: '2',
      type: 'audio',
      status: 'missed',
      direction: 'incoming',
      participant: 'Мария Петрова',
      timestamp: '09:15',
    },
    {
      id: '3',
      type: 'video',
      status: 'completed',
      direction: 'incoming',
      participant: 'IT Отдел',
      participants: ['Петр Сидоров', 'Анна Козлова', 'Михаил Иванов'],
      duration: '1:15:45',
      timestamp: 'Вчера',
      isGroup: true,
    },
    {
      id: '4',
      type: 'audio',
      status: 'completed',
      direction: 'outgoing',
      participant: 'Алексей Николаев',
      duration: '12:45',
      timestamp: 'Вчера',
    },
    {
      id: '5',
      type: 'video',
      status: 'declined',
      direction: 'outgoing',
      participant: 'Планерка руководства',
      timestamp: '2 дня назад',
      isGroup: true,
    },
  ];

  const scheduledCalls = [
    {
      id: '1',
      title: 'Еженедельная планерка',
      participants: ['Иван Иванов', 'Мария Петрова', 'Петр Сидоров'],
      time: '14:00',
      date: 'Сегодня',
      type: 'video',
    },
    {
      id: '2',
      title: 'Обсуждение проекта',
      participants: ['Анна Козлова'],
      time: '16:30',
      date: 'Завтра',
      type: 'audio',
    },
  ];

  const handleStartCall = (type: 'audio' | 'video', participant?: string) => {
    console.log(`Начать ${type} звонок`, participant ? `с ${participant}` : '');
    
    setCallData({
      type,
      participant: participant || 'Тестовый контакт',
      startTime: new Date().toLocaleTimeString(),
    });
    setInCall(true);
    
    toast.success(`Начинаем ${type === 'video' ? 'видео' : 'аудио'} звонок`);
  };

  const handleEndCall = () => {
    setInCall(false);
    setCallData(null);
    setIsMuted(false);
    setIsVideoEnabled(true);
    toast.success('Звонок завершен');
  };

  const handleScheduleCall = () => {
    console.log('Запланировать звонок');
    toast.success('Звонок запланирован');
  };

  const getCallIcon = (call: Call) => {
    if (call.status === 'missed') {
      return <PhoneMissed className="w-4 h-4 text-red-500" />;
    }
    
    if (call.direction === 'incoming') {
      return <PhoneIncoming className="w-4 h-4 text-green-500" />;
    }
    
    return <PhoneOutgoing className="w-4 h-4 text-blue-500" />;
  };

  const getCallStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'missed':
        return 'text-red-600';
      case 'declined':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (inCall) {
    return (
      <MainLayout>
        <div className="h-[calc(100vh-4rem)] bg-gray-900 flex flex-col items-center justify-center relative">
          {/* Call Header */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 text-center text-white">
            <h2 className="text-xl font-semibold mb-2">
              {callData?.participant}
            </h2>
            <p className="text-sm opacity-80">
              {callData?.type === 'video' ? 'Видеозвонок' : 'Аудиозвонок'} • {callData?.startTime}
            </p>
          </div>

          {/* Video Area */}
          {callData?.type === 'video' && (
            <div className="flex-1 w-full max-w-4xl mx-auto p-8">
              <div className="relative w-full h-full bg-gray-800 rounded-xl overflow-hidden">
                {/* Main Video */}
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl font-bold">
                        {callData?.participant.charAt(0)}
                      </span>
                    </div>
                    <p className="text-lg">{callData?.participant}</p>
                  </div>
                </div>

                {/* Self Video */}
                <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center">
                    <div className="text-center text-white">
                      <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2">
                        <span className="text-xl font-bold">
                          {user?.firstName?.charAt(0)}
                        </span>
                      </div>
                      <p className="text-sm">Вы</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Call */}
          {callData?.type === 'audio' && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center mb-8">
                  <span className="text-6xl font-bold">
                    {callData?.participant.charAt(0)}
                  </span>
                </div>
                <h3 className="text-2xl font-semibold mb-2">
                  {callData?.participant}
                </h3>
                <p className="text-lg opacity-80">Аудиозвонок</p>
              </div>
            </div>
          )}

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-4">
              <Button
                variant={isMuted ? 'danger' : 'secondary'}
                size="lg"
                onClick={() => setIsMuted(!isMuted)}
                className="w-14 h-14 rounded-full"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>

              {callData?.type === 'video' && (
                <Button
                  variant={isVideoEnabled ? 'secondary' : 'danger'}
                  size="lg"
                  onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                  className="w-14 h-14 rounded-full"
                >
                  {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                </Button>
              )}

              <Button
                variant="danger"
                size="lg"
                onClick={handleEndCall}
                className="w-14 h-14 rounded-full"
              >
                <Phone className="w-6 h-6" />
              </Button>

              {callData?.type === 'video' && (
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-14 h-14 rounded-full"
                >
                  <Share className="w-6 h-6" />
                </Button>
              )}

              <Button
                variant="secondary"
                size="lg"
                className="w-14 h-14 rounded-full"
              >
                <MoreVertical className="w-6 h-6" />
              </Button>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Звонки
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Управляйте звонками и видеоконференциями
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="secondary"
              onClick={() => handleStartCall('audio')}
            >
              <Phone className="w-4 h-4 mr-2" />
              Аудиозвонок
            </Button>
            <Button onClick={() => handleStartCall('video')}>
              <Video className="w-4 h-4 mr-2" />
              Видеозвонок
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-fit">
            <button
              onClick={() => setActiveTab('recent')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'recent'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Недавние
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'schedule'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Запланированные
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'recent' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                История звонков
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {recentCalls.map((call) => (
                <div key={call.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        {getCallIcon(call)}
                        {call.type === 'video' ? (
                          <Video className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Phone className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-medium text-gray-900 dark:text-white">
                            {call.participant}
                          </p>
                          {call.isGroup && (
                            <Users className="w-4 h-4 text-gray-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className={getCallStatusColor(call.status)}>
                            {call.status === 'completed' ? 'Завершен' :
                             call.status === 'missed' ? 'Пропущен' : 'Отклонен'}
                          </span>
                          {call.duration && (
                            <>
                              <span>•</span>
                              <span>{call.duration}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{call.timestamp}</span>
                        </div>
                        
                        {call.participants && (
                          <p className="text-xs text-gray-400 mt-1">
                            Участники: {call.participants.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartCall('audio', call.participant)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleStartCall('video', call.participant)}
                      >
                        <Video className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Запланированные звонки
              </h3>
              <Button onClick={handleScheduleCall}>
                <Calendar className="w-4 h-4 mr-2" />
                Запланировать
              </Button>
            </div>
            
            {scheduledCalls.map((call) => (
              <div
                key={call.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {call.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>{call.date}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{call.time}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {call.type === 'video' ? (
                          <Video className="w-4 h-4" />
                        ) : (
                          <Phone className="w-4 h-4" />
                        )}
                        <span>{call.type === 'video' ? 'Видео' : 'Аудио'}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Участники: {call.participants.join(', ')}
                    </p>
                  </div>
                  
                  <Button onClick={() => handleStartCall(call.type as any)}>
                    Присоединиться
                  </Button>
                </div>
              </div>
            ))}
            
            {scheduledCalls.length === 0 && (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Нет запланированных звонков
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Запланируйте звонок или видеоконференцию
                </p>
                <Button onClick={handleScheduleCall}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Запланировать звонок
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CallsPage;
