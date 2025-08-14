import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { 
  Heart, 
  MessageCircle, 
  Share, 
  MoreHorizontal,
  Camera,
  Smile,
  MapPin,
  Users,
  Calendar,
  Briefcase
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../stores/auth.store';
import toast from 'react-hot-toast';

interface Post {
  id: string;
  author: {
    name: string;
    position: string;
    organization: string;
    avatar?: string;
  };
  content: string;
  image?: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  tags?: string[];
}

const FeedPage: React.FC = () => {
  const { user } = useAuthStore();
  const [newPost, setNewPost] = useState('');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Иван Иванов',
        position: 'Начальник IT отдела',
        organization: 'Министерство цифрового развития',
      },
      content: 'Рады сообщить о запуске новой цифровой платформы для госслужащих! 🚀 Теперь мы можем эффективнее взаимодействовать и делиться опытом.',
      timestamp: '2 часа назад',
      likes: 24,
      comments: 8,
      shares: 3,
      isLiked: false,
      tags: ['цифровизация', 'инновации'],
    },
    {
      id: '2',
      author: {
        name: 'Мария Петрова',
        position: 'Специалист по кадрам',
        organization: 'Министерство труда',
      },
      content: 'Сегодня провели отличный семинар по повышению квалификации! Обучение - это основа профессионального роста. 📚✨',
      image: '/api/placeholder/400/300',
      timestamp: '4 часа назад',
      likes: 18,
      comments: 12,
      shares: 5,
      isLiked: true,
      tags: ['обучение', 'развитие'],
    },
    {
      id: '3',
      author: {
        name: 'Алексей Сидоров',
        position: 'Аналитик',
        organization: 'Министерство экономики',
      },
      content: 'Анализ показал значительное улучшение эффективности работы благодаря внедрению новых процессов. Данные говорят сами за себя! 📈',
      timestamp: '6 часов назад',
      likes: 31,
      comments: 15,
      shares: 8,
      isLiked: false,
      tags: ['аналитика', 'эффективность'],
    },
  ]);

  const handleCreatePost = () => {
    if (!newPost.trim()) {
      toast.error('Напишите что-нибудь!');
      return;
    }

    const post: Post = {
      id: Date.now().toString(),
      author: {
        name: user?.fullName || 'Вы',
        position: user?.position || 'Сотрудник',
        organization: user?.organization || 'Ваша организация',
      },
      content: newPost,
      timestamp: 'только что',
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
    };

    setPosts([post, ...posts]);
    setNewPost('');
    toast.success('Пост опубликован!');
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleComment = (postId: string) => {
    toast.info('Комментарии в разработке');
  };

  const handleShare = (postId: string) => {
    toast.success('Пост расшарен!');
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto p-6">
        {/* Create Post */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.firstName?.charAt(0) || 'А'}
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Что нового в работе? Поделитесь успехами!"
                className="w-full p-3 border-none resize-none focus:ring-0 bg-gray-50 dark:bg-gray-700 rounded-lg placeholder-gray-500 dark:placeholder-gray-400"
                rows={3}
              />
              <div className="flex items-center justify-between mt-4">
                <div className="flex space-x-4">
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors">
                    <Camera className="w-5 h-5" />
                    <span className="text-sm">Фото</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">Место</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-500 hover:text-yellow-500 transition-colors">
                    <Smile className="w-5 h-5" />
                    <span className="text-sm">Настроение</span>
                  </button>
                </div>
                <Button 
                  onClick={handleCreatePost}
                  disabled={!newPost.trim()}
                  size="sm"
                >
                  Опубликовать
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Post Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {post.author.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {post.author.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {post.author.position} • {post.author.organization}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {post.timestamp}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Post Content */}
              <div className="px-6 pb-4">
                <p className="text-gray-900 dark:text-white leading-relaxed">
                  {post.content}
                </p>
                
                {/* Tags */}
                {post.tags && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {post.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Post Image */}
              {post.image && (
                <div className="px-6 pb-4">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64 flex items-center justify-center">
                    <span className="text-gray-500 dark:text-gray-400">📸 Изображение</span>
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{post.likes} лайков</span>
                  <div className="flex space-x-4">
                    <span>{post.comments} комментариев</span>
                    <span>{post.shares} репостов</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-around">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      post.isLiked
                        ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span>Нравится</span>
                  </button>
                  
                  <button
                    onClick={() => handleComment(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span>Комментировать</span>
                  </button>
                  
                  <button
                    onClick={() => handleShare(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Share className="w-5 h-5" />
                    <span>Поделиться</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="secondary">
            Загрузить ещё
          </Button>
        </div>

        {/* Trending Topics */}
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Актуальные темы
          </h3>
          <div className="flex flex-wrap gap-2">
            {['цифровизация', 'эффективность', 'обучение', 'инновации', 'развитие', 'аналитика'].map((topic) => (
              <button
                key={topic}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                #{topic}
              </button>
            ))}
          </div>
        </div>

        {/* Suggested Connections */}
        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Рекомендуемые коллеги
          </h3>
          <div className="space-y-3">
            {[
              { name: 'Анна Козлова', position: 'Аналитик данных', org: 'Минэкономики' },
              { name: 'Петр Николаев', position: 'Project Manager', org: 'Минцифры' },
            ].map((person, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {person.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {person.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {person.position} • {person.org}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="secondary">
                  Добавить
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default FeedPage;
