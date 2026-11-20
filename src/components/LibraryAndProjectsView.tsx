import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  Code,
  FileText,
  Folder,
  Globe,
  Image as ImageIcon,
  Plus,
  Search,
  Star,
  X,
} from 'lucide-react';
import { LibraryItem, LuxoProject } from '../types/luxo';
import { QuickSocialShareButtons } from './SocialShareBar';
import { ContentRatingAndComments } from './ContentRatingAndComments';

interface LibraryViewProps {
  onBack: () => void;
  items: LibraryItem[];
  onAddItem: (item: Omit<LibraryItem, 'id' | 'createdAt'>) => void;
  onToggleFavorite: (id: string) => void;
  onSelectItemForChat: (title: string, content: string) => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  onBack,
  items,
  onAddItem,
  onToggleFavorite,
  onSelectItemForChat,
}) => {
  const [activeTab, setActiveTab] = useState<
    'Önerilenler' | 'Favoriler' | 'Klasörler' | 'Kaydedilenler'
  >('Önerilenler');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSummary, setNewSummary] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<LibraryItem['type']>('document');

  const filtered = items.filter((item) => {
    const matchesTab =
      activeTab === 'Önerilenler'
        ? true
        : activeTab === 'Favoriler'
        ? !!item.isFavorite || item.tab === 'Favoriler'
        : item.tab === activeTab;
    const matchesQuery =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesQuery;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddItem({
      title: newTitle.trim(),
      summary: newSummary.trim() || 'Kullanıcı tarafından eklenen bilgi kaydı.',
      content: newContent.trim() || newSummary.trim() || newTitle.trim(),
      type: newType,
      tab: activeTab === 'Klasörler' ? 'Klasörler' : 'Kaydedilenler',
      isFavorite: activeTab === 'Favoriler',
    });
    setNewTitle('');
    setNewSummary('');
    setNewContent('');
    setShowCreateModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 select-none">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold">Kitaplık & Bilgi Merkezi</h2>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Öğe</span>
        </button>
      </header>

      <div className="flex items-center gap-2 px-4 pt-4 pb-2 shrink-0 overflow-x-auto">
        {(['Önerilenler', 'Favoriler', 'Klasörler', 'Kaydedilenler'] as const).map(
          (tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab
                  ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-white font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
              }`}
            >
              {tab}
            </button>
          )
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="relative flex flex-col justify-between p-4 rounded-3xl min-h-[176px] bg-white dark:bg-[#202123] border border-neutral-200/80 dark:border-neutral-800 shadow-xs hover:border-neutral-400 dark:hover:border-neutral-600 transition cursor-pointer group gap-2"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-bold text-neutral-900 dark:text-white truncate">
                    {item.title}
                  </span>
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <QuickSocialShareButtons
                      compact
                      showMoreModal={false}
                      payload={{
                        title: item.title,
                        excerpt: item.summary || item.content,
                        contentType: 'library',
                        badge: 'LUXO KİTAPLIK · BİLGİ KAYDI',
                      }}
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(item.id);
                      }}
                      className="p-1 text-neutral-400 hover:text-amber-500 transition cursor-pointer shrink-0"
                      aria-label={`Favori: ${item.title}`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          item.isFavorite ? 'text-amber-500 fill-current' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-800/70"
              >
                <ContentRatingAndComments
                  compact
                  contentKey={`library:${item.id}`}
                  contentTitle={item.title}
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    {item.type === 'web' && <Globe className="w-4 h-4 text-blue-500" />}
                    {item.type === 'image' && <ImageIcon className="w-4 h-4 text-pink-500" />}
                    {item.type === 'document' && <FileText className="w-4 h-4 text-emerald-500" />}
                    {item.type === 'folder' && <Folder className="w-4 h-4 text-amber-500" />}
                    {item.type === 'code' && <Code className="w-4 h-4 text-purple-500" />}
                    <span>{item.createdAt}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 cursor-pointer"
                  >
                    İncele →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 bg-white dark:bg-[#18181b] border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-2.5 bg-neutral-100 dark:bg-[#202123] rounded-full border border-neutral-200 dark:border-neutral-700">
            <Search className="w-4 h-4 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kitaplıkta ara..."
              className="flex-1 bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-hidden"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
            aria-label="Yeni Ekle"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {selectedItem && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedItem(null);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <div className="w-full max-w-lg bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                {selectedItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {selectedItem.summary}
            </p>
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-[#18181b] text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto">
              {selectedItem.content}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <QuickSocialShareButtons
                payload={{
                  title: selectedItem.title,
                  excerpt: selectedItem.summary || selectedItem.content,
                  contentType: 'library',
                  badge: 'LUXO KİTAPLIK · BİLGİ KAYDI',
                }}
              />
              <button
                type="button"
                onClick={() => {
                  onSelectItemForChat(selectedItem.title, selectedItem.content);
                  setSelectedItem(null);
                }}
                className="px-4 py-2.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Sohbette Kullan ve Analiz Et
              </button>
            </div>
            <ContentRatingAndComments
              contentKey={`library:${selectedItem.id}`}
              contentTitle={selectedItem.title}
            />
          </div>
        </div>
      )}

      {showCreateModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Kitaplığa Yeni Kayıt Ekle</h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Başlık (Örn: Mikroservis Güvenlik Notları)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none"
            />
            <input
              type="text"
              value={newSummary}
              onChange={(e) => setNewSummary(e.target.value)}
              placeholder="Kısa açıklama..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as LibraryItem['type'])}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none"
            >
              <option value="document">Doküman / Not</option>
              <option value="code">Kod Parçacığı</option>
              <option value="web">Web Kaynağı</option>
              <option value="folder">Klasör</option>
            </select>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="İçerik veya kod..."
              rows={4}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none resize-none"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold cursor-pointer"
            >
              Kitaplığa Kaydet
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

interface ProjectsViewProps {
  onBack: () => void;
  projects: LuxoProject[];
  activeProjectId: string | null;
  onSelectProject: (project: LuxoProject) => void;
  onCreateProject: (proj: Omit<LuxoProject, 'id' | 'updatedAt' | 'filesCount'>) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onBack,
  projects,
  activeProjectId,
  onSelectProject,
  onCreateProject,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [category, setCategory] = useState<LuxoProject['category']>('Yazılım');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreateProject({
      name: name.trim(),
      description: description.trim() || 'Özel proje çalışma alanı.',
      systemPrompt:
        systemPrompt.trim() ||
        'Bu proje kapsamındaki tüm sorulara yapılandırılmış ve teknik düzeyde yanıt ver.',
      category,
      color: '#2563eb',
    });
    setName('');
    setDescription('');
    setSystemPrompt('');
    setShowNewModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] dark:bg-[#18181b] text-neutral-900 dark:text-neutral-100 select-none">
      <header className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Geri Dön"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold">Projeler & Çalışma Alanları</h2>
        <button
          type="button"
          onClick={() => setShowNewModal(true)}
          className="px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Yeni Proje</span>
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-4xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold mb-1">Aktif Proje Çalışma Alanları</h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Her proje kendi özel sistem talimatlarına ve bağlam belleğine sahiptir.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((proj) => {
            const isSelected = activeProjectId === proj.id;
            return (
              <div
                key={proj.id}
                className={`p-5 rounded-3xl bg-white dark:bg-[#202123] border transition flex flex-col justify-between gap-4 ${
                  isSelected
                    ? 'border-blue-500 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <Folder
                        className="w-5 h-5 shrink-0"
                        style={{ color: proj.color }}
                      />
                      <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                        {proj.name}
                      </h3>
                    </div>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">
                      {proj.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-3">
                    {proj.description}
                  </p>
                  <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-[#18181b] border border-neutral-200/60 dark:border-neutral-800 text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-200">
                      Proje Talimatı:{' '}
                    </span>
                    {proj.systemPrompt}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs text-neutral-400 tabular-nums">
                    {proj.filesCount} Bağlam Kaynağı
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectProject(proj)}
                    className="px-4 py-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{isSelected ? 'Aktif Proje (Sohbete Git)' : 'Projeyi Seç & Başlat'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNewModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowNewModal(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
        >
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-white dark:bg-[#202123] rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-700 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Yeni Proje Çalışma Alanı</h3>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="p-1 text-neutral-400 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Proje adı (Örn: FinTech Mobil Uygulama)"
              required
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none"
            />
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as LuxoProject['category'])
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none"
            >
              <option value="Yazılım">Yazılım</option>
              <option value="Araştırma">Araştırma</option>
              <option value="Tasarım">Tasarım</option>
              <option value="İş & Strateji">İş & Strateji</option>
            </select>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Proje özeti..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none"
            />
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              placeholder="Bu projedeki sohbetler için özel sistem talimatı..."
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-sm outline-none resize-none"
            />
            <button
              type="submit"
              className="w-full py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold cursor-pointer"
            >
              Projeyi Oluştur
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
