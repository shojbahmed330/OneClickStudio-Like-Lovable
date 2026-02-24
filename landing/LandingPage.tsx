
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Zap, Rocket, Smartphone, Github, ShieldCheck, Star, Layers, Cpu, Loader2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSelector from '../layout/LanguageSelector';
import { DatabaseService } from '../services/dbService';
import { Package } from '../types';

interface LandingPageProps {
  onGetStarted: () => void;
}

const IconMap: Record<string, any> = {
  'Package': Layers,
  'Rocket': Rocket,
  'Cpu': Cpu,
  'Zap': Zap,
  'Layers': Layers
};

const ColorMap: Record<string, { text: string, bg: string, btn: string }> = {
  'cyan': { text: 'text-cyan-500', bg: 'bg-cyan-500/10', btn: 'hover:bg-cyan-600' },
  'pink': { text: 'text-pink-500', bg: 'bg-pink-500/10', btn: 'hover:bg-pink-600' },
  'amber': { text: 'text-amber-500', bg: 'bg-amber-500/10', btn: 'hover:bg-amber-600' },
  'purple': { text: 'text-purple-500', bg: 'bg-purple-500/10', btn: 'hover:bg-purple-600' },
  'blue': { text: 'text-blue-500', bg: 'bg-blue-500/10', btn: 'hover:bg-blue-600' }
};

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const { t } = useLanguage();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const db = DatabaseService.getInstance();
        const data = await db.getPackages();
        setPackages(data);
      } catch (error) {
        console.error("Failed to fetch packages for landing page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  return (
    <div className="min-h-screen bg-[#09090b] text-white selection:bg-pink-500/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between px-6 md:px-12 fixed top-0 w-full z-50">
        <div className="flex items-center gap-3">
          <Sparkles className="text-pink-500" size={24}/>
          <span className="font-black text-sm uppercase tracking-[0.2em]"><span className="text-white">OneClick</span> <span className="text-pink-500">Studio</span></span>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:block">
            <LanguageSelector />
          </div>
          <button 
            onClick={onGetStarted}
            className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pink-600 hover:text-white transition-all active:scale-95"
          >
            {t('nav.login')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-pink-500/10 blur-[150px] -z-10 rounded-full"></div>
        
        <div className="max-w-5xl mx-auto text-center space-y-10 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-pink-500/10 border border-pink-500/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-pink-500">
            <Zap size={14} className="animate-pulse"/> {t('landing.hero_badge')}
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-tight md:leading-[1.1]">
            {t('landing.hero_title')} <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-[shine_5s_linear_infinite] bg-[length:200%_auto] text-center block md:inline">
              {t('landing.hero_title_accent')}
            </span>
          </h1>
          
          <p className="text-zinc-500 text-sm md:text-lg max-w-2xl mx-auto font-medium leading-relaxed uppercase tracking-widest">
            {t('landing.hero_subtitle')}
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-6">
            <button 
              onClick={onGetStarted}
              className="px-12 py-5 bg-pink-600 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-2xl shadow-pink-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              {t('landing.start_building')} <ArrowRight size={18}/>
            </button>
            <button className="px-10 py-5 bg-white/5 border border-white/10 rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-6 bg-black/20">
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter">{t('landing.features_title')}</h2>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">{t('landing.features_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-tech p-10 rounded-[3rem] border-white/5 group hover:border-pink-500/20 transition-all">
              <div className="w-16 h-16 bg-pink-500/10 rounded-3xl flex items-center justify-center text-pink-500 mb-8 group-hover:scale-110 transition-transform">
                <Cpu size={32}/>
              </div>
              <h3 className="text-xl font-black mb-4 uppercase">{t('landing.feature_1')}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">{t('landing.feature_1_desc')}</p>
            </div>

            <div className="glass-tech p-10 rounded-[3rem] border-white/5 group hover:border-pink-500/20 transition-all">
              <div className="w-16 h-16 bg-blue-500/10 rounded-3xl flex items-center justify-center text-blue-500 mb-8 group-hover:scale-110 transition-transform">
                <Rocket size={32}/>
              </div>
              <h3 className="text-xl font-black mb-4 uppercase">{t('landing.feature_2')}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">{t('landing.feature_2_desc')}</p>
            </div>

            <div className="glass-tech p-10 rounded-[3rem] border-white/5 group hover:border-pink-500/20 transition-all">
              <div className="w-16 h-16 bg-purple-500/10 rounded-3xl flex items-center justify-center text-purple-500 mb-8 group-hover:scale-110 transition-transform">
                <Github size={32}/>
              </div>
              <h3 className="text-xl font-black mb-4 uppercase">{t('landing.feature_3')}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">{t('landing.feature_3_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      <section className="py-24 px-6 relative">
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-pink-500/5 blur-[120px] -z-10 rounded-full"></div>
        <div className="max-w-6xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter">{t('landing.pricing_title')}</h2>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">{t('landing.pricing_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
             {loading ? (
                <div className="col-span-full py-20 flex flex-col items-center gap-4">
                   <Loader2 className="animate-spin text-pink-500" size={40}/>
                   <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Synchronizing Plans...</span>
                </div>
             ) : (
                packages.map((pkg, i) => {
                  const colors = ColorMap[pkg.color as keyof typeof ColorMap] || ColorMap.pink;
                  const Icon = IconMap[pkg.icon] || Layers;
                  
                  return (
                    <div key={pkg.id} className={`glass-tech p-10 rounded-[3rem] border-white/5 text-center relative group overflow-hidden transition-all hover:scale-[1.02] ${pkg.is_popular ? 'border-pink-500/30 ring-1 ring-pink-500/20 scale-105 z-10' : ''}`}>
                        {pkg.is_popular && <div className="absolute top-0 left-0 right-0 py-2 bg-pink-600 text-[8px] font-black uppercase tracking-[0.5em]">Most Popular</div>}
                        <div className={`w-14 h-14 ${colors.bg} ${colors.text} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner`}>
                          <Icon size={28}/>
                        </div>
                        <h4 className="text-xl font-black uppercase mb-2 line-clamp-1">{pkg.name}</h4>
                        <div className="text-4xl font-black mb-4 tracking-tighter">৳{pkg.price}</div>
                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-8">{pkg.tokens} Engineering Units</div>
                        <button onClick={onGetStarted} className={`w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-[10px] uppercase tracking-widest ${colors.btn} hover:text-white transition-all active:scale-95`}>Secure Buy</button>
                    </div>
                  );
                })
             )}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 px-6 bg-black/40">
        <div className="max-w-4xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-black uppercase tracking-tighter">{t('landing.reviews_title')}</h2>
            <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em]">{t('landing.reviews_subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="glass-tech p-10 rounded-[3.5rem] border-white/5 space-y-6 relative">
               <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
               </div>
               <p className="text-sm italic text-zinc-300 font-medium leading-relaxed">"{t('landing.review_1')}"</p>
               <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                  <div className="w-10 h-10 bg-pink-600 rounded-full flex items-center justify-center text-xs font-black">RH</div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wider">Rakib Hasan</div>
                    <div className="text-[8px] font-black text-zinc-600 uppercase">Independent Creator</div>
                  </div>
               </div>
            </div>

            <div className="glass-tech p-10 rounded-[3.5rem] border-white/5 space-y-6 relative">
               <div className="flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor"/>)}
               </div>
               <p className="text-sm italic text-zinc-300 font-medium leading-relaxed">"{t('landing.review_2')}"</p>
               <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-xs font-black">JS</div>
                  <div>
                    <div className="text-[10px] font-black text-white uppercase tracking-wider">Jamil Sheikh</div>
                    <div className="text-[8px] font-black text-zinc-600 uppercase">Android Developer</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center space-y-6 px-6">
         <div className="flex items-center justify-center gap-3">
          <Sparkles className="text-pink-500" size={18}/>
          <span className="font-black text-xs uppercase tracking-[0.2em] text-zinc-500">OneClick Studio • 2025</span>
        </div>
        <p className="text-[8px] font-bold text-zinc-700 uppercase tracking-[0.5em] max-w-sm mx-auto">
          AI Powered Android Hybrid Infrastructure. All rights reserved.
        </p>
      </footer>

      <style>{`
        @keyframes shine {
          to { background-position: 200% center; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
