import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { apiRequest } from "./queryClient";

// Types for authentication
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'supplier';
  companyName?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  password: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'supplier';
  companyName?: string;
  phone?: string;
  address?: string;
}

// Hook to get current user
export function useUser() {
  return useQuery<User | null>({
    queryKey: ['/api/auth/me'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false
  });
}

// Hook for login
export function useLogin() {
  const [, setLocation] = useLocation();
  
  return useMutation({
    mutationFn: async (credentials: LoginCredentials) => {
      const response = await apiRequest('POST', '/api/auth/login', credentials);
      return await response.json() as User;
    },
    onSuccess: () => {
      setLocation('/dashboard');
    }
  });
}

// Hook for registration
export function useRegister() {
  const [, setLocation] = useLocation();
  
  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest('POST', '/api/auth/register', data);
      return await response.json();
    },
    onSuccess: () => {
      setLocation('/login');
    }
  });
}

// Hook for logout
export function useLogout() {
  const [, setLocation] = useLocation();
  
  return useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/logout', {});
      return await response.json();
    },
    onSuccess: () => {
      setLocation('/login');
    }
  });
}

// Higher order component for route protection
export function withAuth(Component: React.ComponentType<any>, allowedRoles?: string[]) {
  return function ProtectedRoute(props: any) {
    const { data: user, isLoading } = useUser();
    const [, setLocation] = useLocation();
    
    if (isLoading) {
      return React.createElement('div', null, 'Loading');
    }
    
    if (!user) {
      setLocation('/login');
      return null;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
      setLocation('/dashboard');
      return null;
    }
    
    return React.createElement(Component, props);
  };
}
