
import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Smartphone, Download, ArrowLeft, Loader2, ExternalLink, Copy, Check, Globe, Layout, XOctagon } from 'lucide-react';
import BuildConsole from './BuildConsole';
import { BuildStep } from '../../types';

interface BuildStatusDisplayProps {
  status: string;
  message: string;
  apkUrl?: string;
  webUrl?: string;
  runUrl?: string;
  buildSteps: BuildStep[];
  handleSecureDownload: () => void;
  resetBuild: () => void;
}

const BuildStatusDisplay: React.FC<BuildStatusDisplayProps> = ({
  status, message, apkUrl, webUrl, runUrl, buildSteps, handleSecureDownload, resetBuild
}) => {
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrReady, setQrReady] = useState(false);
  const [copiedWeb, setCopiedWeb] = useState(false);

  useEffect(() => {
    // Enhanced QR Generation logic
    if (status === 'success' && runUrl && qrRef.current) {
      // Small delay to ensure DOM is ready and container has dimensions
      const timer = setTimeout(() => {
        if (!qrRef.current) return;
        qrRef.current.innerHTML = '';
        
        const generateQr = () => {
          try {
            // @ts-ignore
            if (window.QRCode) {
              // @ts-ignore
              new window.QRCode(qrRef.current, {
                text: runUrl,
                width: 140,
                height: 140,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: 2 
              });
              setQrReady(true);
            } else {
              console.warn("QRCode library not found, retrying...");
              setTimeout(generateQr, 1000);
            }
          } catch (err) {
            console.error("QR Generation Error:", err);
          }
        };
        
        generateQr();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [status, runUrl]);

  const copyUrl = async (url: string, setFn: (v: boolean) => void) => {
    try {
      await navigator.clipboard.writeText(url);
      setFn(true);
      setTimeout(() => setFn(false), 2000);
    } catch (err) {
      const textArea = document.createElement("textarea");
      textArea.value = url; document.body.appendChild(textArea);
      textArea.select(); document.execCommand('copy');
      document.body.removeChild(textArea);
      setFn(true); setTimeout(() => setFn(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-start md:justify-center p-4 md:p-10 overflow-y-auto bg-[#09090b] min-h-full pb-32 custom-scrollbar">
      <div className={`glass-tech w-full max-w-4xl rounded-[2.5rem] md:rounded-[3rem] text-center relative overflow-hidden border-pink-500/10 shadow-2xl transition-all duration-700 ${status === 'success' ? 'p-6 md:p-12' : 'p-6 md:p-10'}`}>
        {status === 'success' ? (
          <div className="space-y-6 md:space-y-10 animate-in zoom-in duration-500">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center border-2 border-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                <CheckCircle2 size={32}/>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase tracking-tighter">Full Stack Deployed</h2>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em]">Mobile APK & Admin Web Panel are ready</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 py-2">
              {/* MOBILE SIDE */}
              <div className="p-5 md:p-8 bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 justify-center">
                  <Smartphone className="text-pink-500" size={18}/>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Mobile Build</h3>
                </div>
                <div className="relative p-3 bg-white rounded-[1.5rem] md:rounded-[2rem] mx-auto w-[140px] h-[140px] flex items-center justify-center overflow-hidden border-4 border-pink-500/20 shrink-0">
                  <div ref={qrRef} className="w-full h-full flex items-center justify-center qr-container">
                    {!qrReady && <Loader2 className="animate-spin text-pink-500" />}
                  </div>
                </div>
                <div className="space-y-2">
                  <button 
                    onClick={handleSecureDownload} 
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl font-black uppercase text-[9px] shadow-xl transition-all active:scale-95"
                  >
                    <Download size={14}/> Download APK (ZIP)
                  </button>
                  <p className="text-[7px] md:text-[8px] font-black text-zinc-600 uppercase">Scan to visit GitHub Build Page</p>
                </div>
              </div>

              {/* WEB SIDE */}
              <div className="p-5 md:p-8 bg-white/5 border border-white/10 rounded-[2rem] md:rounded-[2.5rem] space-y-4 md:space-y-6">
                <div className="flex items-center gap-3 justify-center">
                  <Globe className="text-indigo-500" size={18}/>
                  <h3 className="text-xs font-black uppercase tracking-widest text-white">Admin Web</h3>
                </div>
                <div className="w-[140px] h-[140px] mx-auto bg-indigo-500/10 rounded-[1.5rem] md:rounded-[2rem] flex flex-col items-center justify-center border-4 border-indigo-500/20 text-indigo-400 group relative shrink-0">
                   <Layout size={40} className="group-hover:scale-110 transition-transform duration-500"/>
                   <span className="text-[7px] font-black uppercase mt-3 tracking-widest">Live Static Site</span>
                </div>
                <div className="space-y-2">
                   <button 
                     onClick={() => webUrl && window.open(webUrl, '_blank')}
                     className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[9px] shadow-xl transition-all active:scale-95"
                   >
                     <ExternalLink size={14}/> Open Admin Panel
                   </button>
                   <button 
                     onClick={() => webUrl && copyUrl(webUrl, setCopiedWeb)}
                     className="text-[8px] font-black uppercase text-zinc-600 hover:text-white flex items-center gap-2 mx-auto"
                   >
                     {copiedWeb ? <Check size={10} className="text-green-500"/> : <Copy size={10}/>}
                     {copiedWeb ? 'Link Copied' : 'Copy Web URL'}
                   </button>
                </div>
              </div>
            </div>

            <button 
              onClick={resetBuild} 
              className="flex items-center gap-2 mx-auto text-[10px] font-black uppercase text-zinc-600 hover:text-white transition-colors border-t border-white/5 pt-6 w-full justify-center"
            >
              <ArrowLeft size={14}/> Back to Terminal
            </button>
          </div>
        ) : (
          <div className="space-y-6 max-h-[85vh] flex flex-col">
            <div className="relative inline-block shrink-0">
              <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full animate-pulse"></div>
              <Smartphone size={50} className="text-pink-500 relative z-10 mx-auto animate-[pulse_2s_infinite]"/>
            </div>
            
            <div className="shrink-0">
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter">
                {status === 'pushing' ? 'Deploying Source' : 'Compiling Full-Stack'}
              </h2>
              <div className="flex items-center justify-center gap-2 mt-2">
                <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-ping"></div>
                <p className="text-pink-400/70 font-mono text-[10px] uppercase tracking-[0.4em] font-black">
                  {message}
                </p>
              </div>
            </div>
            
            <div className="flex-1 min-h-0 overflow-hidden">
              <BuildConsole buildSteps={buildSteps} />
            </div>
            
            <div className="shrink-0 pt-4">
              <button 
                onClick={resetBuild} 
                className="group relative flex items-center gap-3 mx-auto px-8 py-3 bg-red-600/10 border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-600 hover:text-white transition-all duration-300 active:scale-95 shadow-lg shadow-red-900/5"
              >
                <XOctagon size={16} className="group-hover:rotate-12 transition-transform" />
                Terminate Deployment
              </button>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .qr-container img { margin: 0 auto; display: block; border-radius: 1rem; }
      `}</style>
    </div>
  );
};

export default BuildStatusDisplay;
