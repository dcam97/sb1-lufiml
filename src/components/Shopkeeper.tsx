import React, { useState, useEffect, useRef } from 'react';
import { Store, Loader2, X, Leaf, Zap, Sparkles, TreePine, Lock } from 'lucide-react';
import { useShopkeeper } from '../hooks/useShopkeeper';
import { shopItems } from '../data/shopItems';
import type { ShopItem } from '../types';

const IconMap = {
  Leaf,
  Zap,
  Sparkles,
  TreePine
};

interface ShopkeeperProps {
  apiKey: string;
  onClose: () => void;
  oxygen: number;
  onPurchase: (item: ShopItem) => void;
  highestOxygenReached: number;
  hasTilledPlots: boolean;
}

export function Shopkeeper({ 
  apiKey, 
  onClose, 
  oxygen, 
  onPurchase, 
  highestOxygenReached,
  hasTilledPlots 
}: ShopkeeperProps) {
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string }>>([]);
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'shop'>('shop');
  const { chat, loading, error } = useShopkeeper(apiKey);
  const initialMessageSent = useRef(false);

  useEffect(() => {
    if (!initialMessageSent.current) {
      initialMessageSent.current = true;
      const getGreeting = async () => {
        const response = await chat("Greet the player and briefly mention what you sell");
        if (response) {
          setMessages([{ role: 'assistant', content: response }]);
        }
      };
      getGreeting();
    }
  }, [chat]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    const response = await chat(userMessage);
    if (response) {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    }
  };

  const handlePurchase = (item: ShopItem) => {
    if (item.type === 'seed' && !hasTilledPlots) {
      alert('No tilled plots available! Till some land first by clicking empty plots 30 times.');
      return;
    }
    
    if (oxygen >= item.price && highestOxygenReached >= item.unlockThreshold) {
      onPurchase(item);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-emerald-900/95 rounded-xl w-full max-w-4xl p-4 shadow-xl border border-emerald-700/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-bold text-emerald-100">Mystical Tree Shop</h2>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-emerald-200">
              Available Oxygen: {oxygen}
            </div>
            <button 
              onClick={onClose}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setActiveTab('shop')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'shop'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            Shop
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'chat'
                ? 'bg-emerald-700 text-white'
                : 'bg-emerald-800/50 text-emerald-200 hover:bg-emerald-700/50'
            }`}
          >
            Chat with Shopkeeper
          </button>
        </div>

        {activeTab === 'shop' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[600px] overflow-y-auto p-4">
            {shopItems.map((item) => {
              const Icon = IconMap[item.icon as keyof typeof IconMap];
              const isUnlocked = highestOxygenReached >= item.unlockThreshold;
              const canAfford = oxygen >= item.price;

              return (
                <div
                  key={item.id}
                  className={`bg-emerald-800/30 rounded-lg p-4 border transition-colors ${
                    isUnlocked 
                      ? 'border-emerald-700/30 hover:border-emerald-600/50' 
                      : 'border-red-700/30 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      isUnlocked ? 'bg-emerald-700/30' : 'bg-red-900/30'
                    }`}>
                      {isUnlocked ? (
                        <Icon className="w-6 h-6 text-emerald-400" />
                      ) : (
                        <Lock className="w-6 h-6 text-red-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-emerald-200">{item.name}</h3>
                      <p className="text-sm text-emerald-300/70 mb-3">
                        {isUnlocked 
                          ? item.description
                          : `Unlocks at ${item.unlockThreshold} oxygen`
                        }
                      </p>
                      <button
                        onClick={() => handlePurchase(item)}
                        disabled={!isUnlocked || !canAfford}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          isUnlocked && canAfford
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-emerald-800/50 text-emerald-400/50 cursor-not-allowed'
                        }`}
                      >
                        {isUnlocked ? `Buy for ${item.price} oxygen` : 'Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="h-96 overflow-y-auto mb-4 space-y-4 p-4 bg-emerald-950/50 rounded-lg">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-emerald-700/50 text-emerald-100'
                        : 'bg-emerald-800/50 text-emerald-200'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-emerald-800/50 p-3 rounded-lg">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                  </div>
                </div>
              )}
              {error && (
                <div className="text-red-400 text-sm text-center">{error}</div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about trees and items..."
                className="flex-1 bg-emerald-950/50 border border-emerald-700/50 rounded-lg px-4 py-2 text-emerald-100 placeholder-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-emerald-900 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}