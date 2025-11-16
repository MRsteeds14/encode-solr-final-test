/**
 * User Registry System
 * Maps user identities to Circle wallet addresses for persistent login
 */

interface UserProfile {
  userId: string;
  email?: string;
  username?: string;
  walletId: string;
  walletAddress: string;
  createdAt: number;
  lastLogin: number;
}

const STORAGE_KEY = 'solr_user_registry';

/**
 * Get all registered users (for development/demo purposes)
 */
export function getAllUsers(): UserProfile[] {
  const registry = localStorage.getItem(STORAGE_KEY);
  if (!registry) return [];
  
  try {
    return JSON.parse(registry);
  } catch (e) {
    console.error('Failed to parse user registry:', e);
    return [];
  }
}

/**
 * Find user by email or username
 */
export function findUser(identifier: string): UserProfile | null {
  const users = getAllUsers();
  const normalizedId = identifier.toLowerCase().trim();
  
  return users.find(
    user => 
      user.email?.toLowerCase() === normalizedId ||
      user.username?.toLowerCase() === normalizedId ||
      user.userId === normalizedId
  ) || null;
}

/**
 * Register new user with their wallet
 */
export function registerUser(profile: Omit<UserProfile, 'createdAt' | 'lastLogin'>): UserProfile {
  const users = getAllUsers();
  
  // Check if user already exists
  const existing = findUser(profile.email || profile.username || profile.userId);
  if (existing) {
    throw new Error('User already exists. Use loginUser() instead.');
  }
  
  const newUser: UserProfile = {
    ...profile,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
  
  users.push(newUser);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  
  console.log('✅ User registered:', newUser.userId, '→', newUser.walletAddress);
  return newUser;
}

/**
 * Update user's last login timestamp
 */
export function loginUser(identifier: string): UserProfile | null {
  const user = findUser(identifier);
  if (!user) return null;
  
  const users = getAllUsers();
  const index = users.findIndex(u => u.userId === user.userId);
  
  if (index !== -1) {
    users[index].lastLogin = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }
  
  console.log('✅ User logged in:', user.userId, '→', user.walletAddress);
  return users[index];
}

/**
 * Get current logged-in user (from localStorage)
 */
export function getCurrentUser(): UserProfile | null {
  const userId = localStorage.getItem('circle_wallet_user_id');
  const walletData = localStorage.getItem('circle_wallet');
  
  if (!userId || !walletData) return null;
  
  try {
    const wallet = JSON.parse(walletData);
    const user = findUser(userId);
    
    // If user exists in registry, return it
    if (user) return user;
    
    // Otherwise, create a profile from localStorage data
    return {
      userId,
      walletId: wallet.id,
      walletAddress: wallet.address,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
  } catch (e) {
    return null;
  }
}

/**
 * Clear current user session (logout)
 */
export function logoutUser(): void {
  localStorage.removeItem('circle_wallet');
  localStorage.removeItem('circle_wallet_user_id');
  console.log('👋 User logged out');
}

/**
 * Check if user identifier is available
 */
export function isIdentifierAvailable(identifier: string): boolean {
  return findUser(identifier) === null;
}

/**
 * Get user's wallet data
 */
export function getUserWallet(identifier: string): { walletId: string; address: string } | null {
  const user = findUser(identifier);
  if (!user) return null;
  
  return {
    walletId: user.walletId,
    address: user.walletAddress,
  };
}

/**
 * Development helper: Clear all users
 */
export function clearRegistry(): void {
  localStorage.removeItem(STORAGE_KEY);
  console.log('🗑️ User registry cleared');
}
