
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  tokens: number;
  isLoggedIn: boolean;
  joinedAt: number;
  isAdmin?: boolean;
  is_banned?: boolean;
  bio?: string;
  is_verified?: boolean;
  github_token?: string;
  github_owner?: string;
  github_repo?: string;
}

export interface Package {
  id: string;
  name: string;
  tokens: number;
  price: number;
  color: string;
  icon: string;
  is_popular: boolean;
}

export interface Transaction {
  id: string;
  user_id: string;
  package_id: string;
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  payment_method: string;
  trx_id: string;
  screenshot_url?: string;
  message?: string;
  created_at: string;
  user_email?: string; // Virtual field for admin
}

export interface ActivityLog {
  id: string;
  admin_email: string;
  action: string;
  details: string;
  created_at: string;
}
