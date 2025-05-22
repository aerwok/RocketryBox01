import { createContext, useContext, ReactNode } from 'react';
import { useNavigate, NavigateFunction } from 'react-router-dom';

interface NavigationContextType {
  setNavigate: (navigate: (navigateFn: NavigateFunction) => void) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

interface NavigationProviderProps {
  children: ReactNode;
}

export const NavigationProvider = ({ children }: NavigationProviderProps) => {
  const navigate = useNavigate();

  const setNavigate = (navigateFn: (navigateFn: NavigateFunction) => void) => {
    // This function will be called by ApiService to set its navigation function
    navigateFn(navigate);
  };

  return (
    <NavigationContext.Provider value={{ setNavigate }}>
      {children}
    </NavigationContext.Provider>
  );
}; 