import React, { useState } from 'react';
import { CheckCircle2, Globe2 } from 'lucide-react';

const LANGUAGES = [
  { id: 'en', name: 'English', native: 'English' },
  { id: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { id: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { id: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { id: 'te', name: 'Telugu', native: 'తెలుగు' },
  { id: 'mr', name: 'Marathi', native: 'मराठी' },
  { id: 'ml', name: 'Malayalam', native: 'മലയാളം' },
];

export default function LanguageSelectionScreen({ onLanguageSelect }) {
  const [selected, setSelected] = useState('en');

  const handleContinue = () => {
    // Pass the selected language code back to the parent to store it
    onLanguageSelect(selected);
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-100" 
        style={{ backgroundImage: 'url("/new_lang_bg.jpg")' }}
      ></div>
      
      {/* Light Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-white/10 z-10 backdrop-blur-[2px]" />

      <div className="w-full max-w-md px-5 pt-8 z-20 flex flex-col h-[100dvh] justify-between">
        
        {/* Header */}
        <div className="mt-8 mb-8 sm:mt-2 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Select Language
          </h1>
          <p className="text-gray-800 text-sm mt-2 font-bold">
            Please choose your preferred language.
          </p>
        </div>

        {/* Language Cards Scrollable List */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {LANGUAGES.map((item) => {
            const isSelected = selected === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelected(item.id)}
                className={`w-full relative overflow-hidden rounded-2xl transition-all duration-300 text-left backdrop-blur-xl border ${
                  isSelected 
                    ? 'border-blue-400/50 shadow-[0_8px_30px_rgb(59,130,246,0.2)] ring-1 ring-blue-400 bg-white/30' 
                    : 'border-white/30 shadow-[0_4px_20px_rgb(0,0,0,0.05)] hover:border-white/60 hover:shadow-[0_8px_30px_rgb(0,0,0,0.1)] bg-white/10 hover:bg-white/20'
                }`}
              >
                {/* Content Layer */}
                <div className="relative z-10 px-5 py-4 flex items-center justify-between">
                  <div>
                    <h3 className={`text-[19px] font-bold tracking-tight transition-colors duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                      {item.native}
                    </h3>
                    <p className={`text-sm font-bold mt-1 transition-colors duration-300 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)] ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                      {item.name}
                    </p>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sticky Continue Button */}
        <div className="mt-4 pt-4 pb-12 sm:pb-8 relative z-30">
          <button
            onClick={handleContinue}
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-[17px] shadow-[0_8px_30px_rgb(59,130,246,0.3)] hover:shadow-[0_8px_30px_rgb(59,130,246,0.5)] transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
          >
            Continue
          </button>
        </div>
        
      </div>
    </div>
  );
}
