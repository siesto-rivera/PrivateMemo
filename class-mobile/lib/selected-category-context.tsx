import { createContext, useContext, useState, type ReactNode } from 'react';

type Value = {
  selectedCategory: string | null;
  setSelectedCategory: (name: string | null) => void;
};

const SelectedCategoryContext = createContext<Value>({
  selectedCategory: null,
  setSelectedCategory: () => {},
});

export function SelectedCategoryProvider({ children }: { children: ReactNode }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  return (
    <SelectedCategoryContext.Provider value={{ selectedCategory, setSelectedCategory }}>
      {children}
    </SelectedCategoryContext.Provider>
  );
}

export function useSelectedCategory() {
  return useContext(SelectedCategoryContext);
}
