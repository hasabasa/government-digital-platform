import React, { useState } from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = "Поиск по чатам, задачам, приказам" }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className={`
        relative flex items-center transition-all duration-200
        ${isFocused ? 'transform scale-102' : ''}
      `}>
        <div className="absolute left-4 pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={`
            w-full pl-12 pr-12 py-3 bg-[#2a2a2a] text-white placeholder-gray-400 
            rounded-xl border-2 transition-all duration-200 outline-none
            ${isFocused 
              ? 'border-[#2D7DD2] bg-[#2D7DD2]/5 shadow-lg' 
              : 'border-transparent hover:border-gray-600 hover:bg-[#2D7DD2]/5'
            }
          `}
        />
        
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-4 p-1 rounded-full hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400 hover:text-white" />
          </button>
        )}
      </div>
    </form>
  );
}