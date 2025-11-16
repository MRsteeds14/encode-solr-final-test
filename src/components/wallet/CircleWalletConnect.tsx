/**
 * Circle Wallet Connect Component
 * 
 * Replaces Thirdweb's ConnectButton with Circle's User-Controlled Wallets
 */

import { useState } from 'react';
import { useCircleWallet } from '../../hooks/useCircleWallet';
import { Button } from '../ui/button';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Wallet, CheckCircle, XCircle } from 'lucide-react';

export function CircleWalletConnect() {
  const {
    isInitialized,
    isConnected,
    address,
    isLoading,
    error,
    createWallet,
    connect,
    disconnect,
  } = useCircleWallet();

  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState('');
  const [setupStep, setSetupStep] = useState<'idle' | 'creating' | 'success' | 'error'>('idle');

  const handleCreateWallet = async () => {
    setSetupStep('creating');
    try {
      await createWallet(email || undefined);
      setSetupStep('success');
      setTimeout(() => {
        setShowDialog(false);
        setSetupStep('idle');
        setEmail('');
      }, 2000);
    } catch (err) {
      setSetupStep('error');
      setTimeout(() => setSetupStep('idle'), 3000);
    }
  };

  const handleConnect = async () => {
    try {
      await connect();
      setShowDialog(false);
    } catch (err) {
      // Error handled by hook
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Not initialized
  if (!isInitialized) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Circle SDK not initialized. Check your App ID in .env.local
        </AlertDescription>
      </Alert>
    );
  }

  // Connected state
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm font-mono text-green-700 dark:text-green-300">
            {formatAddress(address)}
          </span>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={disconnect}
        >
          Disconnect
        </Button>
      </div>
    );
  }

  // Connect/Create wallet state
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Circle Wallet</DialogTitle>
          <DialogDescription>
            Create a new wallet or connect to an existing one
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Error display */}
          {error && setupStep === 'error' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success message */}
          {setupStep === 'success' && (
            <Alert className="border-green-500 bg-green-500/10">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <AlertDescription className="text-green-700 dark:text-green-300">
                Wallet created successfully! 🎉
              </AlertDescription>
            </Alert>
          )}

          {/* Creating state */}
          {setupStep === 'creating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center space-y-2">
                <p className="font-semibold">Creating your wallet...</p>
                <p className="text-sm text-muted-foreground">
                  You'll be prompted to set a PIN. This takes about 30 seconds.
                </p>
              </div>
              <div className="w-full max-w-xs space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Creating user account...
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-75" />
                  Initializing wallet on Arc Testnet...
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-150" />
                  Setting up security (PIN)...
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse delay-200" />
                  Requesting testnet tokens...
                </div>
              </div>
            </div>
          )}

          {/* Create wallet form */}
          {setupStep === 'idle' && (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used to create a unique user ID. You can leave this blank.
                  </p>
                </div>

                <Button
                  onClick={handleCreateWallet}
                  disabled={isLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create New Wallet
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or
                  </span>
                </div>
              </div>

              <Button
                onClick={handleConnect}
                disabled={isLoading}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Connect Existing Wallet
              </Button>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p className="font-semibold">✨ Circle Wallet Benefits:</p>
                <ul className="space-y-1 pl-4">
                  <li>• No seed phrases to remember</li>
                  <li>• Secure PIN/biometric authentication</li>
                  <li>• Built-in recovery options</li>
                  <li>• Gas fees sponsored (testnet)</li>
                  <li>• Native USDC on Arc blockchain</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
