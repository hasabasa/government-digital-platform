import React, { useState } from 'react';
import { ChevronRight, User, Bell, Lock, Database, Palette, Globe, Briefcase, Moon, Check } from 'lucide-react';

export default function SettingsScreen() {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkTheme, setDarkTheme] = useState(true);
  const [language, setLanguage] = useState('ru');

  const settingsItems = [
    {
      id: 'profile',
      icon: User,
      title: 'Мой профиль',
      description: 'Фото, имя, должность, департамент',
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Уведомления и звук',
      description: 'Звуки сообщений, уведомления групп',
    },
    {
      id: 'privacy',
      icon: Lock,
      title: 'Конфиденциальность',
      description: 'Статус в сети, последняя активность',
    },
    {
      id: 'data',
      icon: Database,
      title: 'Данные и память',
      description: 'Использование сети и хранилища',
    },
    {
      id: 'appearance',
      icon: Palette,
      title: 'Оформление',
      description: 'Цветовая схема и размер чата',
    },
    {
      id: 'language',
      icon: Globe,
      title: 'Язык',
      description: 'Русский',
    },
    {
      id: 'business',
      icon: Briefcase,
      title: 'Telegram для бизнеса',
      description: 'Интеграция с внешними системами',
    },
  ];

  const profileData = {
    name: 'Иванов Иван Иванович',
    position: 'Заместитель министра',
    department: 'Министерство экономики',
    phone: '+7 (495) 123-45-67',
    email: 'ivanov@gov.ru',
    avatar: '👨‍💼',
  };

  const renderProfileSection = () => (
    <div className="p-6">
      <h2 className="text-xl text-white mb-6">Мой профиль</h2>
      
      {/* Profile Picture */}
      <div className="flex items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#4a4a4a] flex items-center justify-center text-3xl mr-4">
          {profileData.avatar}
        </div>
        <button className="bg-[#8bb5ff] hover:bg-[#7ba3ff] text-white px-4 py-2 rounded-lg transition-colors">
          Изменить фото
        </button>
      </div>

      {/* Profile Fields */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-[#aaaaaa] mb-2">Имя</label>
          <input
            type="text"
            defaultValue={profileData.name}
            className="w-full px-4 py-3 bg-[#3a3a3a] text-white rounded-lg border border-[#4a4a4a] focus:border-[#8bb5ff] outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-[#aaaaaa] mb-2">Должность</label>
          <input
            type="text"
            defaultValue={profileData.position}
            className="w-full px-4 py-3 bg-[#3a3a3a] text-white rounded-lg border border-[#4a4a4a] focus:border-[#8bb5ff] outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-[#aaaaaa] mb-2">Департамент</label>
          <select className="w-full px-4 py-3 bg-[#3a3a3a] text-white rounded-lg border border-[#4a4a4a] focus:border-[#8bb5ff] outline-none transition-colors">
            <option>Министерство экономики</option>
            <option>Департамент финансов</option>
            <option>IT департамент</option>
            <option>Департамент кадров</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-[#aaaaaa] mb-2">Телефон</label>
          <input
            type="tel"
            defaultValue={profileData.phone}
            className="w-full px-4 py-3 bg-[#3a3a3a] text-white rounded-lg border border-[#4a4a4a] focus:border-[#8bb5ff] outline-none transition-colors"
          />
        </div>
        
        <div>
          <label className="block text-sm text-[#aaaaaa] mb-2">Email</label>
          <input
            type="email"
            defaultValue={profileData.email}
            className="w-full px-4 py-3 bg-[#3a3a3a] text-white rounded-lg border border-[#4a4a4a] focus:border-[#8bb5ff] outline-none transition-colors"
          />
        </div>
      </div>

      <button className="w-full bg-[#8bb5ff] hover:bg-[#7ba3ff] text-white py-3 rounded-lg mt-6 transition-colors">
        Сохранить изменения
      </button>
    </div>
  );

  const renderNotificationsSection = () => (
    <div className="p-6">
      <h2 className="text-xl text-white mb-6">Уведомления и звук</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Уведомления</h3>
            <p className="text-sm text-[#aaaaaa]">Получать уведомления о новых сообщениях</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#3a3a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8bb5ff]"></div>
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Звук уведомлений</h3>
            <p className="text-sm text-[#aaaaaa]">Воспроизводить звук при получении сообщений</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#3a3a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8bb5ff]"></div>
          </label>
        </div>

        <div>
          <h3 className="text-white mb-3">Тон уведомления</h3>
          <div className="space-y-2">
            {['По умолчанию', 'Классический', 'Современный', 'Тишина'].map((tone) => (
              <label key={tone} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="notification-tone"
                  defaultChecked={tone === 'По умолчанию'}
                  className="w-4 h-4 text-[#8bb5ff] bg-[#3a3a3a] border-[#4a4a4a] focus:ring-[#8bb5ff] mr-3"
                />
                <span className="text-white">{tone}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderAppearanceSection = () => (
    <div className="p-6">
      <h2 className="text-xl text-white mb-6">Оформление</h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white">Темная тема</h3>
            <p className="text-sm text-[#aaaaaa]">Использовать темное оформление</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={darkTheme}
              onChange={(e) => setDarkTheme(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[#3a3a3a] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8bb5ff]"></div>
          </label>
        </div>

        <div>
          <h3 className="text-white mb-3">Размер шрифта чата</h3>
          <div className="space-y-2">
            {['Маленький', 'Средний', 'Большой'].map((size) => (
              <label key={size} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="font-size"
                  defaultChecked={size === 'Средний'}
                  className="w-4 h-4 text-[#8bb5ff] bg-[#3a3a3a] border-[#4a4a4a] focus:ring-[#8bb5ff] mr-3"
                />
                <span className="text-white">{size}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-white mb-3">Цветовая схема</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { name: 'Синяя', color: 'bg-blue-500' },
              { name: 'Зеленая', color: 'bg-green-500' },
              { name: 'Красная', color: 'bg-red-500' },
            ].map((scheme) => (
              <button
                key={scheme.name}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  scheme.name === 'Синяя' ? 'border-[#8bb5ff]' : 'border-[#4a4a4a] hover:border-[#6a6a6a]'
                }`}
              >
                <div className={`w-8 h-8 rounded-full ${scheme.color} mx-auto mb-2`}></div>
                <span className="text-sm text-white">{scheme.name}</span>
                {scheme.name === 'Синяя' && (
                  <Check className="w-4 h-4 text-[#8bb5ff] mx-auto mt-1" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  if (currentSection) {
    return (
      <div className="h-full bg-[#212121] flex flex-col">
        <div className="bg-[#2b2b2b] p-4 border-b border-[#3a3a3a] flex items-center">
          <button
            onClick={() => setCurrentSection(null)}
            className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors mr-3"
          >
            <ChevronRight className="w-5 h-5 text-[#aaaaaa] rotate-180" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {currentSection === 'profile' && renderProfileSection()}
          {currentSection === 'notifications' && renderNotificationsSection()}
          {currentSection === 'appearance' && renderAppearanceSection()}
          {currentSection === 'privacy' && (
            <div className="p-6">
              <h2 className="text-xl text-white mb-6">Конфиденциальность</h2>
              <p className="text-[#aaaaaa]">Настройки конфиденциальности будут добавлены здесь.</p>
            </div>
          )}
          {currentSection === 'data' && (
            <div className="p-6">
              <h2 className="text-xl text-white mb-6">Данные и память</h2>
              <p className="text-[#aaaaaa]">Управление данными и кэшем будет добавлено здесь.</p>
            </div>
          )}
          {currentSection === 'language' && (
            <div className="p-6">
              <h2 className="text-xl text-white mb-6">Язык</h2>
              <div className="space-y-2">
                {['Русский', 'English', 'Français'].map((lang) => (
                  <label key={lang} className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      defaultChecked={lang === 'Русский'}
                      className="w-4 h-4 text-[#8bb5ff] bg-[#3a3a3a] border-[#4a4a4a] focus:ring-[#8bb5ff] mr-3"
                    />
                    <span className="text-white">{lang}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {currentSection === 'business' && (
            <div className="p-6">
              <h2 className="text-xl text-white mb-6">Telegram для бизнеса</h2>
              <p className="text-[#aaaaaa]">Настройки интеграции с корпоративными системами.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-[#212121] flex flex-col">
      {/* Header */}
      <div className="bg-[#2b2b2b] p-4 border-b border-[#3a3a3a]">
        <h1 className="text-xl text-white">Настройки</h1>
      </div>

      {/* Settings List */}
      <div className="flex-1 overflow-y-auto">
        {settingsItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentSection(item.id)}
            className="w-full flex items-center p-4 hover:bg-[#2a2a2a] transition-colors border-b border-[#2a2a2a]"
          >
            <div className="p-3 bg-[#3a3a3a] rounded-lg mr-4">
              <item.icon className="w-5 h-5 text-[#8bb5ff]" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="text-white">{item.title}</h3>
              <p className="text-sm text-[#aaaaaa]">{item.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#aaaaaa]" />
          </button>
        ))}
      </div>
    </div>
  );
}