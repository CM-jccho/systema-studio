# SYSTEMA Studio

**일을 반복하지 말고, 시스템을 성장시키세요.**
A personal work operating system for the work you repeat, in the browser, with no server and no AI bill.

- 라이브: https://cm-jccho.github.io/systema-studio/
- 한국어와 영어를 실시간으로 전환합니다.

## 무엇인가

업무 하나를 **컨텍스트, 규칙, 검증, 내보내기**의 네 부분으로 정리하는 작업 공간입니다. 채팅 기록이 아니라 업무 시스템이 쌓입니다.

- **컨텍스트 박스** — 목표, 배경, 제약, 성공 기준을 구조화하고 시스템별로 저장
- **규칙서** — 실수와 피드백을 규칙으로 바꾸고, 버전 메모와 검증 통과 횟수를 기록
- **적대적 검증** — 고객, 재무, 경쟁, 개발과 법무 네 관점의 체크리스트와 반론 프롬프트
- **AI 패키지** — Claude, ChatGPT, Gemini에 맞춘 구조화 마크다운을 원클릭 복사, `.md`와 `.json` 다운로드
- **성장 기록** — 시스템 레벨, 검증 통과, 월 절감 시간 시뮬레이터
- **BYOK (선택)** — 본인 OpenAI 또는 Anthropic 키를 브라우저에만 넣고 네 관점 검증을 실행

프리셋 3종(B2B 제휴, PRD와 QA, 1인 프로덕트 런칭)이 기본으로 들어 있어 열자마자 쓸 수 있습니다.

## 설계 원칙

- **서버 없음, 계정 없음.** 모든 데이터는 `localStorage`에만 저장됩니다. AI 키도 마찬가지이며, 키를 넣지 않아도 복사 기능은 100% 동작합니다.
- **AI 운영비 0원.** 모델 호출은 사용자가 명시적으로 실행할 때, 사용자의 키로, 브라우저에서만 일어납니다.
- **글로벌.** UI, 프리셋, 내보내기 프롬프트가 한국어와 영어로 동시에 유지됩니다.

## 개발

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # tsc --noEmit && vite build
npm run preview
```

Vite 6, React 19, TypeScript. 폰트는 Pretendard(OFL)와 Instrument Serif(OFL)를 자체 호스팅합니다.

## 테스트

```bash
python3 tests/e2e.py     # 54 checks: CRUD, rules, reviews, export, import, i18n, pro modal, persistence, responsive
python3 tests/astryx.py  # 25 checks: a11y, contrast, focus, touch targets, CSP, local-only
python3 tools/shoot.py   # desktop and mobile screenshots
```

E2E는 빌드 결과(`dist/`)를 정적 서버로 띄우고 Playwright로 확인합니다.

## 보안

- 렌더링에 `dangerouslySetInnerHTML`을 쓰지 않습니다. 가져온 JSON은 React 텍스트로만 표시됩니다.
- 프로덕션 HTML에 CSP(`default-src 'self'`, `connect-src`는 OpenAI와 Anthropic API만)를 넣습니다.
- API 오류 메시지에서 키 문자열을 지운 뒤 표시합니다.
- 외부 분석, 추적, 쿠키가 없습니다.

## 배포

`gh-pages` 브랜치에 `dist/`를 올리고 GitHub Pages로 서비스합니다. `vite.config.ts`의 `base`는 `./`라서 프로젝트 하위 경로에서도 동작합니다.

## 라이선스

이 저장소의 웹앱 코드는 공개되어 있지만, 별도로 판매하는 《SYSTEMA Pro Work Systems Pack》은 포함되어 있지 않습니다.
