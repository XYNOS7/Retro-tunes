import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ThemeToggleProps {
  isDarkTheme: boolean;
  setIsDarkTheme: (value: boolean) => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDarkTheme, setIsDarkTheme }) => {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDarkTheme(!isDarkTheme)}
      className="w-10 h-10"
    >
      {isDarkTheme ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </Button>
  );
};

export default ThemeToggle; 