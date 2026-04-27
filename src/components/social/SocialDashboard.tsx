import React, { useState } from 'react';
import { Globe, Activity } from 'lucide-react';
import { socialAccounts } from './socialConfig';
import { SocialTab, SocialViewer } from './SocialCard';

export const SocialDashboard: React.FC = () => {
  const [activeAccount, setActiveAccount] = useState(socialAccounts[0]);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white shadow-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Redes Sociais
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-0.5">
                Monitoramento de perfis e publicações
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <Activity className="w-3.5 h-3.5 text-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              {socialAccounts.length} perfis monitorados
            </span>
          </div>
        </div>
      </div>

      {/* Platform selector tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center gap-3 overflow-x-auto pb-1">
          {socialAccounts.map((account) => (
            <SocialTab
              key={account.id}
              account={account}
              isActive={activeAccount.id === account.id}
              onClick={() => setActiveAccount(account)}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <SocialViewer key={activeAccount.id} account={activeAccount} />
      </div>
    </div>
  );
};
