// Authentication helper placeholders

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'admin';
}

export const getCurrentUser = (): UserProfile | null => {
  return {
    id: "user-1",
    name: "Team Member",
    email: "member@business.com",
    role: "member"
  };
};

export const logout = async (): Promise<void> => {
  // Add Firebase signOut integration
  console.log("Logged out");
};

