import React, { useState } from 'react';
import { X, Sparkles, Check, User, Shirt, Scissors, Glasses, Save } from 'lucide-react';
import { api } from '../lib/api.ts';

interface CharacterCustomizerModalProps {
  initialConfig?: {
    skin_tone?: number;
    hair_style?: string;
    hair_color?: string;
    uniform_style?: string;
    accessory?: string;
  };
  onSave: (customization: any) => void;
  onClose: () => void;
}

export const CharacterCustomizerModal: React.FC<CharacterCustomizerModalProps> = ({
  initialConfig,
  onSave,
  onClose,
}) => {
  const [skinTone, setSkinTone] = useState<number>(initialConfig?.skin_tone ?? 1);
  const [hairStyle, setHairStyle] = useState<string>(initialConfig?.hair_style || 'fade');
  const [hairColor, setHairColor] = useState<string>(initialConfig?.hair_color || '#171717');
  const [uniformStyle, setUniformStyle] = useState<string>(initialConfig?.uniform_style || 'school');
  const [accessory, setAccessory] = useState<string>(initialConfig?.accessory || 'none');
  const [saving, setSaving] = useState(false);

  const skinToneOptions = [
    { id: 0, label: 'Deep Espresso', hex: '#3e2723' },
    { id: 1, label: 'Warm Chestnut', hex: '#5c3818' },
    { id: 2, label: 'Rich Umber', hex: '#8d5524' },
    { id: 3, label: 'Golden Bronze', hex: '#c68642' },
  ];

  const hairStyleOptions = [
    { id: 'fade', label: 'Clean Fade / Short', desc: 'Sharp low-taper fade' },
    { id: 'locs', label: 'Braided Locs', desc: 'Flowing natural locs' },
    { id: 'puff', label: 'Afro Puff Crown', desc: 'Textured natural volume' },
    { id: 'parted', label: 'Neat Part', desc: 'Classic academy side taper' },
  ];

  const hairColorOptions = [
    { id: '#171717', label: 'Jet Black', hex: '#171717' },
    { id: '#262626', label: 'Charcoal', hex: '#262626' },
    { id: '#451a03', label: 'Dark Umber', hex: '#451a03' },
    { id: '#78350f', label: 'Auburn Bronze', hex: '#78350f' },
  ];

  const uniformOptions = [
    { id: 'school', label: 'Official School Blazer', hex: '#065f46', desc: 'Gold crest with emerald wool' },
    { id: 'navy', label: 'Royal Navy Blazer', hex: '#1e3a8a', desc: 'Oxford navy with brass trim' },
    { id: 'crimson', label: 'Crimson Honors Blazer', hex: '#831843', desc: 'Ceremonial maroon with gold buttons' },
    { id: 'amber', label: 'Heritage Amber Blazer', hex: '#b45309', desc: 'Warm ochre with black lapels' },
  ];

  const accessoryOptions = [
    { id: 'none', label: 'Standard Uniform' },
    { id: 'glasses', label: 'Scholar Wire-Frames' },
    { id: 'watch', label: 'Gold Chrono Watch' },
  ];

  const handleSave = async () => {
    setSaving(true);
    const updated = {
      skin_tone: skinTone,
      hair_style: hairStyle,
      hair_color: hairColor,
      uniform_style: uniformStyle,
      accessory,
    };
    try {
      await api.updateCustomization(updated);
      onSave(updated);
      onClose();
    } catch (err) {
      console.error('Failed to save customization:', err);
    } finally {
      setSaving(false);
    }
  };

  const currentSkinHex = skinToneOptions.find((s) => s.id === skinTone)?.hex || '#8d5524';
  const currentUniformHex = uniformOptions.find((u) => u.id === uniformStyle)?.hex || '#065f46';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-amber-500/20 via-sky-500/10 to-indigo-500/20 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Campus Wardrobe & Avatar Customizer
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-6">
          {/* Avatar Live Preview Badge */}
          <div className="flex items-center justify-center p-4 rounded-xl bg-slate-950/70 border border-slate-800 gap-6">
            {/* Pixel Art Silhouette Preview */}
            <div className="relative flex flex-col items-center">
              <div
                className="w-14 h-14 rounded-full border-2 border-slate-700 flex items-center justify-center shadow-lg transition-colors relative"
                style={{ backgroundColor: currentSkinHex }}
              >
                {/* Hair indicator */}
                <div
                  className="absolute -top-1 w-12 h-6 rounded-t-full transition-all"
                  style={{
                    backgroundColor: hairColor,
                    borderRadius: hairStyle === 'puff' ? '50% 50% 20% 20%' : '14px 14px 4px 4px',
                    transform: hairStyle === 'puff' ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
                {/* Eyes & Glasses */}
                <div className="flex gap-2 z-10 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                </div>
                {accessory === 'glasses' && (
                  <div className="absolute top-6 w-9 h-3.5 border border-amber-400 rounded-sm z-20 pointer-events-none" />
                )}
              </div>
              {/* Torso Blazer */}
              <div
                className="w-16 h-8 rounded-b-lg mt-1 border-t-2 border-amber-400/40 shadow-md flex items-center justify-center text-[9px] font-mono font-bold text-amber-300"
                style={{ backgroundColor: currentUniformHex }}
              >
                ★
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white">Your Campus Scholar Appearance</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Reflected on all peer screens and in-world campus interactions.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-400/10 text-amber-400 border border-amber-400/20 font-semibold">
                  {hairStyleOptions.find((h) => h.id === hairStyle)?.label}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sky-400/10 text-sky-400 border border-sky-400/20 font-semibold">
                  {uniformOptions.find((u) => u.id === uniformStyle)?.label}
                </span>
              </div>
            </div>
          </div>

          {/* 1. Skin Tone Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-amber-400" /> Complexion & Skin Tone
            </label>
            <div className="grid grid-cols-4 gap-2">
              {skinToneOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSkinTone(opt.id)}
                  className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    skinTone === opt.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-md ring-1 ring-amber-400'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-full shadow-inner border border-white/20"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <span className="text-[10px] font-medium text-slate-300 text-center leading-tight">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Hairstyle Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-sky-400" /> Hairstyle & Natural Crown
            </label>
            <div className="grid grid-cols-2 gap-2">
              {hairStyleOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setHairStyle(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    hairStyle === opt.id
                      ? 'border-sky-400 bg-sky-400/10 shadow-md ring-1 ring-sky-400'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    {opt.label}
                    {hairStyle === opt.id && <Check className="h-3.5 w-3.5 text-sky-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Hair Color */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              Hair Shade
            </label>
            <div className="flex gap-2">
              {hairColorOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setHairColor(opt.id)}
                  className={`flex-1 p-2 rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                    hairColor === opt.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-md'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: opt.hex }}
                  />
                  <span className="text-[10px] font-medium text-slate-300">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 4. Academy Uniform Blazer */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Shirt className="h-3.5 w-3.5 text-emerald-400" /> Academy Uniform Blazer
            </label>
            <div className="grid grid-cols-2 gap-2">
              {uniformOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setUniformStyle(opt.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    uniformStyle === opt.id
                      ? 'border-emerald-400 bg-emerald-400/10 shadow-md ring-1 ring-emerald-400'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white/30"
                      style={{ backgroundColor: opt.hex }}
                    />
                    <span className="text-xs font-bold text-white">{opt.label}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Accessories */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Glasses className="h-3.5 w-3.5 text-amber-400" /> Scholar Accessories
            </label>
            <div className="grid grid-cols-3 gap-2">
              {accessoryOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setAccessory(opt.id)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    accessory === opt.id
                      ? 'border-amber-400 bg-amber-400/10 shadow-md'
                      : 'border-slate-800 bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-200 block">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-[0.98]"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? 'Updating Style...' : 'Save & Wear Style'}
          </button>
        </div>
      </div>
    </div>
  );
};
