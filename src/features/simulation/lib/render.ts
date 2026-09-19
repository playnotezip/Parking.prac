import { MAP_HEIGHT, MAP_WIDTH, getCarFootprint } from './maps';
import type { CarDimensions, Gear, Obstacle, ParkingSlot, SimState } from './types';

export interface RenderScene {
  ctx: CanvasRenderingContext2D;
  isDark: boolean;
  state: SimState;
  /** React-side gear, used for the shifter highlight. */
  gear: Gear;
  obstacles: Obstacle[];
  targetSlot: ParkingSlot;
  car: CarDimensions;
  carColor: string;
  carType: string;
  mapId: string;
  modeId: string;
  allCornersIn: boolean;
  aligned: boolean;
  isBraking: boolean;
  parkedTimer: number;
  collisionFlash: boolean;
}

/** Asphalt grid, drawn inside the camera transform so it scrolls with the car. */
const drawGrid = (ctx: CanvasRenderingContext2D, isDark: boolean) => {
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.015)' : 'rgba(0, 0, 0, 0.035)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = -800; x < MAP_WIDTH + 800; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, -600);
    ctx.lineTo(x, MAP_HEIGHT + 1200);
    ctx.stroke();
  }
  for (let y = -600; y < MAP_HEIGHT + 1200; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(-800, y);
    ctx.lineTo(MAP_WIDTH + 800, y);
    ctx.stroke();
  }
};

const drawTutorialStopLine = (ctx: CanvasRenderingContext2D) => {
  ctx.save();
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
  ctx.lineWidth = 4;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(300, 150);
  ctx.lineTo(300, 450);
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('정지선 (STOP LINE)', 310, 220);
  ctx.restore();
};

