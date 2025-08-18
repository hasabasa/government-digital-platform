import React, { useState } from 'react';
import { ChevronDown, Heart, MessageCircle, Share, Bookmark, MoreVertical, Plus, Pin, Send, Reply } from 'lucide-react';

interface NewsFeedScreenProps {
  userRole: string;
  searchQuery?: string;
}

interface Comment {
  id: number;
  author: string;
  role: string;
  content: string;
  time: string;
  likes: number;
  isLiked: boolean;
  replies?: Comment[];
}

interface Post {
  id: number;
  author: string;
  role: string;
  time: string;
  content: string;
  likes: number;
  comments: Comment[];
  shares: number;
  avatar: string;
  type: string;
  attachments?: string[];
  isPinned?: boolean;
  isLiked: boolean;
}

export default function NewsFeedScreen({ userRole, searchQuery = '' }: NewsFeedScreenProps) {
  const [filterType, setFilterType] = useState('Все');
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      author: 'Министерство экономики',
      role: 'Официальный канал',
      time: '2 часа назад',
      content: 'Принят новый бюджет на 2025 год. Основные направления финансирования включают социальные программы, инфраструктурные проекты и цифровизацию государственных услуг.',
      likes: 245,
      comments: [
        {
          id: 1,
          author: 'Петров А.И.',
          role: 'Начальник департамента',
          content: 'Отличные новости! Когда ожидается утверждение конкретных статей расходов?',
          time: '1 час назад',
          likes: 12,
          isLiked: false,
          replies: [
            {
              id: 11,
              author: 'Министерство экономики',
              role: 'Официальный канал',
              content: 'Детализация будет представлена в течение недели',
              time: '45 мин назад',
              likes: 8,
              isLiked: false,
            }
          ]
        },
        {
          id: 2,
          author: 'Иванова М.С.',
          role: 'Сотрудник',
          content: 'Какая доля выделена на цифровизацию?',
          time: '30 мин назад',
          likes: 5,
          isLiked: true,
        }
      ],
      shares: 12,
      avatar: '🏛️',
      type: 'Министерство',
      attachments: ['📄 Бюджет_2025.pdf', '📊 Презентация.pptx'],
      isPinned: true,
      isLiked: true,
    },
    {
      id: 2,
      author: 'Департамент цифрового развития',
      role: 'Департамент',
      time: '4 часа назад',
      content: 'Запущена новая платформа для цифрового документооборота. Все сотрудники должны пройти обучение до 20 декабря.',
      likes: 89,
      comments: [
        {
          id: 3,
          author: 'Козлов И.П.',
          role: 'Начальник отдела',
          content: 'Где можно записаться на обучение?',
          time: '2 часа назад',
          likes: 3,
          isLiked: false,
        }
      ],
      shares: 8,
      avatar: '💻',
      type: 'Департамент',
      attachments: ['📋 Инструкция_пользователя.pdf'],
      isLiked: false,
    }
  ]);

  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [newComments, setNewComments] = useState<Record<number, string>>({});
  const [replyingTo, setReplyingTo] = useState<{ postId: number; commentId: number } | null>(null);
  const [newReplies, setNewReplies] = useState<Record<string, string>>({});

  const filterOptions = ['Все', 'Министерство', 'Департамент', 'Канал'];

  const canCreatePosts = () => {
    return ['minister', 'department_head'].includes(userRole);
  };

  const filteredPosts = posts.filter(post => {
    const matchesFilter = filterType === 'Все' || post.type === filterType;
    const matchesSearch = searchQuery === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleLikePost = (postId: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
          isLiked: !post.isLiked
        };
      }
      return post;
    }));
  };

  const handleLikeComment = (postId: number, commentId: number, isReply = false, parentCommentId?: number) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments.map(comment => {
          if (isReply && comment.id === parentCommentId && comment.replies) {
            return {
              ...comment,
              replies: comment.replies.map(reply => {
                if (reply.id === commentId) {
                  return {
                    ...reply,
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                    isLiked: !reply.isLiked
                  };
                }
                return reply;
              })
            };
          } else if (!isReply && comment.id === commentId) {
            return {
              ...comment,
              likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
              isLiked: !comment.isLiked
            };
          }
          return comment;
        });
        return { ...post, comments: updatedComments };
      }
      return post;
    }));
  };

  const handleAddComment = (postId: number) => {
    const commentText = newComments[postId];
    if (!commentText?.trim()) return;

    const newComment: Comment = {
      id: Date.now(),
      author: 'Вы',
      role: 'Пользователь',
      content: commentText,
      time: 'только что',
      likes: 0,
      isLiked: false,
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    }));

    setNewComments({ ...newComments, [postId]: '' });
  };

  const handleAddReply = (postId: number, commentId: number) => {
    const replyKey = `${postId}-${commentId}`;
    const replyText = newReplies[replyKey];
    if (!replyText?.trim()) return;

    const newReply: Comment = {
      id: Date.now(),
      author: 'Вы',
      role: 'Пользователь',
      content: replyText,
      time: 'только что',
      likes: 0,
      isLiked: false,
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        });
        return { ...post, comments: updatedComments };
      }
      return post;
    }));

    setNewReplies({ ...newReplies, [replyKey]: '' });
    setReplyingTo(null);
  };

  const toggleComments = (postId: number) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId);
    } else {
      newExpanded.add(postId);
    }
    setExpandedComments(newExpanded);
  };

  return (
    <div className="h-full bg-[#1a1a1a] flex flex-col">
      {/* Header */}
      <div className="bg-[#2a2a2a] p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Лента новостей</h1>
          {canCreatePosts() && (
            <button className="bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-200 hover:transform hover:scale-105 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Создать пост
            </button>
          )}
        </div>
        
        {/* Filter Dropdown */}
        <div className="relative">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-gray-700 text-white border border-gray-600 rounded-xl px-4 py-2 pr-10 appearance-none cursor-pointer hover:bg-gray-600 transition-colors"
          >
            {filterOptions.map((option) => (
              <option key={option} value={option} className="bg-gray-700">
                {option}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredPosts.map((post) => (
          <div key={post.id} className="bg-[#2a2a2a] rounded-2xl p-6 mb-6 border border-gray-700 hover:border-[#2D7DD2]/30 transition-all duration-200">
            {/* Post Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-r from-[#2D7DD2] to-[#1e5a9e] flex items-center justify-center text-2xl mr-4">
                  {post.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-white font-bold">{post.author}</h3>
                    {post.isPinned && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#F4A261] rounded-full">
                        <Pin className="w-3 h-3 text-white" />
                        <span className="text-xs text-white font-medium">Закреплено</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-400">{post.role}</p>
                  <p className="text-xs text-gray-500">{post.time}</p>
                </div>
              </div>
              <button className="p-2 rounded-xl hover:bg-gray-700 transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Post Content */}
            <div className="mb-6">
              <p className="text-white mb-4 leading-relaxed">{post.content}</p>
              
              {/* Attachments */}
              {post.attachments && (
                <div className="space-y-3">
                  {post.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-700/30 rounded-xl hover:bg-gray-700/50 cursor-pointer transition-colors">
                      <span className="text-gray-300">{attachment}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-700 mb-4">
              <div className="flex items-center gap-8">
                <button 
                  onClick={() => handleLikePost(post.id)}
                  className={`flex items-center gap-2 transition-colors group ${
                    post.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : 'group-hover:fill-current'}`} />
                  <span>{post.likes}</span>
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-[#2D7DD2] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{post.comments.length}</span>
                </button>
                <button className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                  <Share className="w-5 h-5" />
                  <span>{post.shares}</span>
                </button>
              </div>
              <button className="p-2 rounded-xl hover:bg-gray-700 transition-colors">
                <Bookmark className="w-5 h-5 text-gray-400 hover:text-[#F4A261]" />
              </button>
            </div>

            {/* Comments Section */}
            {expandedComments.has(post.id) && (
              <div className="border-t border-gray-700 pt-4">
                {/* Add Comment */}
                <div className="flex gap-3 mb-4">
                  <div className="w-8 h-8 bg-[#2D7DD2] rounded-full flex items-center justify-center text-white text-sm font-medium">
                    Я
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={newComments[post.id] || ''}
                      onChange={(e) => setNewComments({ ...newComments, [post.id]: e.target.value })}
                      placeholder="Написать комментарий..."
                      className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-xl border border-gray-600 focus:border-[#2D7DD2] outline-none transition-all"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="p-2 bg-[#2D7DD2] rounded-xl hover:bg-[#1e5a9e] transition-colors"
                    >
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                        {comment.author.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-gray-700/50 rounded-xl p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium text-sm">{comment.author}</span>
                            <span className="text-gray-400 text-xs">{comment.role}</span>
                            <span className="text-gray-500 text-xs">{comment.time}</span>
                          </div>
                          <p className="text-gray-200 text-sm">{comment.content}</p>
                        </div>
                        
                        {/* Comment Actions */}
                        <div className="flex items-center gap-4 mt-2">
                          <button
                            onClick={() => handleLikeComment(post.id, comment.id)}
                            className={`flex items-center gap-1 text-xs transition-colors ${
                              comment.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                            }`}
                          >
                            <Heart className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                            <span>{comment.likes}</span>
                          </button>
                          <button
                            onClick={() => setReplyingTo({ postId: post.id, commentId: comment.id })}
                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#2D7DD2] transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                            <span>Ответить</span>
                          </button>
                        </div>

                        {/* Reply Input */}
                        {replyingTo?.postId === post.id && replyingTo?.commentId === comment.id && (
                          <div className="flex gap-2 mt-3">
                            <input
                              type="text"
                              value={newReplies[`${post.id}-${comment.id}`] || ''}
                              onChange={(e) => setNewReplies({ 
                                ...newReplies, 
                                [`${post.id}-${comment.id}`]: e.target.value 
                              })}
                              placeholder="Написать ответ..."
                              className="flex-1 px-3 py-1 text-sm bg-gray-600 text-white rounded-lg border border-gray-500 focus:border-[#2D7DD2] outline-none transition-all"
                              onKeyPress={(e) => e.key === 'Enter' && handleAddReply(post.id, comment.id)}
                            />
                            <button
                              onClick={() => handleAddReply(post.id, comment.id)}
                              className="p-1 bg-[#2D7DD2] rounded-lg hover:bg-[#1e5a9e] transition-colors"
                            >
                              <Send className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}

                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-2 ml-4 border-l-2 border-gray-600 pl-4">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="flex gap-2">
                                <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs">
                                  {reply.author.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-600/50 rounded-lg p-2">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-white font-medium text-xs">{reply.author}</span>
                                      <span className="text-gray-400 text-xs">{reply.role}</span>
                                      <span className="text-gray-500 text-xs">{reply.time}</span>
                                    </div>
                                    <p className="text-gray-200 text-xs">{reply.content}</p>
                                  </div>
                                  <button
                                    onClick={() => handleLikeComment(post.id, reply.id, true, comment.id)}
                                    className={`flex items-center gap-1 text-xs mt-1 transition-colors ${
                                      reply.isLiked ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                                    }`}
                                  >
                                    <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                    <span>{reply.likes}</span>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}

        {filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-700 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <MessageCircle className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl text-gray-400 mb-2">Нет постов</h3>
            <p className="text-gray-500">
              {searchQuery ? 'По вашему запросу ничего не найдено' : 'В выбранной категории нет постов'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}