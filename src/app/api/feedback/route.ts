import { NextRequest, NextResponse } from 'next/server';

// Local Korean rule-based feedback fallback generator
function generateLocalFeedback(
  carType: string,
  mapId: string,
  elapsedTime: number,
  collisions: number,
  lineViolations: number,
  angleOffset: number
): string {
  const carNames: Record<string, string> = {
    compact: '소형차',
    sedan: '준중형 세단',
    suv: '대형 SUV',
  };
  const mapNames: Record<string, string> = {
    rear: '후면 주차 코스',
    diagonal: '45도 사선주차 코스',
    front: '전면 주차 코스',
    parallel: '평행 주차 코스',
    apartment: '아파트 지하 주차장',
    mart: '대형마트 야외 주차장',
    alleyway: '비좁은 골목길 주차',
  };

  const carName = carNames[carType] || '차량';
  const mapName = mapNames[mapId] || '코스';

  let feedback = '';

  if (collisions > 0) {
    if (carType === 'suv') {
      feedback += `대형 SUV는 전폭과 축거가 커서 회전 반경이 매우 넓습니다. 후진 조작 중 범퍼가 벽이나 주변 차량에 닿지 않도록 사이드미러와 후방 카메라를 더 자주 보며 아주 천천히 진입해야 합니다. `;
    } else {
      feedback += `주차 중 ${collisions}회의 충돌이 발생했습니다. 조작 속도를 낮추고, 핸들을 돌릴 때 차량의 앞범퍼(회전 방향 반대쪽)가 바깥쪽 장애물에 닿는지 항상 좌우 시야를 넓게 살피는 습관을 들여보세요. `;
    }
  } else {
    feedback += `무사고(충돌 0회)로 주차를 마친 점은 아주 훌륭합니다! `;
  }

  if (angleOffset > 3.0) {
    feedback += `최종 주차 각도 오차가 ${angleOffset.toFixed(1)}도로 차선 내에서 차량이 약간 비뚤어져 있습니다. 후진 주차 시 마지막에 차가 주차선과 평행이 되는 순간 핸들을 빠르게 풀어 중앙을 맞추는 타이밍을 연습해 보세요. `;
  } else if (lineViolations > 5) {
    feedback += `차선 침범 시간이 ${lineViolations.toFixed(1)}초로 다소 깁니다. 진입할 때 너무 좁은 각도로 틀었기 때문일 수 있으니, 다음에는 진입 공간을 충분히 확보한 뒤 45도 각도로 엉덩이를 밀어 넣어 보세요. `;
  } else {
    feedback += `주차선 중앙에 수평을 이루며 반듯하게 잘 주차하셨습니다. 후방 카메라 가이드 선을 신뢰하고 천천히 대칭을 맞춰 세운 감각이 탁월합니다. `;
  }

  if (elapsedTime > 120) {
    feedback += `시간이 ${elapsedTime}초로 다소 오래 소요되었습니다. 공식(진입 각도 설정 및 후진 타이밍)을 숙지하면 조작 반복을 줄여 더 신속하게 완료할 수 있습니다.`;
  } else {
    feedback += `${elapsedTime}초 만에 빠른 판단으로 주차를 완료하셨습니다. 공간 인지 능력이 매우 우수하십니다.`;
  }

  return feedback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      carType,
      mapId,
      elapsedTimeSeconds,
      collisionCount,
      lineViolationDurationSeconds,
      finalAngleOffsetDegree,
    } = body;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback to local rule-based coaching
      const feedback = generateLocalFeedback(
        carType,
        mapId,
        elapsedTimeSeconds,
        collisionCount,
        lineViolationDurationSeconds,
        finalAngleOffsetDegree
      );
      return NextResponse.json({ feedback, provider: 'local-rule-engine' });
    }

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              '당신은 친절하고 전문적인 주차 강사 AI 코치입니다. 사용자가 웹 주차 시뮬레이션 게임을 마쳤을 때 제출한 텔레메트리 데이터를 분석하여 맞춤형 피드백을 제공합니다. 친근하고 격려하는 어조(예: "~습니다", "~하세요", "~보세요")의 존댓말로 3문장 이내의 짧고 유용한 피드백을 한국어로 작성해 주세요. 주차 공식이나 팁을 언급해 주면 좋습니다.',
          },
          {
            role: 'user',
            content: `차종: ${carType} (compact=소형차, sedan=준중형세단, suv=대형SUV)
맵 코스: ${mapId} (apartment=아파트지하T자, mart=대형마트T자, alleyway=골목길평행주차)
수행 결과:
- 소요 시간: ${elapsedTimeSeconds}초
- 충돌 횟수: ${collisionCount}회
- 주차선 침범 시간: ${lineViolationDurationSeconds}초
- 최종 정렬 각도 오차: ${finalAngleOffsetDegree.toFixed(1)}도

이 데이터에 맞춘 디테일한 피드백을 한국어로 한글이 깨지지 않게 제공해주세요.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 250,
      }),
    });

    if (!response.ok) {
      console.warn('OpenAI API status not ok, falling back to local rules');
      const feedback = generateLocalFeedback(
        carType,
        mapId,
        elapsedTimeSeconds,
        collisionCount,
        lineViolationDurationSeconds,
        finalAngleOffsetDegree
      );
      return NextResponse.json({ feedback, provider: 'fallback-local' });
    }

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content?.trim() || '';
    return NextResponse.json({ feedback, provider: 'openai' });
  } catch (err: any) {
    console.error('Error generating feedback:', err);
    return NextResponse.json(
      { error: '피드백 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
