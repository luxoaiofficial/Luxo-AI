import type { AppView, LuxoModelId } from '../types/luxo.ts';
import { LUXO_MODEL_IDS, LUXO_MODELS } from './luxoLogic.ts';

export type VoiceCommandAction =
  | {
      type: 'switch_theme';
      theme: 'dark' | 'light' | 'toggle';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'new_project';
      projectName?: string;
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'navigate';
      targetView: AppView;
      hubTab?: 'content-studio' | 'seo' | 'blog-polls';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'open_model_metrics';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'open_cms';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'new_chat';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'select_model';
      modelId: LuxoModelId;
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'open_auth';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'sign_out';
      confidence: number;
      feedbackTr: string;
    }
  | {
      type: 'chat_prompt';
      prompt: string;
      confidence: number;
      feedbackTr: string;
    };

export interface SampleVoiceCommandItem {
  label: string;
  command: string;
  category: 'Görünüm' | 'Gezinme' | 'Çalışma Alanı' | 'Model';
}

export const SAMPLE_VOICE_COMMANDS: SampleVoiceCommandItem[] = [
  {
    label: 'Switch to Dark Mode',
    command: 'Switch to Dark Mode',
    category: 'Görünüm',
  },
  {
    label: 'Açık Temaya Geç',
    command: 'Switch to Light Mode',
    category: 'Görünüm',
  },
  {
    label: 'Start a new project',
    command: 'Start a new project',
    category: 'Çalışma Alanı',
  },
  {
    label: 'Show me my library',
    command: 'Show me my library',
    category: 'Gezinme',
  },
  {
    label: 'Kişisel Paneli Aç',
    command: 'Open dashboard',
    category: 'Gezinme',
  },
  {
    label: 'Model Metriklerini Göster',
    command: 'Show model performance metrics',
    category: 'Model',
  },
  {
    label: 'İçerik / Blog CMS Aç',
    command: 'Open CMS content manager',
    category: 'Çalışma Alanı',
  },
  {
    label: 'Gemini 4 Hydrogen Seç',
    command: 'Select Gemini 4 Hydrogen',
    category: 'Model',
  },
];