/** Painted bay lines for each map layout. */
const drawParkingLines = (scene: RenderScene) => {
  const { ctx, isDark, mapId, modeId, carType } = scene;
  const { carLength, carWidth } = getCarFootprint(carType);

  ctx.save();
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(15, 23, 42, 0.35)';
  ctx.lineWidth = 2.5;

  if (mapId === 'rear' || modeId === 'tutorial') {
    const drawSlotsX = modeId === 'tutorial' ? 450 : 400;
    const drawSlotsY = modeId === 'tutorial' ? 480 : 445;
    const slotWidth = carWidth + 14;
    const slotW = carLength + 8;

    // 하단 주차 구역선 그리기
    for (let i = -3.5; i <= 3.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.beginPath();
      ctx.moveTo(lx, drawSlotsY - slotW / 2);
      ctx.lineTo(lx, drawSlotsY + slotW / 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsY - slotW / 2);
    ctx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsY - slotW / 2);
    ctx.stroke();

    // 상단(왼쪽) 주차 구역선 대칭적으로 그리기
    const drawSlotsYTop = modeId === 'tutorial' ? 120 : 155;
    for (let i = -3.5; i <= 3.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.beginPath();
      ctx.moveTo(lx, drawSlotsYTop - slotW / 2);
      ctx.lineTo(lx, drawSlotsYTop + slotW / 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
    ctx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
    ctx.stroke();
  } else if (mapId === 'front') {
    const drawSlotsX = 450;
    const drawSlotsY = 445;
    const drawSlotsYTop = 155;
    const slotWidth = carWidth + 12;
    const slotW = carLength + 8;

    // 하단 전면 주차선
    for (let i = -3.5; i <= 3.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.beginPath();
      ctx.moveTo(lx, drawSlotsY - slotW / 2);
      ctx.lineTo(lx, drawSlotsY + slotW / 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsY - slotW / 2);
    ctx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsY - slotW / 2);
    ctx.stroke();

    // 상단 전면 주차선 (대칭)
    for (let i = -3.5; i <= 3.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.beginPath();
      ctx.moveTo(lx, drawSlotsYTop - slotW / 2);
      ctx.lineTo(lx, drawSlotsYTop + slotW / 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
    ctx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsYTop + slotW / 2);
    ctx.stroke();
  } else if (mapId === 'parallel') {
    const drawSlotsX = 500;
    const drawSlotsY = 390;
    const drawSlotsYTop = 210;
    const slotWidth = carLength + 20;
    const slotH = carWidth + 6;

    // 하단 평행 주차선
    ctx.beginPath();
    ctx.moveTo(0, drawSlotsY - slotH / 2);
    ctx.lineTo(MAP_WIDTH, drawSlotsY - slotH / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, drawSlotsY + slotH / 2);
    ctx.lineTo(MAP_WIDTH, drawSlotsY + slotH / 2);
    ctx.stroke();

    for (let i = -2.5; i <= 1.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.beginPath();
      ctx.moveTo(lx, drawSlotsY - slotH / 2);
      ctx.lineTo(lx, drawSlotsY + slotH / 2);
      ctx.stroke();
    }

    // 상단 평행 주차선 (대칭)
    ctx.beginPath();
    ctx.moveTo(0, drawSlotsYTop - slotH / 2);
    ctx.lineTo(MAP_WIDTH, drawSlotsYTop - slotH / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, drawSlotsYTop + slotH / 2);
    ctx.lineTo(MAP_WIDTH, drawSlotsYTop + slotH / 2);
    ctx.stroke();

    for (let i = -2.5; i <= 1.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.beginPath();
      ctx.moveTo(lx, drawSlotsYTop - slotH / 2);
      ctx.lineTo(lx, drawSlotsYTop + slotH / 2);
      ctx.stroke();
    }
  } else if (mapId === 'diagonal') {
    const drawSlotsX = 450;
    const drawSlotsY = 430;
    const drawSlotsYTop = 170;
    const slotWidth = 70;
    const slotW = carLength + 8;

    // 하단 45도 주차선
    for (let i = -3.5; i <= 3.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.save();
      ctx.translate(lx, drawSlotsY);
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-slotW / 2, 0);
      ctx.lineTo(slotW / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsY + 30);
    ctx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsY + 30);
    ctx.stroke();

    // 상단 45도 주차선 (대칭)
    for (let i = -3.5; i <= 3.5; i++) {
      const lx = drawSlotsX + i * slotWidth;
      ctx.save();
      ctx.translate(lx, drawSlotsYTop);
      ctx.rotate(-Math.PI / 4);
      ctx.beginPath();
      ctx.moveTo(-slotW / 2, 0);
      ctx.lineTo(slotW / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.moveTo(drawSlotsX - 3.5 * slotWidth, drawSlotsYTop - 30);
    ctx.lineTo(drawSlotsX + 3.5 * slotWidth, drawSlotsYTop - 30);
    ctx.stroke();
  }
  ctx.restore();
};

const drawTargetSlot = (ctx: CanvasRenderingContext2D, slot: ParkingSlot, isGlowing: boolean) => {
  ctx.strokeStyle = isGlowing ? '#00ffc7' : 'rgba(0, 255, 199, 0.4)';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);

  ctx.save();
  ctx.translate(slot.center.x, slot.center.y);
  ctx.rotate(slot.angle);
  ctx.strokeRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h);

  ctx.fillStyle = isGlowing ? 'rgba(0, 255, 199, 0.08)' : 'rgba(0, 255, 199, 0.02)';
  ctx.fillRect(-slot.w / 2, -slot.h / 2, slot.w, slot.h);
  ctx.restore();
  ctx.setLineDash([]);
};

const drawObstacles = (ctx: CanvasRenderingContext2D, obstacles: Obstacle[]) => {
  for (const obs of obstacles) {
    ctx.save();
    ctx.translate(obs.box.center.x, obs.box.center.y);
    ctx.rotate(obs.box.angle);

    if (obs.isCar) {
      ctx.fillStyle = obs.color;
      ctx.fillRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);

      // Car details
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(obs.box.w * 0.1, -obs.box.h * 0.4, obs.box.w * 0.25, obs.box.h * 0.8);
      ctx.fillRect(-obs.box.w * 0.35, -obs.box.h * 0.4, obs.box.w * 0.2, obs.box.h * 0.8);

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(obs.box.w / 2 - 4, -obs.box.h / 2 + 2, 4, obs.box.h - 4);
      ctx.fillRect(-obs.box.w / 2, -obs.box.h / 2 + 2, 4, obs.box.h - 4);
    } else if (obs.isCurb) {
      ctx.fillStyle = obs.color;
      ctx.fillRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-obs.box.w / 2, obs.box.h / 2 - 6, obs.box.w, 6);
    } else {
      ctx.fillStyle = obs.color;
      ctx.fillRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);

      ctx.strokeStyle = '#ffc700';
      ctx.lineWidth = 2;
      ctx.strokeRect(-obs.box.w / 2, -obs.box.h / 2, obs.box.w, obs.box.h);

      if (obs.label) {
        ctx.save();
        ctx.rotate(-obs.box.angle);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(obs.label, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  }
};

const drawCar = (scene: RenderScene) => {
  const { ctx, state, car, carColor, isBraking } = scene;
  const { length: carLength, width: carWidth, wheelbase: carWheelbase } = car;
  const cGear = state.gear;

  ctx.save();
  ctx.translate(state.x, state.y);
  ctx.rotate(state.angle);

  // Headlight cones
  if (cGear !== 'P') {
    ctx.save();
    const gradient = ctx.createRadialGradient(carLength / 2, 0, 10, carLength / 2 + 120, 0, 80);
    gradient.addColorStop(0, 'rgba(255, 199, 0, 0.35)');
    gradient.addColorStop(1, 'rgba(255, 199, 0, 0.0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(carLength / 2, -10);
    ctx.lineTo(carLength / 2 + 130, -50);
    ctx.lineTo(carLength / 2 + 130, 50);
    ctx.lineTo(carLength / 2, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Tires
  ctx.fillStyle = '#090a0f';
  const tireW = 14;
  const tireH = 6;
  const wheelYOffset = carWidth / 2 - 2;

  ctx.fillRect(-carWheelbase / 2 - tireW / 2, -wheelYOffset - tireH / 2, tireW, tireH);
  ctx.fillRect(-carWheelbase / 2 - tireW / 2, wheelYOffset - tireH / 2, tireW, tireH);

  const drawFrontTire = (yOffset: number) => {
    ctx.save();
    ctx.translate(carWheelbase / 2, yOffset);
    ctx.rotate(state.steerAngle);
    ctx.fillRect(-tireW / 2, -tireH / 2, tireW, tireH);
    ctx.restore();
  };
  drawFrontTire(-wheelYOffset);
  drawFrontTire(wheelYOffset);

  // Car Frame Body
  ctx.fillStyle = carColor;
  ctx.beginPath();
  ctx.roundRect(-carLength / 2, -carWidth / 2, carLength, carWidth, 8);
  ctx.fill();

  ctx.strokeStyle = '#090a0f';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Glass cabin
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-carLength * 0.15, -carWidth * 0.35, carLength * 0.45, carWidth * 0.7, 4);
  ctx.fill();

  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(-carLength * 0.35, -carWidth * 0.3, carLength * 0.15, carWidth * 0.6, 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(carLength * 0.15, -carWidth * 0.25, 4, carWidth * 0.5);

  // Lights
  ctx.fillStyle = '#fffae6';
  ctx.fillRect(carLength / 2 - 3, -carWidth * 0.35, 3, 5);
  ctx.fillRect(carLength / 2 - 3, carWidth * 0.35 - 5, 3, 5);

  // Taillights
  const isBrakingActive = isBraking || cGear === 'P';
  ctx.fillStyle = isBrakingActive ? '#ff3b30' : cGear === 'R' ? '#ffffff' : '#991b1b';
  ctx.fillRect(-carLength / 2, -carWidth * 0.38, 3, 6);
  ctx.fillRect(-carLength / 2, carWidth * 0.38 - 6, 3, 6);

  // Side mirrors
  ctx.fillStyle = carColor;
  ctx.fillRect(carLength * 0.2, -carWidth / 2 - 4, 3, 4);
  ctx.fillRect(carLength * 0.2, carWidth / 2, 3, 4);

  ctx.restore();
};

const drawParkedOverlay = (ctx: CanvasRenderingContext2D, parkedTimer: number) => {
  ctx.save();
  ctx.fillStyle = 'rgba(12, 13, 18, 0.9)';
  ctx.beginPath();
  ctx.roundRect(MAP_WIDTH / 2 - 120, 200, 240, 60, 16);
  ctx.fill();
  ctx.strokeStyle = '#00ffc7';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('주차 완료 대기 중...', MAP_WIDTH / 2, 225);

  ctx.fillStyle = '#262930';
  ctx.fillRect(MAP_WIDTH / 2 - 80, 235, 160, 8);
  ctx.fillStyle = '#00ffc7';
  ctx.fillRect(MAP_WIDTH / 2 - 80, 235, 1.6 * parkedTimer, 8);
  ctx.restore();
};

/** Mission card at the top and controls card at the bottom (UI 겹침 해결). */
const drawTutorialCards = (ctx: CanvasRenderingContext2D, state: SimState) => {
  const topBarY = 25;
  const missionCardY = topBarY;
  const controlsCardY = MAP_HEIGHT - 80;

  // 1. Top Mission Card
  ctx.save();
  ctx.fillStyle = 'rgba(18, 18, 18, 0.92)';
  ctx.strokeStyle = 'rgba(0, 255, 199, 0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(40, missionCardY, MAP_WIDTH - 80, 52, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00ffc7';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`현재 미션 (STAGE ${state.tutorialStep === 4 ? 3 : state.tutorialStep} / 3)`, 55, missionCardY + 17);

  ctx.fillStyle = '#E9ECEF';
  ctx.font = 'bold 13px sans-serif';
  let descText = '';
  if (state.tutorialStep === 1) {
    descText = '가만히 있어도 차가 시속 10km로 움직입니다. [Spacebar]를 눌러 지정된 정지선에 멈춰보세요!';
  } else if (state.tutorialStep === 2) {
    descText = 'D 기어로 W를 누르면 전진 가속, 기어를 R로 변경하고 S를 누르면 후진 가속합니다.';
  } else if (state.tutorialStep === 4) {
    descText = '초록 칸에 차를 넣고 기어를 P로 바꾸면 주차가 완료됩니다.';
  }
  ctx.fillText(descText, 55, missionCardY + 36);
  ctx.restore();

  // 2. Bottom Controls Card
  ctx.save();
  ctx.fillStyle = 'rgba(18, 18, 18, 0.92)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(40, controlsCardY, MAP_WIDTH - 80, 60, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#00ffc7';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('조작법 가이드 및 현재 조건 만족 상태', 55, controlsCardY + 18);

  ctx.fillStyle = '#E9ECEF';
  ctx.font = '12px sans-serif';
  let missionText = '';
  if (state.tutorialStep === 1) {
    missionText = '[Spacebar] 키를 누르면 브레이크가 작동합니다.';
  } else if (state.tutorialStep === 2) {
    missionText = `[W] 전진 및 [S] 후진. (D 전진 완료: ${state.tutDroveForward ? '성공' : '대기'} ➔ R 후진 완료: ${state.tutDroveBackward ? '성공' : '대기'})`;
  } else if (state.tutorialStep === 4) {
    missionText = '초록 칸에 차를 정렬하여 정차한 후, 기어를 P로 전환해 1.5초 대기하면 최종 완수됩니다.';
  }
  ctx.fillText(missionText, 55, controlsCardY + 38);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '9px sans-serif';
  ctx.fillText('기본 단축키: W/S 가속, A/D 조향, Spacebar 긴급 브레이크 제동, 마우스 휠 기어 스크롤링', 55, controlsCardY + 53);
  ctx.restore();
};

/** 세로형 기어 표시 시스템 plus the speedometer beside it. */
const drawShifterAndSpeed = (ctx: CanvasRenderingContext2D, gear: Gear, velocity: number) => {
  const shifterX = MAP_WIDTH - 65;
  const shifterY = MAP_HEIGHT - 170;
  const shifterW = 45;
  const shifterH = 140;

  ctx.save();
  // Shifter box container
  ctx.fillStyle = 'rgba(18, 18, 18, 0.85)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(shifterX, shifterY, shifterW, shifterH, 16);
  ctx.fill();
  ctx.stroke();

  // Shifter central line track
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(shifterX + shifterW / 2, shifterY + 20);
  ctx.lineTo(shifterX + shifterW / 2, shifterY + shifterH - 20);
  ctx.stroke();

  const shifterGears = ['P', 'D', 'R'] as const;
  shifterGears.forEach((g, idx) => {
    const itemY = shifterY + 25 + idx * 45;
    const isCurrent = gear === g;

    // Glowing circle indicator
    if (isCurrent) {
      ctx.shadowColor = '#00ffc7';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#00ffc7';
    } else {
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#212529';
    }

    ctx.beginPath();
    ctx.arc(shifterX + shifterW / 2, itemY, 15, 0, Math.PI * 2);
    ctx.fill();

    // Border outline
    ctx.strokeStyle = isCurrent ? '#00ffc7' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(shifterX + shifterW / 2, itemY, 15, 0, Math.PI * 2);
    ctx.stroke();

    // Gear Text Character
    ctx.shadowBlur = 0;
    ctx.fillStyle = isCurrent ? '#090a0f' : '#8a94a6';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g, shifterX + shifterW / 2, itemY);
  });
  ctx.restore();

  ctx.save();
  const speedX = shifterX - 15;
  const speedY = shifterY + shifterH / 2;

  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('SPEED', speedX, speedY - 12);

  const currentSpeed = Math.round(Math.abs(velocity) * 20);
  ctx.fillStyle = '#00ffc7';
  ctx.font = 'black 20px monospace';
  ctx.fillText(`${currentSpeed}`, speedX, speedY + 8);

  ctx.fillStyle = '#64748b';
  ctx.font = '8px sans-serif';
  ctx.fillText('km/h', speedX, speedY + 24);
  ctx.restore();
};

const drawGearWarning = (ctx: CanvasRenderingContext2D) => {
  ctx.save();

  const boxW = 380;
  const boxH = 50;
  const boxX = MAP_WIDTH / 2 - boxW / 2;
  const boxY = MAP_HEIGHT / 2 - boxH / 2;

  ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
  ctx.shadowBlur = 15;

  ctx.fillStyle = 'rgba(220, 38, 38, 0.95)';
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.fill();

  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(boxX, boxY, boxW, boxH, 12);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('⚠️ 브레이크를 밟은 상태에서 기어를 변경해 주세요!', MAP_WIDTH / 2, MAP_HEIGHT / 2);

  ctx.restore();
};

/** Draws one whole frame. Screen-space HUD is drawn after the camera is restored. */
export const renderFrame = (scene: RenderScene) => {
  const { ctx, isDark, state, modeId, targetSlot, obstacles, allCornersIn, aligned, parkedTimer, collisionFlash, gear } = scene;

  ctx.fillStyle = isDark ? '#1a1c23' : '#e2e8f0'; // asphalt texture background
  ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);

  ctx.save();

  // 3인칭 카메라: 차량 뒤쪽 위에 고정되어 따라다님 (돌발 회전/떨림 보정 앵커링)
  ctx.translate(MAP_WIDTH / 2, MAP_HEIGHT / 2 + 125);
  ctx.scale(1.2, 1.2);
  ctx.rotate(-state.angle - Math.PI / 2);
  ctx.translate(-state.x, -state.y);

  drawGrid(ctx, isDark);

  if (modeId === 'tutorial' && state.tutorialStep === 1) {
    drawTutorialStopLine(ctx);
  }

  drawParkingLines(scene);

  const shouldDrawSlot = modeId !== 'tutorial' || state.tutorialStep === 4;
  if (shouldDrawSlot) {
    drawTargetSlot(ctx, targetSlot, allCornersIn && aligned);
  }

  drawObstacles(ctx, obstacles);

  // Draw Helper arrow from car to slot in Step 4 of tutorial
  if (modeId === 'tutorial' && state.tutorialStep === 4) {
    ctx.save();
    ctx.strokeStyle = '#00ffc7';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(state.x, state.y);
    ctx.lineTo(targetSlot.center.x, targetSlot.center.y);
    ctx.stroke();
    ctx.restore();
  }

  drawCar(scene);

  ctx.restore(); // Restore back to screen-space coordinates

  if (collisionFlash) {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 10;
    ctx.strokeRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
  }

  if (parkedTimer > 0 && parkedTimer < 100) {
    drawParkedOverlay(ctx, parkedTimer);
  }

  if (modeId === 'tutorial') {
    drawTutorialCards(ctx, state);
  }

  drawShifterAndSpeed(ctx, gear, state.velocity);

  if (state.gearWarningTime > 0) {
    drawGearWarning(ctx);
  }
};
