export interface AnalyticsReport {
  totalPageViews: number;
  uniqueVisitors: number;
  avgSessionDurationSeconds: number;
  bounceRatePercent: number;
  conversionRatePercent: number;
  trafficSources: { source: string; percentage: number; visits: number }[];
  dailyViews: { date: string; views: number }[];
}

export interface CmsSiteConfig {
  cmsPlatform: 'WordPress' | 'Joomla' | 'Drupal' | 'Luxo CMS Engine';
  siteName: string;
  dbStatus: 'Connected (MySQL / Firestore)' | 'Syncing';
  postsCount: number;
  mediaCount: number;
  videosCount: number;
  restApiEndpoint: string;
}

export interface SpeedOptimizationStatus {
  mobileResponsive: boolean;
  coreWebVitalsScore: number; // 0-100
  imageCompressionSavedPercent: number;
  browserCacheEnabled: boolean;
  cleanCodeScore: number;
}

export function generateDefaultAnalyticsReport(): AnalyticsReport {
  return {
    totalPageViews: 142850,
    uniqueVisitors: 48920,
    avgSessionDurationSeconds: 264, // 4m 24s
    bounceRatePercent: 24.8,
    conversionRatePercent: 8.6,
    trafficSources: [
      { source: 'Google Arama (SEO)', percentage: 54, visits: 77139 },
      { source: 'Direkt Ziyaret', percentage: 26, visits: 37141 },
      { source: 'Yapay Zeka Yönlendirmeleri', percentage: 12, visits: 17142 },
      { source: 'Sosyal Medya & Topluluk', percentage: 8, visits: 11428 },
    ],
    dailyViews: [
      { date: 'Pzt', views: 18400 },
      { date: 'Sal', views: 21200 },
      { date: 'Çar', views: 19800 },
      { date: 'Per', views: 24500 },
      { date: 'Cum', views: 26900 },
      { date: 'Cmt', views: 17100 },
      { date: 'Paz', views: 14950 },
    ],
  };
}

export function getDefaultCmsConfig(): CmsSiteConfig {
  return {
    cmsPlatform: 'WordPress',
    siteName: 'Luxo AI Enterprise Hub',
    dbStatus: 'Connected (MySQL / Firestore)',
    postsCount: 142,
    mediaCount: 389,
    videosCount: 24,
    restApiEndpoint: 'https://api.luxo-ai.internal/wp-json/v2',
  };
}

export function getDefaultSpeedOptimization(): SpeedOptimizationStatus {
  return {
    mobileResponsive: true,
    coreWebVitalsScore: 99,
    imageCompressionSavedPercent: 44.5,
    browserCacheEnabled: true,
    cleanCodeScore: 100,
  };
}
