import React, { useState } from 'react';
import { Search, ArrowLeft, MessageCircle, Phone, MoreVertical, Users } from 'lucide-react';

interface ContactsScreenProps {
  onBackToChats: () => void;
}

export default function ContactsScreen({ onBackToChats }: ContactsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const contacts = [
    {
      id: 1,
      name: 'Иванов Иван Иванович',
      position: 'Министр экономики',
      department: 'Министерство экономики',
      phone: '+7 (495) 123-45-67',
      email: 'ivanov@gov.ru',
      isOnline: true,
      avatar: '👨‍💼',
      role: 'minister',
    },
    {
      id: 2,
      name: 'Петрова Анна Сергеевна',
      position: 'Заместитель министра',
      department: 'Министерство экономики',
      phone: '+7 (495) 123-45-68',
      email: 'petrova@gov.ru',
      isOnline: true,
      avatar: '👩‍💼',
      role: 'deputy_minister',
    },
    {
      id: 3,
      name: 'Сидоров Петр Михайлович',
      position: 'Начальник департамента финансов',
      department: 'Департамент финансов',
      phone: '+7 (495) 123-45-69',
      email: 'sidorov@gov.ru',
      isOnline: false,
      avatar: '💼',
      role: 'department_head',
    },
    {
      id: 4,
      name: 'Козлова Елена Александровна',
      position: 'Начальник отдела кадров',
      department: 'Департамент кадров',
      phone: '+7 (495) 123-45-70',
      email: 'kozlova@gov.ru',
      isOnline: true,
      avatar: '👥',
      role: 'division_head',
    },
    {
      id: 5,
      name: 'Морозов Алексей Владимирович',
      position: 'Ведущий специалист',
      department: 'IT департамент',
      phone: '+7 (495) 123-45-71',
      email: 'morozov@gov.ru',
      isOnline: false,
      avatar: '💻',
      role: 'specialist',
    },
    {
      id: 6,
      name: 'Федорова Мария Николаевна',
      position: 'Главный экономист',
      department: 'Экономический департамент',
      phone: '+7 (495) 123-45-72',
      email: 'fedorova@gov.ru',
      isOnline: true,
      avatar: '📊',
      role: 'specialist',
    },
  ];

  const roleColors = {
    minister: 'text-red-400',
    deputy_minister: 'text-orange-400',
    department_head: 'text-blue-400',
    division_head: 'text-green-400',
    specialist: 'text-[#aaaaaa]',
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedContacts = filteredContacts.reduce((groups, contact) => {
    const department = contact.department;
    if (!groups[department]) {
      groups[department] = [];
    }
    groups[department].push(contact);
    return groups;
  }, {} as Record<string, typeof contacts>);

  return (
    <div className="h-full bg-[#212121] flex flex-col">
      {/* Header */}
      <div className="bg-[#2b2b2b] p-4 border-b border-[#3a3a3a]">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={onBackToChats}
            className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#aaaaaa]" />
          </button>
          <h1 className="text-xl text-white">Контакты</h1>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#888888]" />
          <input
            type="text"
            placeholder="Поиск контактов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#3a3a3a] text-white placeholder-[#888888] rounded-lg border-none outline-none focus:bg-[#4a4a4a] transition-colors"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedContacts).map(([department, departmentContacts]) => (
          <div key={department}>
            {/* Department Header */}
            <div className="sticky top-0 bg-[#2b2b2b] px-4 py-2 border-b border-[#3a3a3a]">
              <h2 className="text-sm text-[#8bb5ff] flex items-center gap-2">
                <Users className="w-4 h-4" />
                {department} ({departmentContacts.length})
              </h2>
            </div>

            {/* Department Contacts */}
            {departmentContacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center p-4 hover:bg-[#2a2a2a] cursor-pointer border-b border-[#2a2a2a] transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-[#4a4a4a] flex items-center justify-center text-xl">
                    {contact.avatar}
                  </div>
                  {contact.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#212121]"></div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="ml-3 flex-1 min-w-0">
                  <h3 className="text-white truncate">{contact.name}</h3>
                  <p className={`text-sm truncate ${roleColors[contact.role as keyof typeof roleColors]}`}>
                    {contact.position}
                  </p>
                  <p className="text-xs text-[#888888] truncate">{contact.phone}</p>
                  <p className="text-xs text-[#888888] truncate">{contact.email}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-3">
                  <button className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors" title="Сообщение">
                    <MessageCircle className="w-4 h-4 text-[#aaaaaa]" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors" title="Позвонить">
                    <Phone className="w-4 h-4 text-[#aaaaaa]" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-[#3a3a3a] transition-colors">
                    <MoreVertical className="w-4 h-4 text-[#aaaaaa]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}

        {filteredContacts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-[#aaaaaa] text-lg">Контакты не найдены</p>
            <p className="text-[#888888] text-sm mt-2">Попробуйте изменить критерии поиска</p>
          </div>
        )}
      </div>
    </div>
  );
}