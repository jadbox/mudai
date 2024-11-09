import { useState, useCallback, useEffect } from 'react';
import type { GameState, GameMessage, Command, Case } from '../types/game';
import { medicalCases } from '../data/cases';

const SHIFT_DURATION = 600; // 10 minutes in seconds
const TIP_DELAY = 10; // seconds to wait for tip
const OPTION_DELAY = 5; // seconds to process an option
const INACTIVITY_DELAY = 20; // seconds before Hawkeye reminds you

const HAWKEYE_QUOTES = [
  "Come on, we've got lives to save here! This isn't a coffee break!",
  "I've seen snails make faster decisions! Our patient's waiting!",
  "Did you fall asleep on your feet? That's my job!",
  "The war's not getting any younger, and neither is our patient!",
  "I know the food's bad, but we can't let that slow us down!",
];

let messageIdCounter = 0;
const generateMessageId = () => `msg-${++messageIdCounter}`;

const initialState: GameState = {
  patients: [
    {
      id: '1',
      name: 'Pvt. Johnson',
      condition: 'Shrapnel wounds',
      severity: 'critical',
    },
    {
      id: '2',
      name: 'Sgt. Martinez',
      condition: 'Concussion',
      severity: 'serious',
    },
  ],
  supplies: [
    { id: '1', name: 'Morphine', type: 'medication', quantity: 10 },
    { id: '2', name: 'Surgical Kit', type: 'equipment', quantity: 3 },
    { id: '3', name: 'Bandages', type: 'equipment', quantity: 50 },
    { id: '4', name: 'Penicillin', type: 'medication', quantity: 15 },
  ],
  surgeries: 0,
  savedLives: 0,
  shiftTime: SHIFT_DURATION,
  status: 'available',
  isShiftActive: false,
  lastActionTime: Date.now(),
};

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [messages, setMessages] = useState<GameMessage[]>([
    {
      id: generateMessageId(),
      content: 'Welcome to MASH 4077! Type "help" for available commands.',
      timestamp: Date.now(),
      type: 'system',
    },
  ]);

  const addMessage = useCallback((content: string, type: GameMessage['type'] = 'info', image?: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: generateMessageId(),
        content,
        timestamp: Date.now(),
        type,
        image,
      },
    ]);
  }, []);

  const startShift = useCallback(() => {
    const randomCase = medicalCases[Math.floor(Math.random() * medicalCases.length)];
    setGameState(prev => ({
      ...prev,
      isShiftActive: true,
      shiftTime: SHIFT_DURATION,
      currentCase: randomCase,
      status: 'available',
      lastActionTime: Date.now(),
    }));
    addMessage('🔔 New shift starting! Incoming patients...', 'system', 'https://i.pinimg.com/originals/3b/0c/ee/3b0cee79173dcff1f8d3308fe9e259cb.jpg');
    addMessage(randomCase.description, 'medical');
    addMessage('\nTreatment options:', 'system');
    randomCase.options.forEach(option => {
      addMessage(`${option.id.toUpperCase()}: ${option.text}`, 'info');
    });
  }, [addMessage]);

  const handleTip = useCallback(() => {
    if (!gameState.currentCase) return;
    
    if (gameState.tipRequested) {
      addMessage('Tip already requested! Please wait...', 'error');
      return;
    }

    setGameState(prev => ({ 
      ...prev, 
      tipRequested: true, 
      tipTimer: TIP_DELAY,
      lastActionTime: Date.now(),
    }));
    addMessage('Consulting with Colonel Potter...', 'info');
    
    const correctOption = gameState.currentCase.options.find(opt => opt.isCorrect);
    
    setTimeout(() => {
      addMessage(`Colonel Potter whispers: "${gameState.currentCase?.tip}"`, 'info');
      addMessage(`Hint: Consider option ${correctOption?.id.toUpperCase()}...`, 'info');
      setGameState(prev => ({ ...prev, tipRequested: false }));
    }, TIP_DELAY * 1000);
  }, [gameState.currentCase, gameState.tipRequested, addMessage]);

  const handleOption = useCallback((optionId: string) => {
    if (!gameState.currentCase || gameState.processingOption) return;

    const option = gameState.currentCase.options.find(opt => opt.id === optionId);
    if (!option) return;

    setGameState(prev => ({ 
      ...prev, 
      processingOption: true, 
      optionTimer: OPTION_DELAY,
      lastActionTime: Date.now(),
    }));
    addMessage('Attempting treatment...', 'info');

    setTimeout(() => {
      if (option.isCorrect) {
        addMessage('✅ ' + option.feedback, 'success');
        setGameState(prev => ({
          ...prev,
          savedLives: prev.savedLives + 1,
          currentCase: undefined,
          isShiftActive: false,
          processingOption: false,
        }));
        addMessage('Patient saved! Lives saved: ' + (gameState.savedLives + 1), 'success');
      } else {
        addMessage('❌ ' + option.feedback, 'error');
        addMessage('Try again! The patient needs the right treatment.', 'system');
        setGameState(prev => ({
          ...prev,
          processingOption: false,
        }));
      }
    }, OPTION_DELAY * 1000);
  }, [gameState.currentCase, gameState.processingOption, gameState.savedLives, addMessage]);

  useEffect(() => {
    if (!gameState.isShiftActive) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.shiftTime <= 0) {
          addMessage('Shift ended! Time for some rest.', 'system');
          return { ...prev, isShiftActive: false, currentCase: undefined };
        }
        return { ...prev, shiftTime: prev.shiftTime - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.isShiftActive, addMessage]);

  useEffect(() => {
    if (!gameState.tipRequested || !gameState.tipTimer) return;

    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        tipTimer: prev.tipTimer ? prev.tipTimer - 1 : 0,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.tipRequested]);

  useEffect(() => {
    if (!gameState.processingOption || !gameState.optionTimer) return;

    const timer = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        optionTimer: prev.optionTimer ? prev.optionTimer - 1 : 0,
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.processingOption]);

  useEffect(() => {
    if (!gameState.isShiftActive || !gameState.lastActionTime) return;

    const inactivityTimer = setInterval(() => {
      const timeSinceLastAction = (Date.now() - gameState.lastActionTime) / 1000;
      if (timeSinceLastAction >= INACTIVITY_DELAY) {
        const randomQuote = HAWKEYE_QUOTES[Math.floor(Math.random() * HAWKEYE_QUOTES.length)];
        addMessage(`Hawkeye: "${randomQuote}"`, 'info');
        setGameState(prev => ({ ...prev, lastActionTime: Date.now() }));
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(inactivityTimer);
  }, [gameState.isShiftActive, gameState.lastActionTime, addMessage]);

  const processCommand = useCallback(({ command, args }: Command) => {
    setGameState(prev => ({ ...prev, lastActionTime: Date.now() }));

    switch (command.toLowerCase()) {
      case 'start-shift':
        if (gameState.isShiftActive) {
          addMessage('Shift already in progress!', 'error');
          return;
        }
        startShift();
        break;
      case 'manual':
        setGameState(prev => ({ ...prev, status: 'reading-manual' }));
        addMessage('Opening Medical Field Manual...', 'system');
        break;
      case 'tip':
        handleTip();
        break;
      case 'option':
        if (args.length < 1) {
          addMessage('Please specify an option (a, b, or c)', 'error');
          return;
        }
        handleOption(args[0]);
        break;
      case 'status':
        addMessage(
          `Shift Time: ${gameState.shiftTime}s | Lives Saved: ${gameState.savedLives} | Status: ${gameState.status}`,
          'info'
        );
        break;
      case 'help':
        addMessage(
          'Available commands:\n' +
          'start-shift - Start a new shift\n' +
          'manual - Read the Medical Field Manual\n' +
          'tip - Request a tip (10s delay)\n' +
          'option [a/b/c] - Choose treatment option\n' +
          'status - View current status\n' +
          'help - Show this help message',
          'system'
        );
        break;
      default:
        addMessage(`Unknown command: ${command}`, 'error');
    }
  }, [gameState.isShiftActive, startShift, handleTip, handleOption, addMessage]);

  return {
    gameState,
    messages,
    processCommand,
  };
}