import React, { createContext, useContext, useState, useEffect } from 'react';
import { TestDriveRun, UserMode } from '@deep-age/shared';
import { ApiService } from '@/services/api';
import { env } from '@/config/env';

export interface ITestDriveContext {
  url: string;
  setUrl: (url: string) => void;
  task: string;
  setTask: (task: string) => void;
  isLoading: boolean;
  activeRun: TestDriveRun | null;
  startTestDrive: (customUrl?: string, customTask?: string, customMode?: UserMode) => Promise<void>;
  runDemoScenario: (enableAddToCart: boolean, currentMode?: UserMode) => Promise<void>;
  isDark: boolean;
  toggleTheme: () => void;
  showMcpModal: boolean;
  setShowMcpModal: (show: boolean) => void;
}

const TestDriveContext = createContext<ITestDriveContext | undefined>(undefined);

export const TestDriveProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [url, setUrl] = useState<string>(env.demoUrl);
  const [task, setTask] = useState<string>('Find a laptop under ₹80,000 with 16GB RAM and add it to the cart');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeRun, setActiveRun] = useState<TestDriveRun | null>(null);
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showMcpModal, setShowMcpModal] = useState<boolean>(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  // Automatically start initial baseline run on first load for instant rich dashboard
  useEffect(() => {
    if (!activeRun && !isLoading) {
      startTestDrive(env.demoUrl, task, 'explore').catch((e) =>
        console.log('Auto-initialization fallback:', e)
      );
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const startTestDrive = async (
    targetUrl: string = url,
    targetTask: string = task,
    targetMode: UserMode = 'debug'
  ) => {
    setIsLoading(true);
    try {
      const createdRun = await ApiService.createTestDrive(targetUrl, targetTask, targetMode);
      const executedRun = await ApiService.executeTestDrive(createdRun.id);
      setActiveRun(executedRun);
    } catch (err) {
      console.error('Failed to run test drive:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runDemoScenario = async (enableAddToCart: boolean, currentMode: UserMode = 'debug') => {
    await ApiService.toggleDemoCapability(enableAddToCart);
    setUrl(env.demoUrl);
    await startTestDrive(env.demoUrl, task, currentMode);
  };

  return (
    <TestDriveContext.Provider
      value={{
        url,
        setUrl,
        task,
        setTask,
        isLoading,
        activeRun,
        startTestDrive,
        runDemoScenario,
        isDark,
        toggleTheme,
        showMcpModal,
        setShowMcpModal,
      }}
    >
      {children}
    </TestDriveContext.Provider>
  );
};

export function useTestDriveContext(): ITestDriveContext {
  const context = useContext(TestDriveContext);
  if (!context) {
    throw new Error('useTestDriveContext must be used within a TestDriveProvider');
  }
  return context;
}

