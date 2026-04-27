import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { SocialAccount } from './socialConfig';

// SVG icons for each platform
export const PlatformIcon: React.FC<{ platform: SocialAccount['icon']; className?: string }> = ({ platform, className }) => {
  const iconClass = cn('w-6 h-6', className);
  
  switch (platform) {
    case 'instagram':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      );
    case 'facebook':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'twitter':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      );
    case 'threads':
      return (
        <svg className={iconClass} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.17.408-2.243 1.33-3.023.86-.727 2.063-1.146 3.475-1.21 1.094-.05 2.11.058 3.03.322-.07-.903-.345-1.593-.82-2.058-.576-.563-1.455-.853-2.61-.862h-.03c-.891.007-1.632.226-2.202.652l-1.24-1.67c.899-.667 2.07-1.02 3.431-1.035h.04c1.67.013 2.985.5 3.907 1.446.814.836 1.305 1.96 1.46 3.342.583.198 1.122.444 1.607.742 1.262.774 2.2 1.86 2.713 3.14.837 2.085.741 5.166-1.694 7.56-1.868 1.837-4.176 2.636-7.475 2.66zM11.093 17.536c.133.024.272.04.418.045.975-.053 1.685-.378 2.173-.995.376-.476.625-1.125.752-1.891-.69-.163-1.444-.245-2.252-.207-.96.044-1.706.282-2.22.669-.47.354-.668.791-.641 1.264.037.618.477.97.878 1.177l.015.008a3.37 3.37 0 00.877.33z"/>
        </svg>
      );
    default:
      return null;
  }
};

// ─── Twitter Timeline Embed ────────────────────────────────────────────────────
const TwitterTimeline: React.FC<{ username: string }> = ({ username }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);

    const loadTwitter = () => {
      if ((window as any).twttr?.widgets && containerRef.current) {
        containerRef.current.innerHTML = '';
        (window as any).twttr.widgets.createTimeline(
          { sourceType: 'profile', screenName: username.replace('@', '') },
          containerRef.current,
          {
            height: 700,
            theme: document.documentElement.classList.contains('dark') ? 'dark' : 'light',
            chrome: 'noheader nofooter noborders transparent',
            dnt: true,
          }
        ).then(() => setLoading(false))
         .catch(() => { setError(true); setLoading(false); });
        return;
      }

      // Load script if not loaded
      const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
      if (!existingScript) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        script.onload = () => setTimeout(loadTwitter, 300);
        script.onerror = () => { setError(true); setLoading(false); };
        document.head.appendChild(script);
      } else {
        // Script exists but twttr not ready yet, wait
        setTimeout(loadTwitter, 500);
      }
    };

    loadTwitter();

    // Fallback if Twitter takes too long or fails silently (e.g. adblocker)
    const timeout = setTimeout(() => {
      if (loading) {
        setError(true);
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [username]);

  if (error) {
    return (
      <IframeFallback
        profileUrl={`https://x.com/${username.replace('@', '')}`}
        platform="X"
      />
    );
  }

  return (
    <div className="relative min-h-[500px]">
      {loading && <LoadingSpinner />}
      <div ref={containerRef} />
    </div>
  );
};

// ─── Iframe Embed ──────────────────────────────────────────────────────────────
const IframeEmbed: React.FC<{
  embedUrl: string;
  profileUrl: string;
  platform: string;
}> = ({ embedUrl, profileUrl, platform }) => {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Timeout para detectar se o iframe carregou (plataformas que bloqueiam X-Frame-Options)
    const timeout = setTimeout(() => {
      if (loading) {
        setFailed(true);
        setLoading(false);
      }
    }, 8000);

    return () => clearTimeout(timeout);
  }, [loading, embedUrl]);

  const handleLoad = () => {
    setLoading(false);
    setFailed(false);
  };

  const handleError = () => {
    setFailed(true);
    setLoading(false);
  };

  if (failed) {
    return (
      <IframeFallback profileUrl={profileUrl} platform={platform} />
    );
  }

  return (
    <div className="relative w-full h-full min-h-[600px]">
      {loading && <LoadingSpinner />}
      <iframe
        ref={iframeRef}
        src={embedUrl}
        className="w-full h-full min-h-[600px] border-0 rounded-lg"
        style={{ minHeight: '600px' }}
        onLoad={handleLoad}
        onError={handleError}
        allow="encrypted-media"
        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
        title={`${platform} feed`}
      />
    </div>
  );
};

