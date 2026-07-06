이 프로젝트는 [`EasyNext`](https://github.com/easynext/easynext)를 사용해 생성된 [Next.js](https://nextjs.org) 프로젝트입니다.

## Getting Started

개발 서버를 실행합니다.<br/>
환경에 따른 명령어를 사용해주세요.

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인할 수 있습니다.

`app/page.tsx` 파일을 수정하여 페이지를 편집할 수 있습니다. 파일을 수정하면 자동으로 페이지가 업데이트됩니다.

## 기본 포함 라이브러리

- [Next.js](https://nextjs.org)
- [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript](https://www.typescriptlang.org)
- [ESLint](https://eslint.org)
- [Prettier](https://prettier.io)
- [Shadcn UI](https://ui.shadcn.com)
- [Lucide Icon](https://lucide.dev)
- [date-fns](https://date-fns.org)
- [react-use](https://github.com/streamich/react-use)
- [es-toolkit](https://github.com/toss/es-toolkit)
- [Zod](https://zod.dev)
- [React Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com)
- [TS Pattern](https://github.com/gvergnaud/ts-pattern)

## 사용 가능한 명령어

한글버전 사용

```sh
easynext lang ko
```

최신버전으로 업데이트

```sh
npm i -g @easynext/cli@latest
# or
yarn add -g @easynext/cli@latest
# or
pnpm add -g @easynext/cli@latest
```

Supabase 설정

```sh
easynext supabase
```

Next-Auth 설정

```sh
easynext auth

# ID,PW 로그인
easynext auth idpw
# 카카오 로그인
easynext auth kakao
```

유용한 서비스 연동

```sh
# Google Analytics
easynext gtag

# Microsoft Clarity
easynext clarity

# ChannelIO
easynext channelio

# Sentry
easynext sentry

# Google Adsense
easynext adsense
```

## Sitemap 사용법

이 프로젝트는 next-sitemap이 설정되어 있습니다.

- `next build` 명령어 실행 후 자동으로 sitemap.xml과 robots.txt 파일이 생성됩니다.
- 설정 파일은 프로젝트 루트의 `next-sitemap.config.js`에 있습니다.
- 생성된 파일은 `public` 디렉토리에 저장됩니다.

추가 설정이 필요한 경우 `next-sitemap.config.js` 파일을 수정하세요.
자세한 내용은 [next-sitemap 공식 문서](https://github.com/iamvishnusankar/next-sitemap)를 참조하세요.

## Microsoft Clarity 사용법

이 프로젝트는 Microsoft Clarity가 설정되어 있습니다. 프로젝트 ID: `xi5xxsai9m`

Microsoft Clarity는 사용자 행동 분석 도구로, 별도의 코드 없이 자동으로 사용자 세션을 기록하고 히트맵, 세션 재생 등의 기능을 제공합니다.

Clarity 컴포넌트는 `src/third-parties/Clarity.tsx`에 위치하며, `layout.tsx`에 자동으로 추가되었습니다.

자세한 내용은 [Microsoft Clarity 공식 문서](https://docs.microsoft.com/en-us/clarity/setup-and-installation/clarity-setup)를 참조하세요.

## Google AdSense 사용법

이 프로젝트는 Google AdSense가 설정되어 있습니다. 클라이언트 ID: `ca-pub-4315383149069646`

### 기본 설정
- AdSense 스크립트는 `src/third-parties/AdSense.tsx`에 위치하며, `layout.tsx`에 자동으로 추가되었습니다.
- 이 설정으로 Google AdSense 크롤러가 사이트를 분석할 수 있습니다.
- **참고**: AdSense 스크립트와 광고는 프로덕션 환경(`NODE_ENV=production`)에서만 로드됩니다.

### 광고 삽입 방법
특정 위치에 광고를 삽입하려면 다음과 같이 사용하세요:

```tsx
import { AdSenseAd } from '@/third-parties/AdSense';

export default function MyPage() {
  return (
    <div>
      <h1>페이지 제목</h1>
      {/* 광고 슬롯 ID를 지정하여 광고 삽입 */}
      <AdSenseAd slot="1234567890" />
      <p>페이지 내용...</p>
    </div>
  );
}
```

자세한 내용은 [Google AdSense 공식 문서](https://support.google.com/adsense/answer/9274025)를 참조하세요.
