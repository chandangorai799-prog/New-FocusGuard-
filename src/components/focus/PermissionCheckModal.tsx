import React, { useState, useEffect } from 'react';
import {
  Shield,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Smartphone,
  Lock,
  RefreshCw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { AndroidPermissionInfo, AndroidPermissionKey } from '../../types';
import { AndroidBlockerService } from '../../services/androidBlockerService';
import { AudioService } from '../../services/audioService';

interface PermissionCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAllPermissionsGranted: () => void;
}

export const PermissionCheckModal: React.FC<PermissionCheckModalProps> = ({
  isOpen,
  onClose,
  onAllPermissionsGranted,
}) => {
  const [permissions, setPermissions] = useState<AndroidPermissionInfo[]>([]);
  const [selectedKey, setSelectedKey] = useState<AndroidPermissionKey>('usage_stats');

  useEffect(() => {
    if (isOpen) {
      loadPermissions();
    }
  }, [isOpen]);

  const loadPermissions = () => {
    const perms = AndroidBlockerService.getPermissions();
    setPermissions(perms);
  };

  if (!isOpen) return null;

  const requiredPerms = permissions.filter((p) => p.required);
  const optionalPerms = permissions.filter((p) => !p.required);
  const allRequiredGranted = requiredPerms.every((p) => p.isGranted);
  const selectedPerm = permissions.find((p) => p.key === selectedKey) || permissions[0];

  const handleTogglePermission = (key: AndroidPermissionKey, currentGranted: boolean) => {
    AudioService.playTap();
    AndroidBlockerService.setPermissionGranted(key, !currentGranted);
    loadPermissions();
  };

  const handleGrantAll = () => {
    AudioService.playSuccess();
    AndroidBlockerService.grantAllPermissions();
    loadPermissions();
  };

  const handleOpenSettings = (key: AndroidPermissionKey) => {
    AudioService.playTap();
    AndroidBlockerService.openAndroidSettings(key);
    // Simulate setting granting for user convenience
    AndroidBlockerService.setPermissionGranted(key, true);
    loadPermissions();
  };

  const handleProceed = () => {
    if (allRequiredGranted) {
      AudioService.playSuccess();
      onAllPermissionsGranted();
    }
  };

  return (
    <div
      id="android-permission-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn"
    >
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Android Permissions Required</h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                  Setup Step
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real Android app blocking requires system permissions to monitor and restrict apps.
              </p>
            </div>
          </div>

          <button
            id="close-permission-modal-btn"
            onClick={() => {
              AudioService.playTap();
              onClose();
            }}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Alert */}
          {!allRequiredGranted ? (
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-3 text-xs text-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Required Permissions Missing</p>
                <p className="text-slate-300 text-[11px] mt-0.5">
                  FocusGuard cannot block apps without Usage Access and Display Over Other Apps. Grant them below to proceed.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between text-xs text-emerald-200">
              <div className="flex items-center space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="font-bold">All Required Permissions Ready</span>
              </div>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-mono">
                Ready to Block
              </span>
            </div>
          )}

          {/* Permissions List */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Required Android Capabilities
            </label>

            {requiredPerms.map((perm) => (
              <div
                key={perm.key}
                onClick={() => setSelectedKey(perm.key)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                  selectedKey === perm.key
                    ? 'bg-slate-800/90 border-blue-500/60 shadow-sm'
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      perm.isGranted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {perm.isGranted ? <CheckCircle2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{perm.name}</h4>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                        Required
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{perm.description}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenSettings(perm.key);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      perm.isGranted
                        ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/20'
                    }`}
                  >
                    {perm.isGranted ? 'Granted' : 'Grant Access'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Detailed Selected Permission Rationale Box */}
          {selectedPerm && (
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-blue-400">Why FocusGuard Needs This:</span>
                <span className="text-[10px] font-mono text-slate-400">API {selectedPerm.minApiLevel}+</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{selectedPerm.rationale}</p>
              <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Setting: {selectedPerm.settingsAction}</span>
                <span>{selectedPerm.manifestPermission}</span>
              </div>
            </div>
          )}

          {/* Optional Permissions (Accessibility & DND) */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Optional Enhancements
            </label>

            {optionalPerms.map((perm) => (
              <div
                key={perm.key}
                className="p-3 rounded-2xl bg-slate-850/50 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <span className="text-slate-400">{perm.isGranted ? '✅' : '⚪'}</span>
                  <div>
                    <h5 className="font-semibold text-slate-200">{perm.name}</h5>
                    <p className="text-[10px] text-slate-400">{perm.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleTogglePermission(perm.key, perm.isGranted)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border transition ${
                    perm.isGranted
                      ? 'bg-slate-800 text-slate-300 border-slate-700'
                      : 'bg-blue-600/20 text-blue-300 border-blue-500/30'
                  }`}
                >
                  {perm.isGranted ? 'Enabled' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex items-center justify-between gap-3">
          <button
            onClick={handleGrantAll}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition"
          >
            Grant All
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                AudioService.playTap();
                loadPermissions();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Refresh Permission Status"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              id="confirm-permissions-continue-btn"
              onClick={handleProceed}
              disabled={!allRequiredGranted}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                allRequiredGranted
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
              }`}
            >
              Continue to Focus Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