// ─── Loading Spinner ───────────────────────────────────────────────────────────
const LoadingSpinner: React.FC = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10 rounded-lg">
    <div className="flex flex-col items-center gap-3">
      <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      <span className="text-sm text-gray-500 dark:text-gray-400">Carregando publicações...</span>
    </div>
  </div>
);

// ─── Fallback when iframe is blocked ───────────────────────────────────────────
const IframeFallback: React.FC<{ profileUrl: string; platform: string }> = ({ profileUrl, platform }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
    <AlertTriangle className="w-10 h-10 text-amber-500 mb-4" />
    <p className="text-gray-700 dark:text-gray-300 font-medium text-center mb-2">
      O {platform} bloqueou a visualização embutida
    </p>
    <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-6 max-w-md">
      Essa plataforma não permite exibir o conteúdo diretamente. Clique abaixo para ver as publicações.
    </p>
    <a
      href={profileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-xl font-semibold text-sm hover:scale-105 transition-transform shadow-lg"
    >
      <ExternalLink className="w-4 h-4" />
      Abrir {platform} em nova aba
    </a>
  </div>
);

// ─── Tab button for platform selection ─────────────────────────────────────────
interface SocialTabProps {
  account: SocialAccount;
  isActive: boolean;
  onClick: () => void;
}

export const SocialTab: React.FC<SocialTabProps> = ({ account, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-300',
        'hover:scale-[1.02] hover:shadow-lg',
        'min-w-[120px]',
        isActive
          ? 'border-transparent shadow-xl scale-[1.02]'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
      )}
      style={isActive ? {
        background: account.gradient,
        borderColor: 'transparent',
      } : undefined}
    >
      <div className={cn(
        'w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300',
        isActive
          ? 'bg-white/20 text-white'
          : `${account.iconBg} text-white`
      )}>
        <PlatformIcon platform={account.icon} className="w-6 h-6" />
      </div>
      
      <span className={cn(
        'text-xs font-semibold transition-colors duration-300 text-center',
        isActive
          ? 'text-white'
          : 'text-gray-700 dark:text-gray-300'
      )}>
        {account.platform}
      </span>

      {isActive && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rounded-full shadow-md" />
      )}
    </button>
  );
};

// ─── Content viewer for selected platform ──────────────────────────────────────
interface SocialViewerProps {
  account: SocialAccount;
}

export const SocialViewer: React.FC<SocialViewerProps> = ({ account }) => {
  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Platform header bar */}
      <div
        className="flex items-center justify-between p-4 rounded-t-xl"
        style={{ background: account.gradient }}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-lg">
            <PlatformIcon platform={account.icon} className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{account.displayName}</h2>
            <p className="text-white/80 text-xs font-medium">{account.username}</p>
          </div>
        </div>

        <a
          href={account.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-xs font-semibold transition-all duration-200 hover:scale-105"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Abrir no {account.platform}
        </a>
      </div>

      {/* Content — publicações */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-b-xl border border-t-0 border-gray-200 dark:border-gray-700 overflow-auto max-h-[calc(100vh-340px)]">
        <div className="p-3">
          {account.embedType === 'twitter-timeline' ? (
            <TwitterTimeline username={account.username} />
          ) : account.embedType === 'fallback-only' ? (
            <IframeFallback profileUrl={account.profileUrl} platform={account.platform} />
          ) : (
            <IframeEmbed
              embedUrl={account.embedUrl}
              profileUrl={account.profileUrl}
              platform={account.platform}
            />
          )}
        </div>
      </div>
    </div>
  );
};
