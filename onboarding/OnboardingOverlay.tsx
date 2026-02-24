
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Layout, Code, Rocket, Smartphone, ChevronRight } from 'lucide-react';

interface OnboardingOverlayProps {
  onComplete: () => void;
}

const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const steps = [
    {
      title: "Welcome to Studio",
      desc: "OneClick Studio তে আপনাকে স্বাগতম। এটি একটি AI চালিত হাইব্রিড অ্যাপ মেকার। চলুন দেখা যাক এটি কীভাবে কাজ করে।",
      icon: Sparkles,
      color: "text-pink-500"
    },
    {
      title: "AI Chat Box",
      desc: "ডানে থাকা চ্যাট বক্সে আপনার অ্যাপের আইডিয়া লিখুন। আপনি ইমেজ আপলোড করেও ইউআই জেনারেট করতে পারেন।",
      icon: Layout,
      color: "text-blue-500"
    },
    {
      title: "Visual Preview",
      desc: "মাঝখানের মোবাইল উইন্ডোতে আপনি আপনার অ্যাপের আউটপুট সাথে সাথে দেখতে পারবেন। এটি রিয়েল-টাইম আপডেট হয়।",
      icon: Smartphone,
      color: "text-green-500"
    },
    {
      title: "Execute Build",
      desc: "আপনার কোড রেডি হয়ে গেলে 'Execute Build' বাটনে ক্লিক করে সরাসরি APK ফাইল তৈরি করতে পারবেন।",
      icon: Rocket,
      color: "text-amber-500"
    }
  ];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      setIsVisible(false);
      setTimeout(onComplete, 500);
    }
  };

  if (!isVisible && step === 0) return null;

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-6 transition-all duration-700 ${isVisible ? 'bg-black/80 backdrop-blur-md opacity-100' : 'bg-transparent backdrop-blur-0 opacity-0 pointer-events-none'}`}>
      <div className={`max-w-md w-full glass-tech p-10 rounded-[3rem] border-pink-500/20 shadow-2xl relative transition-all duration-500 ${isVisible ? 'scale-100' : 'scale-90'}`}>
        <button onClick={() => { setIsVisible(false); setTimeout(onComplete, 500); }} className="absolute top-8 right-8 text-zinc-600 hover:text-white transition-colors">
          <X size={20}/>
        </button>

        <div className="space-y-8 text-center">
          <div className="flex justify-center">
            <div className={`w-20 h-20 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-center animate-bounce shadow-2xl ${steps[step].color}`}>
               {React.createElement(steps[step].icon, { size: 36 })}
            </div>
          </div>

          <div className="space-y-3">
             <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
               {steps[step].title.split(' ').map((word, i) => (
                 <span key={i} className={i === steps[step].title.split(' ').length - 1 ? 'text-pink-500' : ''}>{word} </span>
               ))}
             </h2>
             <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
               {steps[step].desc}
             </p>
          </div>

          <div className="flex items-center justify-center gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 transition-all rounded-full ${i === step ? 'w-8 bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'w-2 bg-white/10'}`}></div>
            ))}
          </div>

          <button onClick={handleNext} className="w-full py-5 bg-pink-600 hover:bg-pink-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-pink-600/20 transition-all active:scale-95 group">
             {step === steps.length - 1 ? 'Start Engineering' : 'Next Step'} 
             <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
          </button>
        </div>
      </div>

      {/* Background decoration elements */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full"></div>
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-pink-500/5 blur-[100px] rounded-full"></div>
    </div>
  );
};

export default OnboardingOverlay;