function normalizeSpeechText(raw: string): string {
  return (raw || '')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[.,!?;:"'()[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function parseVoiceCommand(rawInput: string): VoiceCommandAction {
  const original = (rawInput || '').trim();
  const norm = normalizeSpeechText(original);

  if (!norm) {
    return {
      type: 'chat_prompt',
      prompt: '',
      confidence: 0,
      feedbackTr: 'Komut algılanamadı. Lütfen tekrar konuşun veya bir komut yazın.',
    };
  }

  // 1. Theme switches
  if (
    /(dark mode|dark theme|karanlik mod\w*|koyu tema\w*|koyu mod\w*|gece mod\w*|switch to dark)/.test(
      norm
    )
  ) {
    return {
      type: 'switch_theme',
      theme: 'dark',
      confidence: 0.98,
      feedbackTr: 'Koyu tema (Dark Mode) etkinleştirildi.',
    };
  }
  if (
    /(light mode|light theme|acik tema\w*|acik mod\w*|gunduz mod\w*|aydinlik tema\w*|switch to light)/.test(
      norm
    )
  ) {
    return {
      type: 'switch_theme',
      theme: 'light',
      confidence: 0.98,
      feedbackTr: 'Açık tema (Light Mode) etkinleştirildi.',
    };
  }
  if (/(toggle theme|tema\w* degistir)/.test(norm)) {
    return {
      type: 'switch_theme',
      theme: 'toggle',
      confidence: 0.93,
      feedbackTr: 'Tema görünümü değiştirildi.',
    };
  }

  // 2. New project / project creation
  const namedProjectMatch = original.match(
    /(?:called|named|adinda|ismi|adi)\s+["']?([^"'.!?]{2,60})["']?/i
  );
  if (
    /(start a new project|start new project|new project|create a project|create project|yeni (?:bir )?proje\w*|proje baslat\w*|proje olustur\w*)/.test(
      norm
    )
  ) {
    const projectName = namedProjectMatch?.[1]?.trim();
    return {
      type: 'new_project',
      ...(projectName ? { projectName } : {}),
      confidence: 0.96,
      feedbackTr: projectName
        ? `"${projectName}" proje çalışma alanı oluşturuluyor.`
        : 'Yeni proje çalışma alanı açılıyor.',
    };
  }

  // 3. New chat
  if (
    /(new chat|start a new chat|start new chat|yeni (?:bir )?sohbet\w*|sohbet baslat\w*|temiz sohbet\w*)/.test(
      norm
    )
  ) {
    return {
      type: 'new_chat',
      confidence: 0.96,
      feedbackTr: 'Yeni bir AI sohbeti başlatıldı.',
    };
  }

  // 4. Library navigation
  if (
    /(my library|show library|open library|kitapli\w*|kaydedilenler\w*|\blibrary\b)/.test(
      norm
    )
  ) {
    return {
      type: 'navigate',
      targetView: 'library',
      confidence: 0.97,
      feedbackTr: 'Kitaplık & Bilgi Merkezi açılıyor.',
    };
  }

  // 5. Projects navigation
  if (
    /(my projects|show projects|open projects|projeleri\w*|proje alani\w*)/.test(
      norm
    )
  ) {
    return {
      type: 'navigate',
      targetView: 'projects',
      confidence: 0.95,
      feedbackTr: 'Projeler & Çalışma Alanları açılıyor.',
    };
  }

  // 6. Model Performance Metrics
  if (
    /(model metrics|model performance|performance metrics|compare costs|model maliyet\w*|model gecikme\w*|model performans\w*|model metrik\w*)/.test(
      norm
    )
  ) {
    return {
      type: 'open_model_metrics',
      confidence: 0.96,
      feedbackTr: 'Tüm 113 AI modeli için Performans, Gecikme ve Maliyet paneli açılıyor.',
    };
  }

  // 7. CMS / Blog Content Manager
  if (
    /(open cms|\bcms\b|blog yonetim\w*|icerik yonetim\w*|icerik studyo\w*|content studio|blog yazi\w*|new blog post|makale yayinla\w*)/.test(
      norm
    )
  ) {
    return {
      type: 'open_cms',
      confidence: 0.95,
      feedbackTr: 'İçerik & Blog Yönetim Sistemi (CMS) açılıyor.',
    };
  }

  // 8. Personal Dashboard
  if (
    /(dashboard|personal dashboard|home panel|kisisel panel\w*|ozet panel\w*|kontrol panel\w*|ana panel\w*)/.test(
      norm
    )
  ) {
    return {
      type: 'navigate',
      targetView: 'dashboard',
      confidence: 0.96,
      feedbackTr: 'Kişisel Kontrol Paneli (Dashboard) açılıyor.',
    };
  }

  // 9. Other views
  if (
    /(code studio|argon studio|argon kod\w*|kod studyo\w*)/.test(norm)
  ) {
    return {
      type: 'navigate',
      targetView: 'studio',
      confidence: 0.95,
      feedbackTr: 'Argon Kod Stüdyosu açılıyor.',
    };
  }
  if (
    /(image studio|video studio|nano banana|veo studio|gorsel studyo\w*|video studyo\w*)/.test(
      norm
    )
  ) {
    return {
      type: 'navigate',
      targetView: 'images',
      confidence: 0.95,
      feedbackTr: 'Nano Banana & Google Veo Medya Stüdyosu açılıyor.',
    };
  }
  if (/(evolution|otonom gelisim\w*|oz gelisim\w*|evrim merkez\w*)/.test(norm)) {
    return {
      type: 'navigate',
      targetView: 'evolution',
      confidence: 0.95,
      feedbackTr: 'Otonom Gelişim & AI Evrim Merkezi açılıyor.',
    };
  }
  if (/(calendar|social|takvim\w*|etkinlik\w*|sosyal ag\w*)/.test(norm)) {
    return {
      type: 'navigate',
      targetView: 'social',
      confidence: 0.94,
      feedbackTr: 'Etkinlik Takvimi & Sosyal Ağ açılıyor.',
    };
  }
  if (/(settings|preferences|ayarla\w*|tercihler\w*|profil ayar\w*)/.test(norm)) {
    return {
      type: 'navigate',
      targetView: 'settings',
      confidence: 0.95,
      feedbackTr: 'Ayarlar & Profil ekranı açılıyor.',
    };
  }

  // 10. Auth & Sign out
  if (/(sign out|log out|cikis yap\w*|oturumu kapat\w*)/.test(norm)) {
    return {
      type: 'sign_out',
      confidence: 0.95,
      feedbackTr: 'Güvenli çıkış işlemi başlatılıyor.',
    };
  }
  if (/(sign in|log in|login|register|giris yap\w*|kayit ol\w*|oturum ac\w*)/.test(norm)) {
    return {
      type: 'open_auth',
      confidence: 0.94,
      feedbackTr: 'Güvenli oturum ve hesap penceresi açılıyor.',
    };
  }

  // 11. Model switching (checks explicit selection verbs OR strong model match)
  const hasModelVerb =
    /\b(select|switch to|use|choose|activate|sec|kullan|gec|ac)\b/.test(norm);
  let matchedModelId: LuxoModelId | null = null;
  let bestScore = 0;

  for (const id of LUXO_MODEL_IDS) {
    const model = LUXO_MODELS[id];
    const normName = normalizeSpeechText(model.name);
    const normId = normalizeSpeechText(id.replace(/-/g, ' '));
    if (norm === normName || norm === normId) {
      matchedModelId = id;
      bestScore = 100;
      break;
    }
    if (norm.includes(normName) && normName.length > bestScore) {
      bestScore = normName.length;
      matchedModelId = id;
    } else if (norm.includes(normId) && normId.length > bestScore) {
      bestScore = normId.length;
      matchedModelId = id;
    }
  }

  if (matchedModelId && (hasModelVerb || bestScore >= 10)) {
    return {
      type: 'select_model',
      modelId: matchedModelId,
      confidence: 0.92,
      feedbackTr: `Aktif yapay zeka modeli ${LUXO_MODELS[matchedModelId].name} olarak değiştirildi.`,
    };
  }

  // 12. Fallback to sending as AI chat prompt
  return {
    type: 'chat_prompt',
    prompt: original,
    confidence: 0.65,
    feedbackTr: `Komut AI sohbet istemi olarak gönderiliyor: "${original.slice(0, 60)}"`,
  };
}
