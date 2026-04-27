export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  profileUrl: string;
  embedUrl: string;
  embedType: 'twitter-timeline' | 'iframe' | 'fallback-only';
  color: string;
  gradient: string;
  iconBg: string;
  icon: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'threads';
}

export const socialAccounts: SocialAccount[] = [
  {
    id: 'instagram',
    platform: 'Instagram',
    username: '@prefeituradecabofriooficial',
    displayName: 'Prefeitura de Cabo Frio',
    profileUrl: 'https://www.instagram.com/prefeituradecabofriooficial/',
    embedUrl: 'https://www.instagram.com/prefeituradecabofriooficial/embed/',
    embedType: 'iframe',
    color: '#E1306C',
    gradient: 'linear-gradient(135deg, #833AB4 0%, #E1306C 50%, #F77737 100%)',
    iconBg: 'bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400',
    icon: 'instagram',
  },
  {
    id: 'facebook',
    platform: 'Facebook',
    username: 'PrefeituradeCaboFrio',
    displayName: 'Prefeitura de Cabo Frio',
    profileUrl: 'https://www.facebook.com/PrefeituradeCaboFrio',
    embedUrl: 'https://www.facebook.com/plugins/page.php?href=https%3A%2F%2Fwww.facebook.com%2FPrefeituradeCaboFrio&tabs=timeline&width=500&height=700&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false',
    embedType: 'iframe',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #1877F2 0%, #42A5F5 100%)',
    iconBg: 'bg-gradient-to-br from-blue-600 to-blue-400',
    icon: 'facebook',
  },
  {
    id: 'threads',
    platform: 'Threads',
    username: '@prefeituradecabofriooficial',
    displayName: 'Prefeitura de Cabo Frio',
    profileUrl: 'https://www.threads.net/@prefeituradecabofriooficial',
    embedUrl: '',
    embedType: 'fallback-only',
    color: '#000000',
    gradient: 'linear-gradient(135deg, #000000 0%, #333333 100%)',
    iconBg: 'bg-gradient-to-br from-gray-900 to-gray-700',
    icon: 'threads',
  },
  {
    id: 'twitter',
    platform: 'X (Twitter)',
    username: '@prefcabofrio',
    displayName: 'Prefeitura de Cabo Frio',
    profileUrl: 'https://x.com/prefcabofrio',
    embedUrl: '',
    embedType: 'twitter-timeline',
    color: '#000000',
    gradient: 'linear-gradient(135deg, #14171A 0%, #657786 100%)',
    iconBg: 'bg-gradient-to-br from-gray-900 to-gray-600',
    icon: 'twitter',
  },
  {
    id: 'tiktok',
    platform: 'TikTok',
    username: '@prefeituradecabofrio',
    displayName: 'Prefeitura de Cabo Frio',
    profileUrl: 'https://www.tiktok.com/@prefeituradecabofrio',
    embedUrl: 'https://www.tiktok.com/embed/@prefeituradecabofrio',
    embedType: 'iframe',
    color: '#000000',
    gradient: 'linear-gradient(135deg, #000000 0%, #25F4EE 50%, #FE2C55 100%)',
    iconBg: 'bg-gradient-to-br from-black via-cyan-400 to-pink-500',
    icon: 'tiktok',
  },
];
