/**
 * User Login/Registration Component
 * Allows users to create account or login to existing wallet
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useCircleWallet } from '@/hooks/useCircleWallet';
import { findUser, registerUser, loginUser, isIdentifierAvailable } from '@/lib/user-registry';
import { Wallet, User, Lightning } from '@phosphor-icons/react';

export function UserLogin({ onSuccess }: { onSuccess: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { createWallet } = useCircleWallet();

  const handleLogin = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter your email or username');
      return;
    }

    setIsLoading(true);
    try {
      const user = findUser(identifier);
      
      if (!user) {
        toast.info('Account not found. Creating new account...');
        // Auto-register with demo wallet instead of showing error
        await handleRegister();
        return;
      }

      // Load existing wallet from registry
      localStorage.setItem('circle_wallet', JSON.stringify({
        id: user.walletId,
        address: user.walletAddress,
        blockchain: 'ARC-TESTNET',
        state: 'LIVE',
        accountType: 'SCA',
      }));
      localStorage.setItem('circle_wallet_user_id', user.userId);
      
      // Update last login
      loginUser(identifier);
      
      toast.success(`Welcome back, ${user.email || user.username || user.userId}!`);
      onSuccess();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!identifier.trim()) {
      toast.error('Please enter an email or username');
      return;
    }

    setIsLoading(true);
    try {
      // Check if identifier is available
      if (!isIdentifierAvailable(identifier)) {
        toast.error('This email/username is already registered. Try logging in instead.');
        setMode('login');
        setIsLoading(false);
        return;
      }

      // Use demo wallet from environment instead of creating new one
      const DEMO_WALLET_ID = import.meta.env.VITE_CIRCLE_WALLET_ID;
      const DEMO_WALLET_ADDRESS = import.meta.env.VITE_CIRCLE_WALLET_ADDRESS;

      if (!DEMO_WALLET_ID || !DEMO_WALLET_ADDRESS) {
        throw new Error('Demo wallet not configured. Please check .env.local');
      }

      const userId = identifier.toLowerCase().trim();
      
      // Register user with demo wallet
      const isEmail = identifier.includes('@');
      registerUser({
        userId,
        ...(isEmail ? { email: identifier } : { username: identifier }),
        walletId: DEMO_WALLET_ID,
        walletAddress: DEMO_WALLET_ADDRESS,
      });

      // Save wallet to localStorage
      localStorage.setItem('circle_wallet', JSON.stringify({
        id: DEMO_WALLET_ID,
        address: DEMO_WALLET_ADDRESS,
        blockchain: 'ARC-TESTNET',
        state: 'LIVE',
        accountType: 'SCA',
      }));
      localStorage.setItem('circle_wallet_user_id', userId);

      toast.success('Account created! Your wallet is ready.');
      onSuccess();
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <Card className="glass-card border-border/50">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl"></div>
              <div className="relative p-4 bg-primary/10 rounded-full border border-primary/30">
                <Wallet size={48} weight="fill" className="text-primary" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">Access Your Solar System</CardTitle>
          <CardDescription>
            Login to your existing account or create a new one
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as 'login' | 'register')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" className="gap-2">
                <User size={16} weight="bold" />
                Login
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <Lightning size={16} weight="fill" />
                Register
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email or Username</label>
                <Input
                  type="text"
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              <Button 
                onClick={handleLogin} 
                disabled={isLoading || !identifier.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Logging in...
                  </>
                ) : (
                  <>
                    <User size={20} weight="bold" />
                    Login to Dashboard
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Don't have an account? Switch to <button onClick={() => setMode('register')} className="text-primary hover:underline">Register</button>
              </p>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email or Username</label>
                <Input
                  type="text"
                  placeholder="Choose an email or username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  This will be your permanent identifier for this solar system
                </p>
              </div>

              <Button 
                onClick={handleRegister} 
                disabled={isLoading || !identifier.trim()}
                className="w-full gap-2"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Creating wallet...
                  </>
                ) : (
                  <>
                    <Lightning size={20} weight="fill" />
                    Create Account & Wallet
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already registered? Switch to <button onClick={() => setMode('login')} className="text-primary hover:underline">Login</button>
              </p>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-border/30">
            <p className="text-xs text-center text-muted-foreground">
              🔒 Secured by Circle Developer-Controlled Wallets
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
