export const GITHUB_REPO_STORAGE_KEY = 'luxo_github_repo_url';

export interface ProjectGithubPipelineInfo {
  workflowPath: string;
  triggerBranch: string;
  nodeVersion: string;
  installCommand: string;
  lintCommand: string;
  buildCommand: string;
  buildOutputDir: string;
  fullstackStartCommand: string;
  spaFallbackFile: string;
  license: string;
  repositorySetupSteps: {
    step: number;
    title: string;
    detail: string;
  }[];
}

export const PROJECT_GITHUB_PIPELINE: ProjectGithubPipelineInfo = {
  workflowPath: '.github/workflows/deploy-static.yml',
  triggerBranch: 'main',
  nodeVersion: '22',
  installCommand: 'npm install --no-audit --no-fund',
  lintCommand: 'npm run lint',
  buildCommand: 'npm run build',
  buildOutputDir: 'dist',
  fullstackStartCommand: 'npm start',
  spaFallbackFile: 'dist/404.html',
  license: 'MIT (Argon Code Studio)',
  repositorySetupSteps: [
    {
      step: 1,
      title: 'GitHub Deposunu Oluşturun',
      detail:
        'github.com üzerinden yeni bir Public veya Private repository açın (ör. luxo-ai).',
    },
    {
      step: 2,
      title: 'Proje Dosyalarını ve Workflow Dosyasını Yükleyin',
      detail:
        '.github/workflows/deploy-static.yml dahil tüm kaynak klasörü main dalına yükleyin veya git push yapın.',
    },
    {
      step: 3,
      title: 'GitHub Pages Kaynağını "GitHub Actions" Seçin',
      detail:
        'Depoda Settings → Pages → Source kısmını "GitHub Actions" yaptığınızda her push otomatik derlenir.',
    },
    {
      step: 4,
      title: 'Tam Sunucu (API + WebSocket) İçin Node 22 Ortamı',
      detail:
        'Backend AI proxy ve canlı ortak oda için Render/Railway üzerinde `npm run build` ardından `npm start` (node server.ts) çalıştırın.',
    },
  ],
};

export interface ParsedGithubRepo {
  valid: boolean;
  owner?: string;
  repo?: string;
  canonicalUrl?: string;
  pagesUrl?: string;
  gitCloneUrl?: string;
  error?: string;
}

const VALID_SEGMENT_RE = /^[a-zA-Z0-9._-]{1,100}$/;

export function parseAndValidateGithubRepoUrl(rawInput: string): ParsedGithubRepo {
  const trimmed = (rawInput || '').trim();
  if (!trimmed) {
    return {
      valid: false,
      error: 'Lütfen bir GitHub depo adresi girin (ör. https://github.com/kullanici/luxo-ai).',
    };
  }

  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return {
      valid: false,
      error: 'Güvenlik nedeniyle bu URL şeması desteklenmez.',
    };
  }

  let normalized = trimmed.replace(/\.git$/i, '').replace(/\/+$/, '');

  // Support shorthand "owner/repo"
  if (!/^https?:\/\//i.test(normalized) && !normalized.includes('github.com')) {
    const parts = normalized.split('/').filter(Boolean);
    if (parts.length === 2 && parts.every((p) => VALID_SEGMENT_RE.test(p))) {
      normalized = `https://github.com/${parts[0]}/${parts[1]}`;
    } else {
      return {
        valid: false,
        error: 'Geçerli bir GitHub adresi girin (ör. kullanici/depo veya https://github.com/kullanici/depo).',
      };
    }
  } else if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return {
      valid: false,
      error: 'URL biçimi geçersiz.',
    };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return {
      valid: false,
      error: 'Yalnızca HTTPS GitHub bağlantıları kabul edilir.',
    };
  }

  const host = parsed.hostname.toLowerCase();
  if (host !== 'github.com' && host !== 'www.github.com') {
    return {
      valid: false,
      error: 'Yalnızca github.com alan adına ait depo bağlantıları kaydedilebilir.',
    };
  }

  const pathSegments = parsed.pathname.split('/').filter(Boolean);
  if (pathSegments.length < 2) {
    return {
      valid: false,
      error: 'GitHub adresi kullanıcı adı ve depo adını içermelidir (github.com/kullanici/depo).',
    };
  }

  const [owner, rawRepo] = pathSegments;
  const repo = rawRepo.replace(/\.git$/i, '');
  if (!VALID_SEGMENT_RE.test(owner) || !VALID_SEGMENT_RE.test(repo)) {
    return {
      valid: false,
      error: 'Kullanıcı adı veya depo adında geçersiz karakter var.',
    };
  }

  const canonicalUrl = `https://github.com/${owner}/${repo}`;
  return {
    valid: true,
    owner,
    repo,
    canonicalUrl,
    pagesUrl: deriveGithubPagesUrl(owner, repo),
    gitCloneUrl: `${canonicalUrl}.git`,
  };
}

export function deriveGithubPagesUrl(owner: string, repo: string): string {
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim().replace(/\.git$/i, '');
  if (!cleanOwner || !cleanRepo) return '';
  if (cleanRepo.toLowerCase() === `${cleanOwner.toLowerCase()}.github.io`) {
    return `https://${cleanOwner.toLowerCase()}.github.io/`;
  }
  return `https://${cleanOwner.toLowerCase()}.github.io/${cleanRepo}/`;
}

export function buildGithubPushCommands(repoUrl?: string): string {
  const parsed = repoUrl ? parseAndValidateGithubRepoUrl(repoUrl) : null;
  const remoteTarget =
    parsed && parsed.valid && parsed.gitCloneUrl
      ? parsed.gitCloneUrl
      : 'https://github.com/KULLANICI_ADINIZ/luxo-ai.git';

  return [
    'git init',
    'git add .',
    'git commit -m "Deploy Luxo AI platform"',
    'git branch -M main',
    `git remote add origin ${remoteTarget}`,
    'git push -u origin main',
  ].join('\n');
}
