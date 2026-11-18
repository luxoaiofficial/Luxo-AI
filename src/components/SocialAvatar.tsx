import React, { useEffect, useState } from 'react';
import avatarSelin from '../assets/images/avatar_architect_selin_1793636500181.jpg';
import avatarMert from '../assets/images/avatar_engineer_mert_1793636501609.jpg';
import avatarElif from '../assets/images/avatar_designer_elif_1793636503279.jpg';
import avatarKerem from '../assets/images/avatar_researcher_kerem_1793636503311.jpg';
import { computeInitials } from '../utils/socialPlatformEngine';

export interface StudioAvatarPreset {
  id: string;
  label: string;
  src: string;
}

export const STUDIO_AVATAR_PRESETS: readonly StudioAvatarPreset[] = [
  { id: 'preset:selin', label: 'Stüdyo Portre 01', src: avatarSelin },
  { id: 'preset:mert', label: 'Stüdyo Portre 02', src: avatarMert },
  { id: 'preset:elif', label: 'Stüdyo Portre 03', src: avatarElif },
  { id: 'preset:kerem', label: 'Stüdyo Portre 04', src: avatarKerem },
];

const PRESET_MAP: Record<string, string> = {
  'preset:selin': avatarSelin,
  'preset:mert': avatarMert,
  'preset:elif': avatarElif,
  'preset:kerem': avatarKerem,
};

export function resolveAvatarSrc(avatarUrl?: string): string | null {
  if (!avatarUrl) return null;
  if (avatarUrl in PRESET_MAP) {
    return PRESET_MAP[avatarUrl];
  }
  if (
    avatarUrl.startsWith('/uploads/avatars/') ||
    /^https?:\/\//i.test(avatarUrl)
  ) {
    return avatarUrl;
  }
  return null;
}

interface SocialAvatarProps {
  avatarUrl?: string;
  name: string;
  sizeClassName?: string;
  textClassName?: string;
  isOnline?: boolean;
}

export const SocialAvatar: React.FC<SocialAvatarProps> = ({
  avatarUrl,
  name,
  sizeClassName = 'w-10 h-10',
  textClassName = 'text-xs',
  isOnline,
}) => {
  const resolvedSrc = resolveAvatarSrc(avatarUrl);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [resolvedSrc]);

  const initials = computeInitials(name);

  return (
    <div className={`relative shrink-0 ${sizeClassName}`}>
      {resolvedSrc && !imgFailed ? (
        <img
          src={resolvedSrc}
          alt={`${name} profil resmi`}
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          onError={() => setImgFailed(true)}
          className="w-full h-full rounded-full object-cover border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800"
        />
      ) : (
        <div
          aria-hidden="true"
          className={`w-full h-full rounded-full bg-neutral-200 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 font-semibold flex items-center justify-center ${textClassName}`}
        >
          {initials}
        </div>
      )}
      {typeof isOnline === 'boolean' && (
        <span
          title={isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-[#18181b] ${
            isOnline ? 'bg-emerald-500' : 'bg-neutral-400 dark:bg-neutral-600'
          }`}
        />
      )}
    </div>
  );
};
