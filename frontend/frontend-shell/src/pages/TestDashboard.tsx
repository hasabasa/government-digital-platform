import React from 'react';

export const TestDashboard: React.FC = () => {
  const handleTestClick = () => {
    alert('Кнопка работает! ✅');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🧪 Тестовая страница
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Тест кнопок */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Тест кнопок</h2>
            <div className="space-y-3">
              <button
                onClick={handleTestClick}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
              >
                Кнопка 1
              </button>
              <button
                onClick={() => alert('Кнопка 2 работает!')}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
              >
                Кнопка 2
              </button>
              <button
                onClick={() => console.log('Кнопка 3 нажата')}
                className="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
              >
                Кнопка 3 (консоль)
              </button>
            </div>
          </div>

          {/* Тест навигации */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Навигация</h2>
            <div className="space-y-2">
              <a
                href="/dashboard"
                className="block p-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                📊 Dashboard
              </a>
              <a
                href="/calls"
                className="block p-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                📞 Звонки
              </a>
              <a
                href="/chat"
                className="block p-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                💬 Чат
              </a>
              <a
                href="/groups"
                className="block p-2 bg-gray-100 hover:bg-gray-200 rounded"
              >
                👥 Группы
              </a>
            </div>
          </div>

          {/* Информация */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Статус</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>React:</span>
                <span className="text-green-600">✅ Работает</span>
              </div>
              <div className="flex justify-between">
                <span>TailwindCSS:</span>
                <span className="text-green-600">✅ Работает</span>
              </div>
              <div className="flex justify-between">
                <span>JavaScript:</span>
                <span className="text-green-600">✅ Работает</span>
              </div>
              <div className="flex justify-between">
                <span>События:</span>
                <span className="text-green-600">✅ Работают</span>
              </div>
            </div>
          </div>
        </div>

        {/* Интерактивный счетчик */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
          <TestCounter />
        </div>
      </div>
    </div>
  );
};

const TestCounter: React.FC = () => {
  const [count, setCount] = React.useState(0);

  return (
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Интерактивный счетчик</h2>
      <div className="text-4xl font-bold text-blue-600 mb-4">{count}</div>
      <div className="space-x-4">
        <button
          onClick={() => setCount(count - 1)}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
        >
          -1
        </button>
        <button
          onClick={() => setCount(0)}
          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Сброс
        </button>
        <button
          onClick={() => setCount(count + 1)}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          +1
        </button>
      </div>
    </div>
  );
};
