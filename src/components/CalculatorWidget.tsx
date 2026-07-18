'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calculator, X, Delete } from 'lucide-react';

export default function CalculatorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [previousValue, setPreviousValue] = useState<string | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    // Center-right default position
    setPosition({ x: typeof window !== 'undefined' ? window.innerWidth - 320 : 0, y: 80 });
  }, []);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      });
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      const key = e.key;
      
      if (/[0-9]/.test(key)) handleNum(key);
      else if (key === '.') handleDot();
      else if (key === '+' || key === '-' || key === '*' || key === '/') {
        e.preventDefault();
        const opMap: Record<string, string> = { '+': '+', '-': '-', '*': '×', '/': '÷' };
        handleOp(opMap[key]);
      }
      else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        handleEqual();
      }
      else if (key === 'Escape') {
        setIsOpen(false);
      }
      else if (key === 'Backspace') {
        handleBackspace();
      }
      else if (key === 'Delete') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const calculate = (a: number, b: number, op: string) => {
    switch (op) {
      case '+': return a + b;
      case '-': return a - b;
      case '×': return a * b;
      case '÷': return b !== 0 ? a / b : NaN;
      default: return b;
    }
  };

  const formatResult = (res: number) => {
    if (Number.isNaN(res) || !Number.isFinite(res)) return 'Error';
    return String(Math.round(res * 100000000) / 100000000); // handle JS float issues
  };

  const handleNum = (num: string) => {
    if (waitingForNewValue) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const handleDot = () => {
    if (waitingForNewValue) {
      setDisplay('0.');
      setWaitingForNewValue(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOp = (op: string) => {
    const inputValue = parseFloat(display);

    if (previousValue == null) {
      setPreviousValue(display);
      setEquation(`${display} ${op}`);
    } else if (operation && !waitingForNewValue) {
      const result = calculate(parseFloat(previousValue), inputValue, operation);
      const resStr = formatResult(result);
      setDisplay(resStr);
      setPreviousValue(resStr);
      setEquation(`${resStr} ${op}`);
    } else {
      // Just change operation
      setEquation(`${previousValue} ${op}`);
    }
    
    setWaitingForNewValue(true);
    setOperation(op);
  };

  const handleEqual = () => {
    if (!operation || previousValue == null) return;
    
    const inputValue = parseFloat(display);
    const result = calculate(parseFloat(previousValue), inputValue, operation);
    
    setDisplay(formatResult(result));
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(true);
    setEquation('');
  };

  const handlePercent = () => {
    const val = parseFloat(display);
    if (previousValue && operation && !waitingForNewValue) {
      // e.g. 100 + 10% = 110
      const base = parseFloat(previousValue);
      const percentageValue = (base * val) / 100;
      setDisplay(formatResult(percentageValue));
    } else {
      setDisplay(formatResult(val / 100));
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setEquation('');
    setWaitingForNewValue(false);
  };

  const handleClearEntry = () => {
    setDisplay('0');
  };

  const handleBackspace = () => {
    if (waitingForNewValue) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const calculatorPopover = (
    <div 
      ref={popoverRef}
      style={{ left: position.x, top: position.y }}
      className={`fixed w-72 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/90 dark:bg-[#12121a]/95 p-4 shadow-2xl backdrop-blur-xl z-[100] ${isDragging ? 'cursor-grabbing opacity-90' : 'animate-fade-in'}`}
    >
      {/* Header Handle */}
      <div 
        className="flex items-center justify-between mb-4 px-1 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <span className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Calculadora</span>
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
          onMouseDown={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-white transition"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

          {/* Display */}
          <div className="mb-4 flex flex-col items-end justify-end rounded-2xl bg-black/5 dark:bg-black/20 p-4 h-24 border border-black/5 dark:border-white/5">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 min-h-[1rem] tracking-wider font-medium">
              {equation}
            </div>
            <div className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-white truncate w-full text-right mt-1">
              {display}
            </div>
          </div>

          {/* Buttons Grid */}
          <div className="grid grid-cols-4 gap-2">
            <button onClick={handleClearEntry} className="col-span-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 py-3 text-sm font-bold hover:bg-rose-500/20 active:scale-95 transition">CE</button>
            <button onClick={handleClear} className="col-span-1 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 py-3 text-sm font-bold hover:bg-rose-500/20 active:scale-95 transition">C</button>
            <button onClick={handleBackspace} className="col-span-1 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 py-3 text-sm font-bold hover:bg-zinc-200 dark:hover:bg-white/10 active:scale-95 transition"><Delete className="h-4 w-4" /></button>
            <button onClick={() => handleOp('÷')} className="col-span-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 py-3 text-lg font-bold hover:bg-violet-500/20 active:scale-95 transition">÷</button>

            <button onClick={() => handleNum('7')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">7</button>
            <button onClick={() => handleNum('8')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">8</button>
            <button onClick={() => handleNum('9')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">9</button>
            <button onClick={() => handleOp('×')} className="col-span-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 py-3 text-lg font-bold hover:bg-violet-500/20 active:scale-95 transition">×</button>

            <button onClick={() => handleNum('4')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">4</button>
            <button onClick={() => handleNum('5')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">5</button>
            <button onClick={() => handleNum('6')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">6</button>
            <button onClick={() => handleOp('-')} className="col-span-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 py-3 text-lg font-bold hover:bg-violet-500/20 active:scale-95 transition">-</button>

            <button onClick={() => handleNum('1')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">1</button>
            <button onClick={() => handleNum('2')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">2</button>
            <button onClick={() => handleNum('3')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">3</button>
            <button onClick={() => handleOp('+')} className="col-span-1 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 py-3 text-lg font-bold hover:bg-violet-500/20 active:scale-95 transition">+</button>

            <button onClick={handlePercent} className="col-span-1 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-600 dark:text-zinc-300 py-3 text-lg font-bold hover:bg-zinc-200 dark:hover:bg-white/10 active:scale-95 transition">%</button>
            <button onClick={() => handleNum('0')} className="col-span-1 rounded-xl bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-semibold hover:bg-zinc-100 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">0</button>
            <button onClick={handleDot} className="col-span-1 rounded-xl bg-zinc-100 dark:bg-white/5 text-zinc-800 dark:text-white py-3 text-lg font-bold hover:bg-zinc-200 dark:hover:bg-white/10 active:scale-95 transition shadow-sm">.</button>
            <button onClick={handleEqual} className="col-span-1 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white py-3 text-xl font-bold shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 active:scale-95 transition">=</button>
          </div>
        </div>
  );

  return (
    <div className="relative">
      {isOpen && isMounted && createPortal(calculatorPopover, document.body)}

      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`rounded-xl border border-zinc-200 dark:border-white/10 p-2 transition-all duration-200 shadow-sm dark:shadow-none ${
          isOpen 
            ? 'bg-zinc-100 dark:bg-white/5 text-zinc-900 dark:text-white' 
            : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white'
        }`}
        title="Calculadora"
      >
        <Calculator className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}
