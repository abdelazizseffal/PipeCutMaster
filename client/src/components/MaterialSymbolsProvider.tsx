import { useEffect } from "react";

type MaterialSymbolsProviderProps = {
  children: React.ReactNode;
};

export function MaterialSymbolsProvider({ children }: MaterialSymbolsProviderProps) {
  useEffect(() => {
    // Add Google Material Symbols font to head
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200";
    document.head.appendChild(link);
    
    // Add Google Roboto font to head
    const fontLink = document.createElement("link");
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap";
    document.head.appendChild(fontLink);
    
    return () => {
      document.head.removeChild(link);
      document.head.removeChild(fontLink);
    };
  }, []);
  
  return children;
}
