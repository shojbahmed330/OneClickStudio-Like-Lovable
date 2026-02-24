
import React, { useState } from 'react';
import { 
  ArrowLeft, Book, Github, Zap, Smartphone, 
  Key, Rocket, Code, HelpCircle, ChevronRight,
  ExternalLink, ShieldCheck, PlayCircle, Database, Lock, Settings, Cpu, RefreshCw, MessageSquare, Wand2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface HelpCenterViewProps {
  onBack: () => void;
}

const HelpCenterView: React.FC<HelpCenterViewProps> = ({ onBack }) => {
  const [activeTopic, setActiveTopic] = useState<'basics' | 'engineering' | 'github' | 'build'>('basics');
  const { t, language } = useLanguage();

  const guides = {
    basics: [
      { 
        title: language === 'bn' ? "কিভাবে শুরু করবেন?" : "How to Start?", 
        desc: language === 'bn' ? "ডানদিকের চ্যাটবক্সে আপনার অ্যাপের আইডিয়া লিখুন। AI স্বয়ংক্রিয়ভাবে কোড লিখে প্রজেক্ট তৈরি করে দেবে।" : "Describe your app idea in the chatbox. AI will automatically generate code and build the project.",
        icon: MessageSquare 
      },
      { 
        title: language === 'bn' ? "ইমেজ থেকে কোড" : "Image to Code", 
        desc: language === 'bn' ? "আপনার কাছে কোনো ইউআই ডিজাইন থাকলে তার ছবি আপলোড করুন। AI সেই ছবি দেখে হুবহু অ্যাপ তৈরি করে দেবে।" : "Upload a UI design image. AI will analyze the visual and convert it into functional code.",
        icon: Smartphone 
      },
      { 
        title: language === 'bn' ? "সেলফ-হিলিং ইঞ্জিন" : "Self-Healing Engine", 
        desc: language === 'bn' ? "প্রিভিউতে কোনো এরর আসলে আমাদের AI তা নিজে থেকেই শনাক্ত করে এবং অটোমেটিক ফিক্স করে দেয়।" : "If a runtime error occurs in preview, our AI detects and fixes it automatically without your intervention.",
        icon: Zap 
      }
    ],
    engineering: [
      { 
        title: language === 'bn' ? "ডাটাবেস ব্রিজ (Supabase)" : "Database Bridge (Supabase)", 
        desc: language === 'bn' ? "Config এ গিয়ে আপনার Supabase URL ও Key দিন। AI আপনার জন্য database.sql ফাইল তৈরি করবে যা ডাটা সেভ করতে সাহায্য করবে।" : "Add your Supabase URL & Key in Config. AI will generate a database.sql file to handle real-time data sync.",
        icon: Database 
      },
      { 
        title: language === 'bn' ? "মোবাইল কি-স্টোর জেনারেটর" : "Instant Mobile Signing", 
        desc: language === 'bn' ? "পিসি না থাকলেও সমস্যা নেই। Config থেকে 'Instant Generate' এ ক্লিক করলে AI আপনার জন্য কি-স্টোর বানিয়ে দেবে।" : "No PC? No problem. Click 'Instant Generate' in Config and AI will create a secure keystore for you.",
        icon: Wand2 
      },
      { 
        title: language === 'bn' ? "ডুয়াল ওয়ার্কস্পেস" : "Dual Workspace", 
        desc: language === 'bn' ? "আপনার অ্যাপের দুটি অংশ থাকে: App (ইউজারদের জন্য) এবং Admin (ম্যানেজমেন্টের জন্য)। আপনি সহজেই দুটির মধ্যে সুইচ করতে পারেন।" : "Your project has two parts: App (for users) and Admin (for management). Switch between them seamlessly.",
        icon: Cpu 
      }
    ],
    github: [
      { 
        title: language === 'bn' ? "গিটহাব টোকেন" : "GitHub PAT Token", 
        desc: language === 'bn' ? "GitHub Settings > Developer Settings এ গিয়ে 'repo' এবং 'workflow' পারমিশন দিয়ে টোকেন তৈরি করে এখানে সেভ করুন।" : "Create a Classic PAT with 'repo' and 'workflow' scopes in GitHub Settings and save it in your profile.",
        icon: Key 
      },
      { 
        title: language === 'bn' ? "অটো-সিঙ্ক" : "Automatic Sync", 
        desc: language === 'bn' ? "প্রতিবার কোড জেনারেট হওয়ার পর তা অটোমেটিক আপনার গিটহাব রিপোজিটরিতে পুশ হয়ে যায়।" : "Every code change is automatically pushed to your connected GitHub repository for version control.",
        icon: Github 
      },
      { 
        title: language === 'bn' ? "ভার্সন কন্ট্রোল" : "Version Snapshots", 
        desc: language === 'bn' ? "আপনার আগের কোড ফিরে পেতে 'History' ট্যাব ব্যবহার করুন। যেকোনো ভুলের পর আগের ভার্সনে ফিরে যাওয়া সম্ভব।" : "Use the History tab to rollback to any previous snapshot if something goes wrong.",
        icon: RefreshCw 
      }
    ],
    build: [
      { 
        title: language === 'bn' ? "ক্লাউড বিল্ড ইঞ্জিন" : "Cloud Build Engine", 
        desc: language === 'bn' ? "আপনার কোড রেডি হলে 'Execute Build' বাটনে ক্লিক করুন। এটি গিটহাব অ্যাকশন ব্যবহার করে APK তৈরি করবে।" : "Click 'Execute Build' when ready. It triggers GitHub Actions to compile your project into a native binary.",
        icon: Rocket 
      },
      { 
        title: language === 'bn' ? "Release APK বনাম AAB" : "Release APK vs AAB", 
        desc: language === 'bn' ? "কি-স্টোর ডিটেইলস দিলে সিস্টেম 'AAB' ফাইল তৈরি করবে যা গুগল প্লে-স্টোরের জন্য বাধ্যতামূলক।" : "Providing keystore details enables AAB (Android App Bundle) generation, mandatory for Google Play Store.",
        icon: ShieldCheck 
      },
      { 
        title: language === 'bn' ? "ইনস্টল করার নিয়ম" : "Installation Guide", 
        desc: language === 'bn' ? "বিল্ড শেষে পাওয়া QR কোডটি স্ক্যান করলে সরাসরি আপনার ফোনে অ্যাপটি ইনস্টল হবে।" : "Scan the generated QR code after the build completes to install the app directly on your phone.",
        icon: Smartphone 
      }
    ]
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-12 bg-black animate-in fade-in duration-700 pb-32">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-6">
            <button onClick={onBack} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-zinc-400 transition-all active:scale-95">
              <ArrowLeft size={24}/>
            </button>
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">System <span className="text-pink-600">Manual</span></h2>
              <p className="text-[10px] font-black uppercase text-zinc-600 tracking-[0.4em] mt-1">OneClick Studio v2.5 Documentation</p>
            </div>
          </div>
          <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase text-[10px] text-pink-500 hover:bg-pink-600 hover:text-white transition-all flex items-center gap-2">
             <ExternalLink size={14}/> Official Support
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 p-2 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
          {[
            { id: 'basics', label: language === 'bn' ? 'শুরু করা' : 'Basics', icon: PlayCircle },
            { id: 'engineering', label: language === 'bn' ? 'ইঞ্জিনিয়ারিং' : 'Engineering', icon: Settings },
            { id: 'github', label: language === 'bn' ? 'গিটহাব' : 'GitHub', icon: Github },
            { id: 'build', label: language === 'bn' ? 'বিল্ড ও রিলিজ' : 'Build & Release', icon: Rocket }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTopic(tab.id as any)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-3 py-4 rounded-2xl text-[10px] font-black uppercase transition-all ${activeTopic === tab.id ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/20' : 'text-zinc-500 hover:bg-white/5'}`}
            >
              <tab.icon size={16}/> {tab.label}
            </button>
          ))}
        </div>

        {/* Manual Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {guides[activeTopic].map((guide, idx) => (
            <div key={idx} className="glass-tech p-8 rounded-[2.5rem] border-white/5 group hover:border-pink-500/20 transition-all relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/5 blur-3xl -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-14 h-14 bg-pink-500/10 rounded-2xl flex items-center justify-center text-pink-500 mb-6 group-hover:scale-110 transition-transform">
                <guide.icon size={28}/>
              </div>
              <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">{guide.title}</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">{guide.desc}</p>
            </div>
          ))}
          
          {/* Pro Tips / Notice Box */}
          <div className="md:col-span-2 glass-tech p-10 rounded-[3rem] border-amber-500/10 bg-gradient-to-br from-amber-600/5 to-transparent flex flex-col md:flex-row items-center gap-10">
             <div className="text-center md:text-left space-y-4 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[8px] font-black text-amber-500 uppercase tracking-widest">Mobile User Tip</div>
                <h4 className="text-2xl font-black text-white uppercase tracking-tight">
                  {language === 'bn' ? "মোবাইল থেকে প্লে-স্টোর ফাইল জেনারেট করবেন?" : "Generate Play Store keys on Mobile?"}
                </h4>
                <p className="text-xs text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">
                   {language === 'bn' 
                     ? "আপনার পিসি না থাকলে Config পেজ থেকে 'Instant Generate' ব্যবহার করুন। AI আপনার জন্য সিকিউর কি-স্টোর পাসওয়ার্ড এবং ফাইল তৈরি করে দেবে। আপনাকে আর টার্মিনাল ব্যবহার করতে হবে না।" 
                     : "If you don't have a PC, use 'Instant Generate' in the Config page. AI will handle the secure passwords and key creation for you. No terminal needed."}
                </p>
                <div className="flex gap-4">
                  <button onClick={() => setActiveTopic('engineering')} className="px-6 py-3 bg-amber-500 text-black rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl active:scale-95 transition-all">
                     Go to Config
                  </button>
                </div>
             </div>
             <div className="w-40 h-40 bg-amber-500/10 rounded-full flex items-center justify-center border-4 border-amber-500/20 relative group">
                <div className="absolute inset-0 bg-amber-500/20 blur-3xl animate-pulse rounded-full"></div>
                <Wand2 size={60} className="text-amber-500 relative z-10 group-hover:scale-110 transition-transform duration-500"/>
             </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="p-8 bg-white/5 border border-white/5 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-pink-500/10 text-pink-500 rounded-xl"><ShieldCheck size={20}/></div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Verified Neural Infrastructure • Data Encrypted</p>
           </div>
           <p className="text-[10px] font-black text-zinc-700 uppercase">© 2025 OneClick Studio Core</p>
        </div>

      </div>
    </div>
  );
};

export default HelpCenterView;
