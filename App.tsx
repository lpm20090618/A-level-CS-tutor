
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import QuizMode from './components/QuizMode';
import GraderMode from './components/GraderMode';
import CodeSandbox from './components/CodeSandbox';
import { AppMode, UserStats, Theme, Language } from './types';

const App: React.FC = () => {
  const [currentMode, setCurrentMode] = useState<AppMode>(AppMode.Chat);
  const [stats, setStats] = useState<UserStats>({
    points: 0,
    streak: 0,
    lastLogin: new Date().toISOString(),
    quizzesTaken: 0
  });
  const [theme, setTheme] = useState<Theme>('dark');
  const [language, setLanguage] = useState<Language>('en');

  // Load stats and theme from local storage
  useEffect(() => {
    const savedStats = localStorage.getItem('9618_tutor_stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      // Check streak logic
      const last = new Date(parsed.lastLogin);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 3600 * 24));
      
      let newStreak = parsed.streak;
      if (diffDays === 1) newStreak++;
      else if (diffDays > 1) newStreak = 0;
      
      setStats({
        ...parsed,
        streak: newStreak,
        lastLogin: now.toISOString()
      });
    } else {
      localStorage.setItem('9618_tutor_stats', JSON.stringify(stats));
    }

    const savedTheme = localStorage.getItem('9618_theme') as Theme;
    if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
        // Default to dark
        document.documentElement.classList.add('dark');
    }

    const savedLang = localStorage.getItem('9618_lang') as Language;
    if (savedLang) {
        setLanguage(savedLang);
    }
  }, []);

  // Save stats when updated
  useEffect(() => {
    localStorage.setItem('9618_tutor_stats', JSON.stringify(stats));
  }, [stats]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.altKey) {
            if (e.key === '1') setCurrentMode(AppMode.Chat);
            if (e.key === '2') setCurrentMode(AppMode.Quiz);
            if (e.key === '3') setCurrentMode(AppMode.Grader);
            if (e.key === '4') setCurrentMode(AppMode.Sandbox);
        }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('9618_theme', newTheme);
  };

  const toggleLanguage = () => {
      const newLang = language === 'en' ? 'zh' : 'en';
      setLanguage(newLang);
      localStorage.setItem('9618_lang', newLang);
  };

  const handleQuizComplete = (pointsEarned: number) => {
    setStats(prev => ({
      ...prev,
      points: prev.points + pointsEarned,
      quizzesTaken: prev.quizzesTaken + 1
    }));
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F2F2F7] dark:bg-black flex items-center justify-center relative transition-colors duration-500 selection:bg-blue-500/30 font-sans">
      {/* Ambient Background Effects - Centered relative to screen */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vh] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }}></div>
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vh] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>

      {/* Main App Floating Wrapper */}
      <div className="w-[96vw] h-[92vh] md:w-[94vw] md:h-[90vh] max-w-[1700px] flex flex-row gap-4 md:gap-6 z-20">
        
        {/* Sidebar */}
        <div className="flex-shrink-0 h-full">
            <Sidebar 
                currentMode={currentMode} 
                setMode={setCurrentMode} 
                stats={stats} 
                theme={theme}
                toggleTheme={toggleTheme}
                language={language}
                toggleLanguage={toggleLanguage}
            />
        </div>
        
        {/* Main Content Area */}
        <main className="flex-1 h-full relative rounded-[2.5rem] bg-white dark:bg-[#1C1C1E] shadow-apple dark:shadow-apple-dark border border-white/50 dark:border-white/5 ring-1 ring-black/5 dark:ring-white/5 overflow-hidden transition-colors duration-300">
            {currentMode === AppMode.Chat && <ChatArea language={language} />}
            {currentMode === AppMode.Quiz && <QuizMode updateStats={handleQuizComplete} language={language} />}
            {currentMode === AppMode.Grader && <GraderMode language={language} />}
            {currentMode === AppMode.Sandbox && <CodeSandbox language={language} />}
        </main>
      </div>
    </div>
  );
};

export default App;
