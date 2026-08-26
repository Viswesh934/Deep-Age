import { useState } from 'react';
import { TestDriveRun, UserMode } from '@deep-age/shared';
import { ApiService } from '../services/api.js';
import { env } from '../config/env.js';

export type TabKey = 'webmcp' | 'network' | 'dom' | 'errors' | 'security' | 'recommendations';

export function useTestDrive() {
  const [mode, setMode] = useState<UserMode>('debug');
  const [url, setUrl] = useState(env.demoUrl);
  const [task, setTask] = useState('Find a laptop under ₹80,000 with 16GB RAM and add it to the cart');
  const [isLoading, setIsLoading] = useState(false);
  const [activeRun, setActiveRun] = useState<TestDriveRun | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('webmcp');

  const startTestDrive = async (targetUrl = url, targetTask = task, targetMode = mode) => {
    setIsLoading(true);
    try {
      const createdRun = await ApiService.createTestDrive(targetUrl, targetTask, targetMode);
      const executedRun = await ApiService.executeTestDrive(createdRun.id);
      setActiveRun(executedRun);

      if (targetMode === 'inspect') setActiveTab('security');
      else if (targetMode === 'explore') setActiveTab('recommendations');
      else setActiveTab('webmcp');
    } catch (err) {
      console.error('Failed to run test drive:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const runDemoScenario = async (enableAddToCart: boolean) => {
    await ApiService.toggleDemoCapability(enableAddToCart);
    setUrl(env.demoUrl);
    await startTestDrive(env.demoUrl, task, mode);
  };

  const handleModeChange = (newMode: UserMode) => {
    setMode(newMode);
    if (activeRun) {
      if (newMode === 'inspect') setActiveTab('security');
      else if (newMode === 'explore') setActiveTab('recommendations');
      else setActiveTab('webmcp');
    }
  };

  return {
    mode,
    setMode: handleModeChange,
    url,
    setUrl,
    task,
    setTask,
    isLoading,
    activeRun,
    activeTab,
    setActiveTab,
    startTestDrive,
    runDemoScenario,
  };
}
