import React, { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LockedFeatureGuard from "@/components/LockedFeatureGuard";
import { Button } from "@/components/ui/button";

export default function TestPopup() {
  const [showSuccess, setShowSuccess] = useState(false);

  React.useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => {
        setShowSuccess(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 space-y-6">
      <div className="text-center space-y-2 select-none">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Popup Tester Panel</h1>
        <p className="text-xs md:text-sm text-muted-foreground max-w-md mx-auto">
          Easily preview and test the premium checkout modals, success animations, and module guards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md w-full">
        {/* Success Lottie Modal */}
        <div className="border border-border p-5 rounded-2xl bg-white flex flex-col items-center justify-between text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <span className="block text-xs font-extrabold text-primary uppercase tracking-wider">ANIMATION PREVIEW</span>
            <span className="block text-sm font-bold text-foreground">Success Lottie Dialog</span>
          </div>
          <Button onClick={() => setShowSuccess(true)} className="w-full bg-[#2DC08D] hover:bg-[#25a97b] font-bold text-xs rounded-full">
            Show Success Modal
          </Button>
        </div>

        {/* Locked Feature Gate Modal */}
        <div className="border border-border p-5 rounded-2xl bg-white flex flex-col items-center justify-between text-center space-y-4 shadow-sm">
          <div className="space-y-1">
            <span className="block text-xs font-extrabold text-amber-600 uppercase tracking-wider">UPGRADE FLOW</span>
            <span className="block text-sm font-bold text-foreground">Locked Feature Gate</span>
          </div>
          <LockedFeatureGuard featureTitle="Advanced AI Search">
            <Button variant="outline" className="w-full font-bold text-xs rounded-full border-primary/30 text-primary hover:bg-primary/5 hover:text-primary">
              Show Locked Modal
            </Button>
          </LockedFeatureGuard>
        </div>
      </div>

      <Dialog open={showSuccess} onOpenChange={setShowSuccess}>
        <DialogContent className="max-h-[90vh] overflow-y-auto w-[90%] max-w-[380px] bg-white p-6 shadow-2xl rounded-[32px] border border-slate-100/50 select-none border-none flex items-center justify-center">
          <div className="flex items-center justify-center bg-transparent pointer-events-none">
            <dotlottie-wc
              src="https://lottie.host/2fc0ba87-b5ce-4ef6-a1d1-17fe365e32e7/k9r7BJgSj1.lottie"
              style={{ width: "330px", height: "330px" }}
              autoplay
              loop
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
