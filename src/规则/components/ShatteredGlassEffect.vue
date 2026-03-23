<template>
  <div class="shattered-glass">
    <!-- 左上角裂纹 -->
    <div class="crack top-left">
      <svg viewBox="0 0 400 400" preserveAspectRatio="none">
        <path d="M0,0 L150,80 L130,150 L280,250 L240,320 L400,380"
              fill="none" stroke="rgba(6,182,212,0.4)" stroke-width="1" />
        <path d="M0,100 L80,120 L60,220 L180,280 L150,400"
              fill="none" stroke="rgba(168,85,247,0.4)" stroke-width="1" />
        <path d="M150,80 L200,40 L350,90"
              fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        <!-- 碎片 -->
        <polygon points="0,0 150,80 0,100" fill="rgba(6,182,212,0.05)" />
        <polygon points="150,80 130,150 80,120" fill="rgba(168,85,247,0.05)" />
        <polygon points="130,150 280,250 180,280 60,220" fill="rgba(255,255,255,0.03)" />
      </svg>
      <div class="glitch-text" style="top:15%;left:20%">ERR_0x00FA</div>
      <div class="glitch-text delayed" style="top:35%;left:10%">SYS_FRAG</div>
      <div class="symbol" style="top:50%;left:35%">Δ</div>
      <div class="glitch-text pulse" style="top:25%;left:40%">NULL_PTR</div>
    </div>

    <!-- 右下角裂纹 -->
    <div class="crack bottom-right">
      <svg viewBox="0 0 500 500" preserveAspectRatio="none">
        <path d="M500,500 L350,420 L380,320 L200,220 L250,120 L0,50"
              fill="none" stroke="rgba(168,85,247,0.4)" stroke-width="1" />
        <path d="M500,380 L420,350 L450,220 L300,150 L320,0"
              fill="none" stroke="rgba(6,182,212,0.4)" stroke-width="1" />
        <path d="M350,420 L280,480 L150,450"
              fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        <!-- 碎片 -->
        <polygon points="500,500 350,420 500,380" fill="rgba(168,85,247,0.05)" />
        <polygon points="350,420 380,320 420,350" fill="rgba(6,182,212,0.05)" />
        <polygon points="380,320 200,220 300,150 450,220" fill="rgba(255,255,255,0.03)" />
      </svg>
      <div class="glitch-text delayed" style="bottom:20%;right:25%">OVERRIDE_ERR</div>
      <div class="glitch-text" style="bottom:40%;right:15%">0xDEADBEEF</div>
      <div class="symbol" style="bottom:60%;right:40%">Ω</div>
      <div class="glitch-text pulse" style="bottom:35%;right:35%">CORE_DUMP</div>
    </div>

    <!-- 右上角裂纹 -->
    <div class="crack top-right">
      <svg viewBox="0 0 300 400" preserveAspectRatio="none">
        <path d="M300,0 L200,100 L220,180 L100,250 L120,350 L0,400"
              fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        <path d="M300,150 L250,180 L260,280 L150,350"
              fill="none" stroke="rgba(6,182,212,0.3)" stroke-width="1" />
        <polygon points="300,0 200,100 300,150" fill="rgba(255,255,255,0.03)" />
        <polygon points="200,100 220,180 250,180" fill="rgba(6,182,212,0.03)" />
      </svg>
      <div class="glitch-text" style="top:25%;right:20%">FRAG_01</div>
      <div class="symbol cyan" style="top:50%;right:30%">Σ</div>
      <div class="glitch-text small" style="top:15%;right:40%">WARN</div>
    </div>

    <!-- 左下角裂纹 -->
    <div class="crack bottom-left">
      <svg viewBox="0 0 350 350" preserveAspectRatio="none">
        <path d="M0,350 L100,250 L80,150 L200,80 L180,0"
              fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="1" />
        <path d="M0,200 L60,180 L50,80 L150,20"
              fill="none" stroke="rgba(168,85,247,0.3)" stroke-width="1" />
        <polygon points="0,350 100,250 0,200" fill="rgba(255,255,255,0.03)" />
        <polygon points="100,250 80,150 60,180" fill="rgba(168,85,247,0.03)" />
      </svg>
      <div class="glitch-text delayed" style="bottom:30%;left:15%">MEM_LEAK</div>
      <div class="symbol purple" style="bottom:55%;left:25%">λ</div>
      <div class="glitch-text small" style="bottom:20%;left:35%">CRITICAL</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.shattered-glass {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.crack {
  position: absolute;
  opacity: 0.7;

  svg {
    width: 100%;
    height: 100%;
  }
}

.top-left {
  top: 0;
  left: 0;
  width: 40%;
  height: 40%;
}

.bottom-right {
  bottom: 0;
  right: 0;
  width: 50%;
  height: 50%;
}

.top-right {
  top: 0;
  right: 0;
  width: 30%;
  height: 40%;
  opacity: 0.6;
}

.bottom-left {
  bottom: 0;
  left: 0;
  width: 35%;
  height: 35%;
  opacity: 0.6;
}

.glitch-text {
  position: absolute;
  font-family: 'Courier New', monospace;
  font-size: 10px;
  color: rgba(6, 182, 212, 0.6);
  animation: glitch 4s infinite alternate;
  transform: rotate(15deg);
  white-space: nowrap;

  &.delayed {
    animation-delay: 1.5s;
    color: rgba(168, 85, 247, 0.5);
    transform: rotate(-25deg);
  }

  &.pulse {
    animation: glitch 4s infinite alternate, pulse-text 2s ease-in-out infinite;
    color: rgba(6, 182, 212, 0.4);
    transform: rotate(5deg);
  }

  &.small {
    font-size: 8px;
    color: rgba(255, 255, 255, 0.2);
    transform: rotate(45deg);
  }
}

.symbol {
  position: absolute;
  font-family: serif;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
  transform: rotate(45deg);

  &.cyan {
    color: rgba(6, 182, 212, 0.3);
    transform: rotate(-20deg);
  }

  &.purple {
    color: rgba(168, 85, 247, 0.3);
    transform: rotate(25deg);
  }
}

@keyframes glitch {
  0%, 100% { opacity: 1; transform: translate(0) rotate(var(--rotation, 15deg)); }
  10% { opacity: 0.4; transform: translate(-2px, 1px) rotate(var(--rotation, 15deg)); }
  20% { opacity: 1; transform: translate(2px, -1px) rotate(var(--rotation, 15deg)); }
  30% { opacity: 0.4; transform: translate(-1px, -2px) rotate(var(--rotation, 15deg)); }
  40% { opacity: 1; transform: translate(1px, 2px) rotate(var(--rotation, 15deg)); }
  50% { opacity: 0.8; transform: translate(0) rotate(var(--rotation, 15deg)); }
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}
</style>
