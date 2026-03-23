import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, ArrowRight, ArrowLeft, Settings, Database, 
  Upload, Download, Trash2, Building2, Hospital, Home, 
  Castle, Check, Sparkles, Hexagon, Cpu
} from 'lucide-react';

type View = 'home' | 'scenes' | 'rules';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isShaking, setIsShaking] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);
  };

  const handleNext = (view: View) => {
    triggerShake();
    setCurrentView(view);
  };

  return (
    <div onMouseMove={handleMouseMove} className={`min-h-screen bg-[#050508] text-gray-200 font-sans overflow-hidden relative flex items-center justify-center p-4 md:p-8 ${isShaking ? 'animate-shake' : ''}`}>
      {/* Ambient Background Glows & Effects */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Parallax Layer 1: Grid & Dot Matrix */}
        <motion.div 
          animate={{ x: mousePos.x * -0.01, y: mousePos.y * -0.01 }}
          className="absolute inset-[-5%] w-[110%] h-[110%] bg-grid-pattern opacity-40"
        />
        <div className="absolute inset-0 bg-dot-matrix opacity-[0.03]"></div>

        {/* Scanline */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="w-full h-[2px] bg-cyan-500/50 blur-[1px] animate-scanline shadow-[0_0_15px_rgba(6,182,212,0.8)]"></div>
        </div>

        {/* Parallax Layer 2: Vortex */}
        <motion.div 
          animate={{ x: mousePos.x * -0.03, y: mousePos.y * -0.03 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] md:w-[100vw] md:h-[100vw] opacity-30"
        >
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
            className="w-full h-full rounded-full bg-[conic-gradient(from_0deg,transparent_0%,rgba(168,85,247,0.15)_25%,transparent_50%,rgba(6,182,212,0.15)_75%,transparent_100%)] blur-[100px]"
          />
        </motion.div>

        {/* Floating Orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-purple-600/10 blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-600/10 blur-[120px] animate-float-delayed" />
        <div className="absolute top-[40%] left-[40%] w-[20vw] h-[20vw] rounded-full bg-indigo-500/5 blur-[100px] animate-pulse" />

        {/* Terminal Snippets */}
        <TerminalSnippets />

        {/* Subtle grid overlay / Noise */}
        <div className="absolute inset-[-10%] w-[120%] h-[120%] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] mix-blend-overlay animate-noise"></div>
      </div>

      {/* Main Container */}
      <motion.div 
        layout
        className="relative z-10 w-full max-w-6xl h-[85vh] md:h-[800px] glass-panel rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] chromatic-border"
      >
        {/* Border Drawing Animation */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl z-20" style={{ borderRadius: '1.5rem' }}>
          <rect x="1" y="1" width="100%" height="100%" rx="24" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="2" className="animate-draw-line" />
        </svg>

        {/* Internal Container Effects */}
        <ShatteredGlassEffect />
        <FloatingRunes />
        <SideDecorations />

        <AnimatePresence mode="wait">
          {currentView === 'home' && <HomeView onNext={() => handleNext('scenes')} />}
          {currentView === 'scenes' && <SceneView onPrev={() => handleNext('home')} onNext={() => handleNext('rules')} />}
          {currentView === 'rules' && <RuleView onPrev={() => handleNext('scenes')} onNext={() => handleNext('home')} />}
        </AnimatePresence>
      </motion.div>

      {/* Global Floating Buttons */}
      <div className="fixed bottom-6 left-6 z-20">
        <MagneticButton 
          className="btn-pulse-subtle flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Trash2 size={16} />
          <ScrambleText text="清除编年史" />
        </MagneticButton>
      </div>
      <div className="fixed bottom-6 right-6 z-20">
        <MagneticButton 
          className="btn-pulse-subtle p-3 rounded-full glass-panel text-gray-400 hover:text-white transition-colors"
        >
          <Settings size={20} />
        </MagneticButton>
      </div>

      <CoordinateTracker x={mousePos.x} y={mousePos.y} />
    </div>
  );
}

// --- HOME VIEW ---
function HomeView({ onNext }: { onNext: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col p-6 md:p-8 relative h-full"
    >
      {/* 3-Column Layout for Desktop */}
      <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 w-full">
        
        {/* Left Panel: System Status */}
        <div className="hidden lg:flex flex-col w-64 gap-6 opacity-80">
          <div className="border-b border-purple-500/30 pb-2 mb-2">
            <h3 className="text-xs font-mono text-purple-400 tracking-[0.2em] uppercase flex items-center gap-2 chromatic-text">
              <Cpu size={14} /> <ScrambleText text="System.Status" />
            </h3>
          </div>
          <StatusItem label="Neural Sync" value="99.9%" progress={100} color="bg-purple-500" />
          <StatusItem label="Reality Distortion" value="12.4%" progress={12} color="bg-cyan-500" />
          <StatusItem label="Active Directives" value="05" progress={50} color="bg-indigo-500" />
          
          <div className="mt-6 border-b border-purple-500/30 pb-2 mb-2">
            <h3 className="text-xs font-mono text-purple-400 tracking-[0.2em] uppercase flex items-center gap-2 chromatic-text">
              <Database size={14} /> <ScrambleText text="Core.Modules" />
            </h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {['SCENE_GEN', 'RULE_ENFORCE', 'LOG_SYNC', 'MEM_DUMP'].map(mod => (
              <span key={mod} className="text-[10px] font-mono px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded text-purple-300 chromatic-text"><ScrambleText text={mod} /></span>
            ))}
          </div>
        </div>

        {/* Center Panel: The Book */}
        <div className="flex flex-col items-center">
          {/* Center Card */}
          <div className="relative group">
            {/* Glowing border effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/30 to-cyan-500/30 rounded-3xl blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            
            <div className="relative w-[300px] h-[340px] md:w-[380px] md:h-[420px] glass-panel rounded-3xl flex flex-col items-center justify-center p-8 overflow-hidden">
              {/* Inner subtle lines */}
              <div className="absolute inset-4 border border-white/5 rounded-2xl pointer-events-none"></div>
              <div className="absolute inset-8 border border-white/5 rounded-xl pointer-events-none"></div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative"
              >
                <div className="absolute inset-0 bg-cyan-400/20 blur-2xl rounded-full"></div>
                <BookOpen size={64} className="text-gray-200 relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="mt-8 text-center"
              >
                <h1 className="text-4xl font-bold tracking-wider text-white drop-shadow-md mb-2 chromatic-text"><ScrambleText text="规则之书" /></h1>
                <p className="text-xs tracking-[0.3em] text-gray-400 uppercase neon-text font-semibold chromatic-text"><ScrambleText text="Rule.Modifier" /></p>
              </motion.div>

              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="mt-12"
              >
                <p className="text-sm text-gray-400 tracking-widest"><ScrambleText text="在这个世界，规则即是力量" /></p>
              </motion.div>
            </div>
          </div>

          {/* Main Action */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-10 relative group"
          >
            {/* Continuous Pulse Ring */}
            <motion.div
              animate={{ 
                scale: [1, 1.3], 
                opacity: [0.5, 0] 
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeOut" 
              }}
              className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 blur-sm"
            />
            <MagneticButton
              onClick={onNext}
              className="relative px-8 py-4 rounded-full bg-black/40 border border-purple-500/40 hover:border-purple-400 text-white font-medium flex items-center gap-3 backdrop-blur-xl transition-all group"
            >
              <ScrambleText text="开始阅读" />
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </MagneticButton>
          </motion.div>
        </div>

        {/* Right Panel: Event Logs */}
        <div className="hidden lg:flex flex-col w-64 gap-6 opacity-80">
          <div className="border-b border-cyan-500/30 pb-2 mb-2">
            <h3 className="text-xs font-mono text-cyan-400 tracking-[0.2em] uppercase flex items-center gap-2 chromatic-text">
              <Hexagon size={14} /> <ScrambleText text="Event.Logs" />
            </h3>
          </div>
          <div className="flex flex-col gap-4">
            <LogItem time="00:00" msg="System initialized." />
            <LogItem time="00:01" msg="Reality anchor stabilized." />
            <LogItem time="00:03" msg="Awaiting user input..." highlight />
          </div>

          <div className="mt-6 border-b border-cyan-500/30 pb-2 mb-2">
            <h3 className="text-xs font-mono text-cyan-400 tracking-[0.2em] uppercase flex items-center gap-2 chromatic-text">
              <Database size={14} /> <ScrambleText text="Quick.Stats" />
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center">
              <div className="text-2xl font-mono text-cyan-300">24</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 chromatic-text"><ScrambleText text="Scenes" /></div>
            </div>
            <div className="bg-black/20 p-3 rounded-lg border border-white/5 flex flex-col items-center justify-center">
              <div className="text-2xl font-mono text-purple-300">128</div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 chromatic-text"><ScrambleText text="Rules" /></div>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Actions */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        className="mt-auto pt-6 flex flex-wrap justify-center gap-4"
      >
        <ActionButton icon={<Database size={16} />} text="读取开场预设" />
        <ActionButton icon={<Upload size={16} />} text="导出 JSON" />
        <ActionButton icon={<Download size={16} />} text="导入 JSON" />
      </motion.div>
    </motion.div>
  );
}

// --- SCENE VIEW ---
function SceneView({ onPrev, onNext }: { onPrev: () => void, onNext: () => void }) {
  const scenes = [
    { id: 1, title: '圣华女子学院', desc: '一所 prestigious 的贵族女子学校，学生们都在这里接受精英教育', icon: <Building2 size={24} /> },
    { id: 2, title: '未来科技公司', desc: '一家高科技公司，员工们在这里开发着改变世界的技术', icon: <Cpu size={24} /> },
    { id: 3, title: '圣玛利亚医院', desc: '一家大型综合医院，各种离奇的故事在这里发生', icon: <Hospital size={24} /> },
    { id: 4, title: '樱庄公寓', desc: '一栋普通的公寓楼，住着形形色色的租客', icon: <Home size={24} /> },
    { id: 5, title: '夜之城堡', desc: '一座神秘的古老城堡，传说中住着吸血鬼', icon: <Castle size={24} /> },
  ];

  const [selected, setSelected] = useState<number | null>(1);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col h-full"
    >
      <Header title="场景" onPrev={onPrev} onNext={onNext} />
      
      <div className="px-8 md:px-12 pt-4 pb-8 flex-1 overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 chromatic-text">
            <ScrambleText text="场景" /> <Sparkles size={24} className="text-purple-400" />
          </h2>
          <p className="text-gray-400 text-sm chromatic-text"><ScrambleText text="选择故事发生的地点与氛围..." /></p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenes.map((scene, i) => (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              onClick={() => setSelected(scene.id)}
              className={`relative group cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                selected === scene.id 
                  ? 'bg-purple-500/10 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.15)]' 
                  : 'glass-panel glass-panel-hover'
              }`}
            >
              {/* Active Glow */}
              {selected === scene.id && (
                <motion.div layoutId="scene-active" className="absolute inset-0 border-2 border-purple-500/50 rounded-2xl pointer-events-none" />
              )}
              
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${selected === scene.id ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-gray-400 group-hover:text-gray-200'}`}>
                  {scene.icon}
                </div>
                <div>
                  <h3 className={`text-lg font-bold mb-1 ${selected === scene.id ? 'text-white chromatic-text' : 'text-gray-200'}`}>
                    <ScrambleText text={scene.title} />
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed"><ScrambleText text={scene.desc} /></p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-white/5 flex gap-4 bg-black/20 backdrop-blur-md">
        <ActionButton icon={<Database size={16} />} text="从场景库取用" />
        <ActionButton icon={<BookOpen size={16} />} text="将当前描述加入场景库" />
      </div>
    </motion.div>
  );
}

// --- RULE VIEW ---
function RuleView({ onPrev, onNext }: { onPrev: () => void, onNext: () => void }) {
  const rules = [
    { id: 1, title: '感官放大法则', desc: '所有处于发情状态的个体，其痛觉将转化为快感，触觉敏感度提升三倍' },
    { id: 2, title: '绝对服从契约', desc: '下级必须无条件服从上级的直接命令，即使违背常理' },
    { id: 3, title: '强制发情期', desc: '每个月的第一天，所有成年人都会进入无法抑制的发情状态' },
    { id: 4, title: '禁止隐私', desc: '所有人的思想可以被他人读取，谎言将无所遁形' },
    { id: 5, title: '猫娘语癖', desc: '所有女性说话最后一个字必须用喵结尾' },
  ];

  const [selectedRules, setSelectedRules] = useState<number[]>([1, 2]);

  const toggleRule = (id: number) => {
    setSelectedRules(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col h-full"
    >
      <Header title="世界规则" onPrev={onPrev} onNext={onNext} />
      
      <div className="px-8 md:px-12 pt-4 pb-8 flex-1 overflow-y-auto custom-scrollbar">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3 chromatic-text">
            <ScrambleText text="世界规则" /> <Hexagon size={24} className="text-cyan-400" />
          </h2>
          <p className="text-gray-400 text-sm chromatic-text"><ScrambleText text="选择将在世界中生效的基础法则..." /></p>
        </motion.div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 chromatic-text"><ScrambleText text="预设规则" /></h3>
          
          {rules.map((rule, i) => {
            const isSelected = selectedRules.includes(rule.id);
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                onClick={() => toggleRule(rule.id)}
                className={`group relative cursor-pointer rounded-2xl p-5 flex items-center gap-5 transition-all duration-300 ${
                  isSelected 
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                    : 'glass-panel glass-panel-hover'
                }`}
              >
                {/* Checkbox */}
                <MagneticButton className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                  isSelected ? 'bg-cyan-500 border-cyan-400' : 'border-gray-600 bg-black/20 group-hover:border-gray-400'
                }`}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                      >
                        <Check size={16} className="text-black stroke-[3]" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </MagneticButton>

                <div className="flex-1">
                  <h3 className={`text-base font-bold mb-1 transition-colors ${isSelected ? 'text-white chromatic-text' : 'text-gray-200'}`}>
                    <ScrambleText text={rule.title} />
                  </h3>
                  <p className="text-xs text-gray-400"><ScrambleText text={rule.desc} /></p>
                </div>
                
                {/* Active side glow */}
                {isSelected && (
                  <motion.div 
                    layoutId="rule-active-indicator"
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-cyan-400 rounded-r-full shadow-[0_0_10px_rgba(6,182,212,0.8)]" 
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

// --- SHARED COMPONENTS ---

function Header({ title, onPrev, onNext }: { title: string, onPrev: () => void, onNext: () => void }) {
  return (
    <div className="flex items-center justify-between p-6 md:px-8 border-b border-white/5 bg-black/10 backdrop-blur-sm">
      <MagneticButton 
        onClick={onPrev}
        className="btn-pulse-subtle w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
      </MagneticButton>
      
      <span className="font-semibold text-sm tracking-widest text-gray-400 chromatic-text"><ScrambleText text={title} /></span>
      
      <MagneticButton 
        onClick={onNext}
        className="btn-pulse-subtle w-10 h-10 rounded-full glass-panel flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <ArrowRight size={18} />
      </MagneticButton>
    </div>
  );
}

function ActionButton({ icon, text, onClick }: { icon: React.ReactNode, text: string, onClick?: () => void }) {
  return (
    <MagneticButton 
      onClick={onClick}
      className="btn-pulse-subtle flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel text-sm text-gray-300 hover:text-white transition-colors border border-white/5 hover:border-white/20"
    >
      {icon}
      <ScrambleText text={text} />
    </MagneticButton>
  );
}

// --- BACKGROUND EFFECTS ---

function ShatteredGlassEffect() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Top Left Cracks */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] opacity-70">
        <svg width="100%" height="100%" viewBox="0 0 400 400" preserveAspectRatio="none">
          <path d="M0,0 L150,80 L130,150 L280,250 L240,320 L400,380" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M0,100 L80,120 L60,220 L180,280 L150,400" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M150,80 L200,40 L350,90" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {/* Shards */}
          <polygon points="0,0 150,80 0,100" fill="rgba(6,182,212,0.05)" />
          <polygon points="150,80 130,150 80,120" fill="rgba(168,85,247,0.05)" />
          <polygon points="130,150 280,250 180,280 60,220" fill="rgba(255,255,255,0.03)" />
        </svg>
        <div className="absolute top-[15%] left-[20%] text-[10px] font-mono text-cyan-400/60 rotate-[15deg] animate-glitch">ERR_0x00FA</div>
        <div className="absolute top-[35%] left-[10%] text-[12px] font-mono text-purple-400/50 -rotate-[25deg] animate-glitch-delayed">SYS_FRAG</div>
        <div className="absolute top-[50%] left-[35%] text-[14px] font-mono text-white/30 rotate-[45deg]">Δ</div>
        <div className="absolute top-[25%] left-[40%] text-[8px] font-mono text-cyan-300/40 rotate-[5deg] animate-pulse">NULL_PTR</div>
      </div>

      {/* Bottom Right Cracks */}
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] opacity-70">
        <svg width="100%" height="100%" viewBox="0 0 500 500" preserveAspectRatio="none">
          <path d="M500,500 L350,420 L380,320 L200,220 L250,120 L0,50" fill="none" stroke="rgba(168,85,247,0.4)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M500,380 L420,350 L450,220 L300,150 L320,0" fill="none" stroke="rgba(6,182,212,0.4)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M350,420 L280,480 L150,450" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          {/* Shards */}
          <polygon points="500,500 350,420 500,380" fill="rgba(168,85,247,0.05)" />
          <polygon points="350,420 380,320 420,350" fill="rgba(6,182,212,0.05)" />
          <polygon points="380,320 200,220 300,150 450,220" fill="rgba(255,255,255,0.03)" />
        </svg>
        <div className="absolute bottom-[20%] right-[25%] text-[10px] font-mono text-purple-400/60 -rotate-[15deg] animate-glitch-delayed">OVERRIDE_ERR</div>
        <div className="absolute bottom-[40%] right-[15%] text-[12px] font-mono text-cyan-400/50 rotate-[30deg] animate-glitch">0xDEADBEEF</div>
        <div className="absolute bottom-[60%] right-[40%] text-[14px] font-mono text-white/30 -rotate-[45deg]">Ω</div>
        <div className="absolute bottom-[35%] right-[35%] text-[8px] font-mono text-purple-300/40 -rotate-[10deg] animate-pulse">CORE_DUMP</div>
      </div>

      {/* Top Right Cracks */}
      <div className="absolute top-0 right-0 w-[30%] h-[40%] opacity-60">
        <svg width="100%" height="100%" viewBox="0 0 300 400" preserveAspectRatio="none">
          <path d="M300,0 L200,100 L220,180 L100,250 L120,350 L0,400" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M300,150 L250,180 L260,280 L150,350" fill="none" stroke="rgba(6,182,212,0.3)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <polygon points="300,0 200,100 300,150" fill="rgba(255,255,255,0.03)" />
          <polygon points="200,100 220,180 250,180" fill="rgba(6,182,212,0.03)" />
        </svg>
        <div className="absolute top-[25%] right-[20%] text-[10px] font-mono text-white/40 rotate-[10deg] animate-glitch">FRAG_01</div>
        <div className="absolute top-[50%] right-[30%] text-[14px] font-mono text-cyan-400/30 -rotate-[20deg]">Σ</div>
        <div className="absolute top-[15%] right-[40%] text-[8px] font-mono text-white/20 rotate-[45deg]">WARN</div>
      </div>

      {/* Bottom Left Cracks */}
      <div className="absolute bottom-0 left-0 w-[35%] h-[35%] opacity-60">
        <svg width="100%" height="100%" viewBox="0 0 350 350" preserveAspectRatio="none">
          <path d="M0,350 L100,250 L80,150 L200,80 L180,0" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <path d="M0,200 L60,180 L50,80 L150,20" fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          <polygon points="0,350 100,250 0,200" fill="rgba(255,255,255,0.03)" />
          <polygon points="100,250 80,150 60,180" fill="rgba(168,85,247,0.03)" />
        </svg>
        <div className="absolute bottom-[30%] left-[15%] text-[10px] font-mono text-white/40 -rotate-[10deg] animate-glitch-delayed">MEM_LEAK</div>
        <div className="absolute bottom-[55%] left-[25%] text-[14px] font-mono text-purple-400/30 rotate-[25deg]">λ</div>
        <div className="absolute bottom-[20%] left-[35%] text-[8px] font-mono text-purple-300/20 -rotate-[30deg]">CRITICAL</div>
      </div>
    </div>
  );
}

function FloatingRunes() {
  const runes = ['α', 'β', 'γ', 'δ', 'ε', 'ζ', 'η', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ω', '✧', '✦', '⟡', '⎋', '⍋', '⍎'];
  
  const [particles] = useState(() => 
    Array.from({ length: 25 }).map(() => ({
      id: Math.random(),
      rune: runes[Math.floor(Math.random() * runes.length)],
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 20,
      duration: 15 + Math.random() * 20,
      size: 10 + Math.random() * 20,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute text-cyan-300/20 font-mono"
          style={{ left: p.left, fontSize: p.size }}
          initial={{ y: '110vh', rotate: 0, opacity: 0 }}
          animate={{ y: '-10vh', rotate: 360, opacity: [0, 0.8, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "linear" }}
        >
          {p.rune}
        </motion.div>
      ))}
    </div>
  );
}

function SideDecorations() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden md:block">
      {/* Inner Framing Lines */}
      <div className="absolute inset-4 border border-white/[0.03] rounded-2xl pointer-events-none"></div>
      <div className="absolute inset-8 border border-white/[0.02] rounded-xl border-dashed pointer-events-none hidden lg:block"></div>

      {/* Enhanced Corner Accents */}
      {/* Top Left */}
      <div className="absolute top-4 left-4 w-32 h-32 border-t-[2px] border-l-[2px] border-purple-500/40 rounded-tl-2xl"></div>
      <div className="absolute top-4 left-4 w-4 h-4 border-t-[2px] border-l-[2px] border-white/60 rounded-tl-2xl"></div>
      <div className="absolute top-8 left-8 text-[10px] font-mono text-purple-400/50">TL_01</div>
      
      {/* Bottom Left */}
      <div className="absolute bottom-4 left-4 w-32 h-32 border-b-[2px] border-l-[2px] border-purple-500/40 rounded-bl-2xl"></div>
      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-[2px] border-l-[2px] border-white/60 rounded-bl-2xl"></div>
      <div className="absolute bottom-8 left-8 text-[10px] font-mono text-purple-400/50">BL_02</div>

      {/* Top Right */}
      <div className="absolute top-4 right-4 w-32 h-32 border-t-[2px] border-r-[2px] border-cyan-500/40 rounded-tr-2xl"></div>
      <div className="absolute top-4 right-4 w-4 h-4 border-t-[2px] border-r-[2px] border-white/60 rounded-tr-2xl"></div>
      <div className="absolute top-8 right-8 text-[10px] font-mono text-cyan-400/50">TR_03</div>

      {/* Bottom Right */}
      <div className="absolute bottom-4 right-4 w-32 h-32 border-b-[2px] border-r-[2px] border-cyan-500/40 rounded-br-2xl"></div>
      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-[2px] border-r-[2px] border-white/60 rounded-br-2xl"></div>
      <div className="absolute bottom-8 right-8 text-[10px] font-mono text-cyan-400/50">BR_04</div>

      {/* Crosshairs */}
      <div className="absolute top-12 left-12 text-white/20 text-xs">+</div>
      <div className="absolute top-12 right-12 text-white/20 text-xs">+</div>
      <div className="absolute bottom-12 left-12 text-white/20 text-xs">+</div>
      <div className="absolute bottom-12 right-12 text-white/20 text-xs">+</div>

      {/* Top Edge HUD */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-4 opacity-60">
        <div className="w-16 lg:w-32 h-[1px] bg-gradient-to-r from-transparent to-purple-500/50"></div>
        <div className="text-[10px] font-mono text-gray-400 tracking-[0.3em] uppercase flex gap-2">
          <span>[</span>
          <span className="text-purple-400">SYS.CORE</span>
          <span className="text-white/30">//</span>
          <span className="text-cyan-400">OVERRIDE</span>
          <span>]</span>
        </div>
        <div className="w-16 lg:w-32 h-[1px] bg-gradient-to-l from-transparent to-cyan-500/50"></div>
      </div>

      {/* Bottom Edge HUD */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-60">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-2 h-1 bg-purple-500/40"></div>
          ))}
        </div>
        <div className="text-[10px] font-mono text-gray-500 tracking-widest">
          0x0000 <span className="text-cyan-500/50">-</span> 0xFFFF
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-2 h-1 bg-cyan-500/40"></div>
          ))}
        </div>
      </div>

      {/* Left Side HUD */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-60">
        <div className="w-[1px] h-24 lg:h-32 bg-gradient-to-b from-transparent via-purple-500/50 to-purple-500"></div>
        
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <motion.div 
              key={i} 
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" 
            />
          ))}
        </div>

        <div className="text-[10px] font-mono text-purple-400 tracking-[0.4em] uppercase py-4" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}>
          System.Core.Online
        </div>
        
        <div className="w-[1px] h-24 lg:h-32 bg-gradient-to-t from-transparent via-purple-500/50 to-purple-500"></div>
      </div>

      {/* Right Side HUD */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-6 opacity-60">
        <div className="w-[1px] h-24 lg:h-32 bg-gradient-to-b from-transparent via-cyan-500/50 to-cyan-500"></div>
        
        <div className="text-[10px] font-mono text-cyan-400 tracking-[0.4em] uppercase py-4" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          Rule.Override.Ready
        </div>

        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <motion.div 
              key={i} 
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
              className="w-1.5 h-1.5 bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.8)]" 
            />
          ))}
        </div>
        
        <div className="w-[1px] h-24 lg:h-32 bg-gradient-to-t from-transparent via-cyan-500/50 to-cyan-500"></div>
      </div>
      
      {/* Decorative Data Bars (Left & Right Bottom) */}
      <div className="absolute bottom-16 left-12 flex gap-1 opacity-30">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div 
            key={`l-${i}`}
            animate={{ height: [10, Math.random() * 30 + 10, 10] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
            className="w-1 bg-purple-500 rounded-t-sm"
            style={{ height: 10 }}
          />
        ))}
      </div>
      <div className="absolute bottom-16 right-12 flex gap-1 opacity-30">
        {Array.from({ length: 15 }).map((_, i) => (
          <motion.div 
            key={`r-${i}`}
            animate={{ height: [10, Math.random() * 30 + 10, 10] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
            className="w-1 bg-cyan-500 rounded-t-sm"
            style={{ height: 10 }}
          />
        ))}
      </div>

      {/* Ruler Marks Left */}
      <div className="absolute left-4 top-1/4 bottom-1/4 w-2 flex flex-col justify-between opacity-20 hidden lg:flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`rl-${i}`} className={`h-[1px] bg-white ${i % 5 === 0 ? 'w-full' : 'w-1/2'}`}></div>
        ))}
      </div>

      {/* Ruler Marks Right */}
      <div className="absolute right-4 top-1/4 bottom-1/4 w-2 flex flex-col justify-between items-end opacity-20 hidden lg:flex">
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={`rr-${i}`} className={`h-[1px] bg-white ${i % 5 === 0 ? 'w-full' : 'w-1/2'}`}></div>
        ))}
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatusItem({ label, value, progress, color }: { label: string, value: string, progress: number, color: string }) {
  const segments = 20;
  const activeSegments = Math.floor((progress / 100) * segments);
  
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-[11px] font-mono text-gray-400 uppercase tracking-wider">
        <span className="chromatic-text"><ScrambleText text={label} /></span>
        <span className="text-gray-200">{value}</span>
      </div>
      <div className="flex gap-[2px] h-1.5 w-full">
        {Array.from({ length: segments }).map((_, i) => {
          const isActive = i < activeSegments;
          const isLast = i === activeSegments - 1;
          return (
            <div 
              key={i} 
              className={`flex-1 h-full rounded-[1px] ${isActive ? color : 'bg-white/5'} ${isLast ? 'shadow-[0_0_8px_currentColor] brightness-150' : ''} transition-all duration-300`}
              style={{ transitionDelay: `${i * 0.02}s` }}
            />
          );
        })}
      </div>
    </div>
  );
}

function LogItem({ time, msg, highlight = false }: { time: string, msg: string, highlight?: boolean }) {
  return (
    <div className="flex gap-3 text-xs font-mono">
      <span className="text-gray-600">[{time}]</span>
      <span className={highlight ? "text-cyan-300 drop-shadow-[0_0_5px_rgba(6,182,212,0.5)] chromatic-text" : "text-gray-400"}><ScrambleText text={msg} /></span>
    </div>
  );
}

function ScrambleText({ text }: { text: string }) {
  const [display, setDisplay] = useState(text);
  
  useEffect(() => {
    let iteration = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
    let interval: ReturnType<typeof setInterval>;

    const scramble = () => {
      setDisplay(text.split("").map((letter, index) => {
        if(index < iteration) return text[index];
        return chars[Math.floor(Math.random() * chars.length)];
      }).join(""));
      
      if(iteration >= text.length) {
        clearInterval(interval);
        setDisplay(text);
      }
      iteration += 1/3;
    };

    interval = setInterval(scramble, 30);
    return () => clearInterval(interval);
  }, [text]);
  
  return <span>{display}</span>;
}

function MagneticButton({ children, onClick, className }: { children: React.ReactNode, onClick?: (e: React.MouseEvent) => void, className?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{x: number, y: number, size: number, id: number}[]>([]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.3;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.3;
    setPos({ x, y });
  };

  const handleMouseLeave = () => {
    setPos({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const newRipple = { x, y, size, id: Date.now() };
      setRipples([...ripples, newRipple]);
      setTimeout(() => setRipples(r => r.filter(rip => rip.id !== newRipple.id)), 600);
    }
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      ref={ref}
      animate={{ x: pos.x, y: pos.y }}
      transition={{ type: "spring", stiffness: 150, damping: 15, mass: 0.1 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={`relative overflow-hidden chromatic-border ${className}`}
    >
      {children}
      {ripples.map(r => (
        <span key={r.id} className="ripple-span" style={{ left: r.x, top: r.y, width: r.size, height: r.size }} />
      ))}
    </motion.button>
  );
}

function TerminalSnippets() {
  const snippets = [
    "0x00F1: MEMORY_ALLOC_OK",
    "0x00F2: KERNEL_PANIC_AVOIDED",
    "0x00F3: OVERRIDE_PROTOCOL_INIT",
    "0x00F4: NEURAL_LINK_ESTABLISHED",
    "0x00F5: REALITY_ANCHOR_STABLE",
    "0x00F6: INJECTING_RULES...",
    "0x00F7: SYNC_RATE_99_PERCENT",
    "0x00F8: AWAITING_COMMAND"
  ];
  return (
    <div className="absolute left-4 top-1/4 bottom-1/4 w-48 overflow-hidden pointer-events-none opacity-[0.05] font-mono text-[10px] text-cyan-500 leading-relaxed hidden xl:block">
      <motion.div
        animate={{ y: [0, -200] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="flex flex-col gap-2"
      >
        {snippets.concat(snippets).concat(snippets).map((s, i) => (
          <div key={i}>{s}</div>
        ))}
      </motion.div>
    </div>
  );
}

function CoordinateTracker({ x, y }: { x: number, y: number }) {
  return (
    <div className="fixed bottom-4 right-4 font-mono text-[10px] text-cyan-500/50 pointer-events-none z-50 flex gap-4">
      <span>X: {Math.round(x).toString().padStart(4, '0')}</span>
      <span>Y: {Math.round(y).toString().padStart(4, '0')}</span>
    </div>
  );
}
