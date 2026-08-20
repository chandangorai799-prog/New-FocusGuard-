import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, CheckCircle, Smartphone, Share2, PlusSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { pwaService } from '../../services/pwaService';
import { AudioService } from '../../services/audioService';

interface PwaInstallBannerProps {
  onDismiss?: () => void;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({ onDismiss }) => {
  const [canInstall, setCanInstall] = useState<boolean>(pwaService.canInstall());
  const [isInstalled, setIsInstalled] = useState<boolean>(pwaService.getIsInstalled());
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showIosGuide, setShowIosGuide] = useState<boolean>(false);
  const isIOS = pwaService.isIOS();

  useEffect(() => {
    const unsubscribe = pwaService.subscribe((installable) => {
      setCanInstall(installable);
      setIsInstalled(pwaService.getIsInstalled());
    });

    // Check if user previously dismissed today
    const dismissedAt = localStorage.getItem('focusguard_pwa_dismissed');
    if (dismissedAt) {
      const diffHours = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60);
      if (diffHours < 24) {
        setIsDismissed(true);
      }
    }

    return () => unsubscribe();
  }, []);

  const handleInstallClick = async () => {
    AudioService.playTap();
    if (isIOS) {
      setShowIosGuide(true);
      return;
    }

    if (canInstall) {
      const installed = await pwaService.promptInstall();
      if (installed) {
        setIsInstalled(true);
      }
    } else {
      // Fallback instructions if prompt not fired yet
      setShowIosGuide(true);
    }
  };

  const handleDismiss = () => {
    AudioService.playTap();
    setIsDismissed(true);
    localStorage.setItem('focusguard_pwa_dismissed', Date.now().toString());
    if (onDismiss) onDismiss();
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <motion.div
        id="pwa-install-banner"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900/90 border-b border-blue-500/30 px-4 py-2.5 backdrop-blur-md relative z-20 shadow-lg"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0 shadow-inner">
              <Smartphone className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-white text-xs sm:text-sm tracking-tight truncate">
                  Install FocusGuard App
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                  PWA Ready
                </span>
              </div>
              <p className="text-[11px] text-blue-200/80 truncate">
                Full-screen app, offline study timers & fast home-screen access.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="pwa-banner-install-btn"
              onClick={handleInstallClick}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold shadow-md shadow-blue-900/40 flex items-center space-x-1.5 transition active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
            <button
              id="pwa-banner-close-btn"
              onClick={handleDismiss}
              className="p-1.5 text-blue-300/70 hover:text-white rounded-lg hover:bg-white/10 transition"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* iOS or Manual Add to Home Screen Instructions Modal */}
      <AnimatePresence>
        {showIosGuide && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative text-slate-100"
            >
              <button
                onClick={() => setShowIosGuide(false)}
                className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Install FocusGuard PWA</h3>
                  <p className="text-xs text-slate-400">Add to your Home Screen in 2 steps</p>
                </div>
              </div>

              <div className="space-y-3 my-5 text-xs text-slate-300">
                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-white mb-0.5">Open Browser Menu / Share</p>
                    <p className="text-slate-400">
                      Tap the <Share2 className="inline w-3.5 h-3.5 mx-1 text-blue-400" /> Share button (in Safari) or the 3 dots (in Chrome).
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-white mb-0.5">Select "Add to Home Screen"</p>
                    <p className="text-slate-400">
                      Scroll down and tap <PlusSquare className="inline w-3.5 h-3.5 mx-1 text-blue-400" /> <strong>"Add to Home Screen"</strong> / <strong>"Install app"</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition shadow-md"
              >
                Got It, Thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
