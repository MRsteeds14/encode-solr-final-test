import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { getCurrentUser, logoutUser } from '@/lib/user-registry';
import { Wallet, SignOut } from '@phosphor-icons/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { UserLogin } from './UserLogin';

export function WalletButton() {
  const { wallet, address, isConnected, isLoading, disconnect } = useCircleWallet();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const currentUser = getCurrentUser();

  const handleConnect = () => {
    setShowLoginDialog(true);
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
    // Trigger page refresh to load wallet state
    window.location.reload();
  };

  const handleDisconnect = () => {
    const userName = currentUser?.email || currentUser?.username || 'your account';
    const confirmDisconnect = window.confirm(
      `Disconnect from ${userName}? You can login anytime to access your solar system.`
    );
    
    if (confirmDisconnect) {
      // Clear user data first
      logoutUser();
      // Clear wallet state - this triggers App.tsx to re-render and show landing page
      disconnect();
      console.log('👋 User logged out - wallet disconnected');
      // Force re-render by reloading (ensures clean state)
      setTimeout(() => window.location.href = '/', 100);
    }
  };

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 glass-card px-3 py-1.5 border border-border/50">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <div className="flex flex-col">
            <span className="text-xs font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
            {currentUser && (currentUser.email || currentUser.username) && (
              <span className="text-[10px] text-muted-foreground">
                {currentUser.email || currentUser.username}
              </span>
            )}
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={handleDisconnect}
          className="h-8 px-2 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <SignOut size={14} weight="bold" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={handleConnect} 
        disabled={isLoading}
        variant="default"
        size="sm"
        className="gap-2"
      >
        {isLoading ? (
          <>
            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            Loading...
          </>
        ) : (
          <>
            <Wallet size={16} weight="fill" />
            Login
          </>
        )}
      </Button>

      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <UserLogin onSuccess={handleLoginSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
