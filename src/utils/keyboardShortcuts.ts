export interface KeyboardShortcutEntry {
  id: string;
  category:
    | 'Genel ve Gezinme'
    | 'Sohbet ve Üretim'
    | 'Araçlar ve Görünüm';
  keys: string[];
  title: string;
  description: string;
}

export const KEYBOARD_SHORTCUT_GROUPS: {
  category: KeyboardShortcutEntry['category'];
  subtitle: string;
  items: KeyboardShortcutEntry[];
}[] = [
  {
    category: 'Genel ve Gezinme',
    subtitle: 'Uygulama genelinde hızlı geçiş ve arama komutları',
    items: [
      {
        id: 'shortcut-command-palette',
        category: 'Genel ve Gezinme',
        keys: ['Ctrl / ⌘', 'K'],
        title: 'Gelişmiş Arama ve Komut Paleti',
        description:
          'Modeller, geçmiş sohbetler, kitaplık öğeleri ve görünümler arasında anında geçiş yapın.',
      },
      {
        id: 'shortcut-help-modal',
        category: 'Genel ve Gezinme',
        keys: ['Ctrl / ⌘', '/'],
        title: 'Klavye Kısayollarını Göster',
        description:
          'Metin alanı dışındayken "?" tuşuyla da bu kısayol rehberini açabilirsiniz.',
      },
      {
        id: 'shortcut-toggle-sidebar',
        category: 'Genel ve Gezinme',
        keys: ['Ctrl / ⌘', 'B'],
        title: 'Kenar Çubuğunu Aç / Kapat',
        description:
          'Sohbet geçmişi, global arama ve stüdyo kısayollarını içeren yan menüyü değiştirin.',
      },
      {
        id: 'shortcut-open-settings',
        category: 'Genel ve Gezinme',
        keys: ['Ctrl / ⌘', ','],
        title: 'Ayarlar ve Model Tercihleri',
        description:
          'Doğrudan Ayarlar ekranına geçerek model, tema ve güvenlik tercihlerini düzenleyin.',
      },
      {
        id: 'shortcut-escape',
        category: 'Genel ve Gezinme',
        keys: ['Esc'],
        title: 'Açık Pencereyi Kapat',
        description:
          'Aktif açılır pencereleri, komut paletini veya yan menüyü hızla kapatır.',
      },
    ],
  },
  {
    category: 'Sohbet ve Üretim',
    subtitle: 'Mesaj yazma, yeni sohbet ve dışa aktarım akışı',
    items: [
      {
        id: 'shortcut-send-message',
        category: 'Sohbet ve Üretim',
        keys: ['Enter'],
        title: 'Mesajı Gönder',
        description:
          'Sohbet giriş kutusunda yazarken mesajınızı seçili yapay zeka modeline iletir.',
      },
      {
        id: 'shortcut-new-line',
        category: 'Sohbet ve Üretim',
        keys: ['Shift', 'Enter'],
        title: 'Yeni Satır Ekle',
        description:
          'Mesajı göndermeden çok satırlı istem, liste veya kod bloğu düzenleyin.',
      },
      {
        id: 'shortcut-new-chat',
        category: 'Sohbet ve Üretim',
        keys: ['Ctrl / ⌘', 'Shift', 'O'],
        title: 'Yeni Sohbet Başlat',
        description:
          'Mevcut akışı koruyarak temiz bir yapay zeka sohbet oturumu başlatır.',
      },
      {
        id: 'shortcut-export-pdf',
        category: 'Sohbet ve Üretim',
        keys: ['Ctrl / ⌘', 'Shift', 'E'],
        title: 'Sohbeti PDF Olarak Dışa Aktar',
        description:
          'Aktif konuşmayı formatlı, çok sayfalı PDF belgesi olarak indirir.',
      },
      {
        id: 'shortcut-recall-last',
        category: 'Sohbet ve Üretim',
        keys: ['↑'],
        title: 'Son Gönderilen İstemi Geri Çağır',
        description:
          'Sohbet kutusu boşken yukarı yön tuşuyla son mesajınızı düzenlemek üzere yükler.',
      },
    ],
  },
  {
    category: 'Araçlar ve Görünüm',
    subtitle: 'Kontrol paneli, tema, ses ve topluluk modülleri',
    items: [
      {
        id: 'shortcut-dashboard',
        category: 'Araçlar ve Görünüm',
        keys: ['Alt', 'D'],
        title: 'Kişisel Kontrol Paneli (Dashboard)',
        description:
          'Model performans metrikleri, gecikme grafikleri ve sabitlenen alanları açar.',
      },
      {
        id: 'shortcut-theme-toggle',
        category: 'Araçlar ve Görünüm',
        keys: ['Alt', 'T'],
        title: 'Açık / Koyu Tema Geçişi',
        description:
          'Gündüz ve gece renk teması arasında tek tuşla geçiş yapar.',
      },
      {
        id: 'shortcut-hub-seo',
        category: 'Araçlar ve Görünüm',
        keys: ['Alt', 'S'],
        title: 'Topluluk, SEO ve Performans Merkezi',
        description:
          'Canlı denetim, blog, anketler ve forum sekmesini açar.',
      },
      {
        id: 'shortcut-voice-cmd',
        category: 'Araçlar ve Görünüm',
        keys: ['Alt', 'M'],
        title: 'Sesli Komut Modu',
        description:
          'Eller serbest gezinme ve konuşma için sesli komut penceresini başlatır.',
      },
    ],
  },
];

export function filterKeyboardShortcutGroups(rawQuery: string) {
  const q = (rawQuery || '').trim().toLocaleLowerCase('tr-TR');
  if (!q) return KEYBOARD_SHORTCUT_GROUPS;

  return KEYBOARD_SHORTCUT_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.category,
        ...item.keys,
      ]
        .join(' ')
        .toLocaleLowerCase('tr-TR');
      return haystack.includes(q);
    }),
  })).filter((g) => g.items.length > 0);
}
