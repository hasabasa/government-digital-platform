import React, { useState, useRef } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuthStore } from '../stores/auth.store';
import { apiService } from '../services/api.service';
import {
  Camera,
  Save,
  Loader2,
  Mail,
  Phone,
  Briefcase,
  FileText,
  MessageCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage: React.FC = () => {
  const { user, setAuth, token, refreshToken } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    position: user?.position || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    statusMessage: user?.statusMessage || '',
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await apiService.updateUserProfile(form);
      const updatedUser = response.data || response;

      if (user && token && refreshToken) {
        setAuth({ ...user, ...updatedUser }, token, refreshToken);
      }

      setIsEditing(false);
      toast.success('Профиль обновлён');
    } catch {
      toast.error('Ошибка сохранения профиля');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Максимальный размер 5 МБ');
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const { avatarUrl } = await apiService.uploadAvatar(file);

      if (user && token && refreshToken) {
        setAuth({ ...user, avatar: avatarUrl }, token, refreshToken);
      }

      toast.success('Аватар обновлён');
    } catch {
      toast.error('Ошибка загрузки аватара');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const initials = `${user?.firstName?.[0] || 'C'}${user?.lastName?.[0] || 'U'}`;

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-[#0e1621]">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold text-white mb-6">Профиль</h1>

          {/* Avatar section */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative group">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
              <button
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-sm text-[#6c7883]">{user?.position || 'Без должности'}</p>
              {user?.statusMessage && (
                <p className="text-xs text-[#3a73b8] mt-1">{user.statusMessage}</p>
              )}
            </div>
          </div>

          {/* Info / Edit form */}
          <div className="bg-[#17212b] border border-[#232e3c] rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-white">Информация</h3>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-[#3a73b8] hover:underline"
                >
                  Редактировать
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-[#6c7883] hover:text-white"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-1 text-xs text-[#3a73b8] hover:underline disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Сохранить
                  </button>
                </div>
              )}
            </div>

            {/* Fields */}
            <Field
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={user?.email || ''}
              disabled
            />
            <Field
              icon={<span className="text-sm font-medium w-4 text-center">И</span>}
              label="Имя"
              value={form.firstName}
              editing={isEditing}
              onChange={(v) => handleChange('firstName', v)}
            />
            <Field
              icon={<span className="text-sm font-medium w-4 text-center">Ф</span>}
              label="Фамилия"
              value={form.lastName}
              editing={isEditing}
              onChange={(v) => handleChange('lastName', v)}
            />
            <Field
              icon={<Briefcase className="w-4 h-4" />}
              label="Должность"
              value={form.position}
              editing={isEditing}
              onChange={(v) => handleChange('position', v)}
            />
            <Field
              icon={<Phone className="w-4 h-4" />}
              label="Телефон"
              value={form.phone}
              editing={isEditing}
              onChange={(v) => handleChange('phone', v)}
              placeholder="+7 (___) ___-__-__"
            />
            <Field
              icon={<MessageCircle className="w-4 h-4" />}
              label="Статус"
              value={form.statusMessage}
              editing={isEditing}
              onChange={(v) => handleChange('statusMessage', v)}
              placeholder="Чем занимаетесь?"
            />
            <Field
              icon={<FileText className="w-4 h-4" />}
              label="О себе"
              value={form.bio}
              editing={isEditing}
              onChange={(v) => handleChange('bio', v)}
              multiline
              placeholder="Расскажите о себе..."
            />
          </div>

          {/* Role info */}
          <div className="mt-4 bg-[#17212b] border border-[#232e3c] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-white mb-3">Системная информация</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Роль</span>
                <span className="text-white capitalize">{user?.role || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6c7883]">Организация</span>
                <span className="text-white">{user?.organization || '—'}</span>
              </div>
              {user?.lastLoginAt && (
                <div className="flex justify-between">
                  <span className="text-[#6c7883]">Последний вход</span>
                  <span className="text-white">
                    {new Date(user.lastLoginAt).toLocaleString('ru-RU')}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

// Reusable field component
const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  editing?: boolean;
  disabled?: boolean;
  multiline?: boolean;
  placeholder?: string;
  onChange?: (value: string) => void;
}> = ({ icon, label, value, editing, disabled, multiline, placeholder, onChange }) => (
  <div className="flex items-start gap-3">
    <div className="text-[#6c7883] mt-2.5 flex-shrink-0">{icon}</div>
    <div className="flex-1">
      <p className="text-[10px] uppercase text-[#6c7883] tracking-wider mb-1">{label}</p>
      {editing && !disabled ? (
        multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-[#0e1621] border border-[#232e3c] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8] resize-none"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-[#0e1621] border border-[#232e3c] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#6c7883] focus:outline-none focus:border-[#3a73b8]"
          />
        )
      ) : (
        <p className="text-sm text-white py-1.5">{value || <span className="text-[#6c7883]">—</span>}</p>
      )}
    </div>
  </div>
);

export default ProfilePage;
