import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Send,
  HelpCircle,
  FileText,
  Lightbulb,
  CheckSquare,
  Layers,
  BookOpen,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Trash2,
  Copy,
  Check,
  Bot,
  User as UserIcon,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ChatMessage, AssistantMode, QuizData, FlashcardDeck, UserProfile } from '../../types';
import { AIService } from '../../services/aiService';
import { AudioService } from '../../services/audioService';

interface AIAssistantViewProps {
  messages: ChatMessage[];
  profile: UserProfile;
  onSendMessage: (msg: ChatMessage) => void;
  onClearHistory: () => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  messages,
  profile,
  onSendMessage,
  onClearHistory,
}) => {
  const safeMessages = messages || [];
  const [inputText, setInputText] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>(profile.primarySubject || 'Computer Science');
  const [activeMode, setActiveMode] = useState<AssistantMode>('chat');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Interactive Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Interactive Flashcards State
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isCardFlipped, setIsCardFlipped] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickActionModes: { id: AssistantMode; label: string; icon: React.FC<{ className?: string }>; placeholder: string }[] = [
    { id: 'quiz', label: 'Practice Quiz', icon: HelpCircle, placeholder: 'Enter topic or paste notes to generate 5 MCQs...' },
    { id: 'summarize', label: 'Summarize Notes', icon: FileText, placeholder: 'Paste textbook text or lecture notes to summarize...' },
    { id: 'explain', label: 'Explain Topic', icon: Lightbulb, placeholder: 'What concept is confusing? (e.g. Backpropagation, Recursion)...' },
    { id: 'important_questions', label: 'Exam Questions', icon: CheckSquare, placeholder: 'Enter chapter/subject for top exam questions...' },
    { id: 'flashcards', label: 'Flashcards', icon: Layers, placeholder: 'Enter topic to generate memory flashcard deck...' },
    { id: 'revision_notes', label: 'Cheat Sheet', icon: BookOpen, placeholder: 'Enter topic for a high-yield revision cheat sheet...' },
  ];

  const handleSend = async (customPrompt?: string, modeOverride?: AssistantMode) => {
    const textToSend = (customPrompt || inputText).trim();
    if (!textToSend || isLoading) return;

    const mode = modeOverride || activeMode;
    AudioService.playTap();

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: 'user',
      timestamp: new Date().toISOString(),
      mode,
      text: textToSend,
    };
    onSendMessage(userMsg);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await AIService.askAssistant({
        mode,
        subject: selectedSubject,
        input: textToSend,
        query: textToSend,
      });

      const assistantMsg: ChatMessage = {
        id: 'msg-res-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        mode,
      };

      if (mode === 'quiz' || mode === 'mcq') {
        if (typeof response.result === 'object' && 'questions' in response.result) {
          assistantMsg.quizData = response.result as QuizData;
          assistantMsg.text = `Here is your practice quiz on **${selectedSubject}**! Answer each question below to test your active recall.`;
        } else {
          assistantMsg.text = String(response.result);
        }
      } else if (mode === 'flashcards') {
        if (typeof response.result === 'object' && 'cards' in response.result) {
          assistantMsg.flashcardDeck = response.result as FlashcardDeck;
          assistantMsg.text = `Generated ${assistantMsg.flashcardDeck.cards.length} flashcards for **${selectedSubject}**. Flip each card to test your memory!`;
        } else {
          assistantMsg.text = String(response.result);
        }
      } else {
        assistantMsg.text = String(response.result);
      }

      onSendMessage(assistantMsg);
      AudioService.playCompletionChime();
    } catch (err: any) {
      console.error(err);
      onSendMessage({
        id: 'msg-err-' + Date.now(),
        sender: 'assistant',
        timestamp: new Date().toISOString(),
        text: 'AI service is currently unavailable. Please check your connection or API configuration.',
        isError: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    AudioService.playTap();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectQuizAnswer = (qId: string, optIdx: number) => {
    if (quizSubmitted) return;
    AudioService.playTap();
    setQuizAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const handleGradeQuiz = (quiz: QuizData) => {
    AudioService.playTap();
    setQuizSubmitted(true);
    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) correctCount++;
    });

    if (correctCount === quiz.questions.length) {
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }
    AudioService.playCompletionChime();
  };

  const handleResetQuiz = () => {
    AudioService.playTap();
    setQuizAnswers({});
    setQuizSubmitted(false);
  };

  const currentPlaceholder =
    quickActionModes.find((m) => m.id === activeMode)?.placeholder ||
    'Ask your FocusGuard study tutor anything...';

  return (
    <div className="flex flex-col h-[calc(100vh-190px)] min-h-[450px] max-h-[850px] space-y-3 pb-1">
      {/* Header & Subject Context */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-sky-600/25">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5">
              FocusGuard AI Assistant
              <span className="text-[10px] bg-sky-500/20 text-sky-300 font-semibold px-2 py-0.2 rounded-md border border-sky-500/30">
                Gemini 3.7
              </span>
            </h2>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <span>Subject:</span>
              <input
                type="text"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                placeholder="Subject..."
                className="bg-slate-800/80 px-2 py-0.5 rounded text-white text-[11px] focus:outline-none border border-slate-700 w-36"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            AudioService.playTap();
            if (confirm('Clear chat history?')) {
              onClearHistory();
            }
          }}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition"
          title="Clear Chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Action Mode Selector Chips */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 shrink-0 scrollbar-none">
        {quickActionModes.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.id;
          return (
            <button
              key={mode.id}
              onClick={() => {
                AudioService.playTap();
                setActiveMode(mode.id);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border flex items-center gap-1.5 transition ${
                isActive
                  ? 'bg-sky-600 text-white border-sky-500 shadow-md shadow-sky-600/30'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 text-slate-100">
        {safeMessages.length === 0 && (
          <div className="text-center py-8 px-4 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4 my-auto">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">FocusGuard AI Study Tutor</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Ask doubts, generate custom interactive quizzes, flip flashcards, or get simplified concept explanations.
              </p>
            </div>

            <div className="pt-2 text-left max-w-md mx-auto space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 block">Try asking:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { label: 'Generate 5 MCQs on OOP', mode: 'quiz' as AssistantMode, text: 'Generate 5 practice MCQs on Object Oriented Programming' },
                  { label: 'Explain Backpropagation', mode: 'explain' as AssistantMode, text: 'Explain Backpropagation simply with an analogy' },
                  { label: 'Java Memory Cheat Sheet', mode: 'revision_notes' as AssistantMode, text: 'Create a cheat sheet for JVM Memory & Garbage Collection' },
                  { label: 'Top 5 Exam Questions on Trees', mode: 'important_questions' as AssistantMode, text: 'What are the top 5 high-yield exam questions on Binary Trees?' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveMode(item.mode);
                      handleSend(item.text, item.mode);
                    }}
                    className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-slate-300 text-left transition hover:border-sky-500/50 flex items-center justify-between group"
                  >
                    <span className="truncate pr-1">{item.label}</span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-sky-400 shrink-0 transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {safeMessages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                isAssistant ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAssistant && (
                <div className="w-7 h-7 rounded-xl bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-3xl p-4 space-y-2.5 ${
                  isAssistant
                    ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/20 rounded-tr-xs'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between text-[10px] opacity-70">
                  <span className="font-semibold">{isAssistant ? 'Study Assistant' : 'You'}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Text Content */}
                {msg.text && (
                  <div className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.text}
                  </div>
                )}

                {/* Interactive Quiz Renderer */}
                {msg.quizData && (
                  <div className="mt-3 space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" />
                        {msg.quizData.title}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {msg.quizData.questions.length} Questions
                      </span>
                    </div>

                    <div className="space-y-4">
                      {msg.quizData.questions.map((q, qIdx) => {
                        const selectedOpt = quizAnswers[q.id];
                        const isCorrect = selectedOpt === q.correctIndex;

                        return (
                          <div key={q.id || qIdx} className="space-y-2">
                            <p className="text-xs font-semibold text-white">
                              {qIdx + 1}. {q.question}
                            </p>

                            <div className="space-y-1.5">
                              {q.options.map((opt, oIdx) => {
                                const isChosen = selectedOpt === oIdx;
                                const isActualCorrect = q.correctIndex === oIdx;

                                let btnStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                                if (quizSubmitted) {
                                  if (isActualCorrect) {
                                    btnStyle = 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300 font-bold';
                                  } else if (isChosen && !isCorrect) {
                                    btnStyle = 'bg-rose-950/80 border-rose-500/80 text-rose-300';
                                  }
                                } else if (isChosen) {
                                  btnStyle = 'bg-sky-600/30 border-sky-500 text-sky-200 font-bold';
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    type="button"
                                    onClick={() => handleSelectQuizAnswer(q.id, oIdx)}
                                    className={`w-full text-left p-2.5 rounded-xl border text-xs transition flex items-center justify-between ${btnStyle}`}
                                  >
                                    <span>{opt}</span>
                                    {quizSubmitted && isActualCorrect && (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                    )}
                                    {quizSubmitted && isChosen && !isCorrect && (
                                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>

                            {quizSubmitted && q.explanation && (
                              <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[11px] text-slate-300">
                                💡 <strong>Explanation:</strong> {q.explanation}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                      {!quizSubmitted ? (
                        <button
                          onClick={() => handleGradeQuiz(msg.quizData!)}
                          className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition"
                        >
                          Submit & Check Answers
                        </button>
                      ) : (
                        <button
                          onClick={handleResetQuiz}
                          className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1 transition"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Retake Quiz
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Interactive Flashcard Deck Renderer */}
                {msg.flashcardDeck && (
                  <div className="mt-3 space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4" />
                        {msg.flashcardDeck.deckTitle}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        Card {currentCardIndex + 1} of {msg.flashcardDeck.cards.length}
                      </span>
                    </div>

                    {msg.flashcardDeck.cards.length > 0 && (
                      <div
                        onClick={() => {
                          AudioService.playTap();
                          setIsCardFlipped(!isCardFlipped);
                        }}
                        className="h-44 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950/70 border border-slate-700/80 p-5 flex flex-col items-center justify-center text-center cursor-pointer shadow-lg hover:border-sky-500/50 transition duration-300 relative group"
                      >
                        <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-full border border-sky-800/40 absolute top-3 left-3">
                          {isCardFlipped ? 'Answer (Back)' : 'Question (Front)'}
                        </span>

                        <p className="text-sm sm:text-base font-bold text-white max-w-sm px-2">
                          {isCardFlipped
                            ? msg.flashcardDeck.cards[currentCardIndex]?.back
                            : msg.flashcardDeck.cards[currentCardIndex]?.front}
                        </p>

                        {!isCardFlipped && msg.flashcardDeck.cards[currentCardIndex]?.hint && (
                          <span className="text-[11px] text-slate-400 mt-2">
                            💡 Hint: {msg.flashcardDeck.cards[currentCardIndex]?.hint}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 absolute bottom-2 group-hover:text-slate-300 transition">
                          Tap to flip 🔄
                        </span>
                      </div>
                    )}

                    {/* Carousel Controls */}
                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={() => {
                          AudioService.playTap();
                          setIsCardFlipped(false);
                          setCurrentCardIndex((prev) => Math.max(0, prev - 1));
                        }}
                        disabled={currentCardIndex === 0}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 font-semibold"
                      >
                        Previous
                      </button>

                      <span className="text-xs text-slate-400 font-mono">
                        {currentCardIndex + 1} / {msg.flashcardDeck.cards.length}
                      </span>

                      <button
                        onClick={() => {
                          AudioService.playTap();
                          setIsCardFlipped(false);
                          setCurrentCardIndex((prev) =>
                            Math.min(msg.flashcardDeck!.cards.length - 1, prev + 1)
                          );
                        }}
                        disabled={currentCardIndex === msg.flashcardDeck.cards.length - 1}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs text-slate-300 font-semibold"
                      >
                        Next Card
                      </button>
                    </div>
                  </div>
                )}

                {/* Copy button */}
                {isAssistant && msg.text && (
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopyText(msg.text || '', msg.id)}
                      className="text-[10px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Notes</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-7 h-7 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/40 flex items-center justify-center shrink-0 mt-0.5">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center space-x-2 text-xs text-sky-400 bg-slate-900 border border-slate-800 rounded-2xl p-3 w-max">
            <div className="w-4 h-4 border-2 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
            <span>FocusGuard AI is thinking & synthesizing study materials...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center gap-2 shrink-0 shadow-xl"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={currentPlaceholder}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white transition shadow-md shadow-sky-600/30"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
