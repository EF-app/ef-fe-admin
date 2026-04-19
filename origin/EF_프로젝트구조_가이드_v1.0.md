# EF 프로젝트 구조 가이드

> **Version 1.0** · 2026-04-19
> DDL v2.2 기준 · 설계 완료 단계 문서

---

## 목차

1. [전체 시스템 개요](#1-전체-시스템-개요)
2. [레포 구조](#2-레포-구조)
3. [백엔드 (EF-BE) 구조](#3-백엔드-ef-be-구조)
4. [유저 앱 (EF-FE) 구조](#4-유저-앱-ef-fe-구조)
5. [관리자 (EF-ADMIN) 모노레포](#5-관리자-ef-admin-모노레포)
6. [URL 경로 규칙](#6-url-경로-규칙)
7. [Security 필터체인](#7-security-필터체인)
8. [환경 변수](#8-환경-변수)
9. [Git 브랜치 전략](#9-git-브랜치-전략)
10. [커밋 컨벤션](#10-커밋-컨벤션)
11. [PR 템플릿](#11-pr-템플릿)
12. [코드 리뷰 체크리스트](#12-코드-리뷰-체크리스트)
13. [CI/CD 파이프라인](#13-cicd-파이프라인)
14. [개발 환경 셋업](#14-개발-환경-셋업)

---

## 1. 전체 시스템 개요

```
┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  유저 앱     │  │  관리자 앱       │  │  관리자 웹       │
│  (React      │  │  (React Native   │  │  (React + Vite)  │
│   Native     │  │   Expo)          │  │                  │
│   Expo)      │  │                  │  │                  │
│              │  │                  │  │                  │
│  /api/v1/**  │  │  /api/admin/**   │  │  /api/admin/**   │
└──────┬───────┘  └────────┬─────────┘  └────────┬─────────┘
       │                   │                     │
       └─────────────┬─────┴─────────┬──────────┘
                     │               │
              ┌──────▼───────────────▼──────┐
              │    EF-BE (Spring Boot)      │
              │    Java 21 + JPA            │
              └──────────────┬──────────────┘
                             │
              ┌──────────────▼──────────────┐
              │      MariaDB 11.4           │
              │      45 tables / 527 cols   │
              └─────────────────────────────┘

부가 인프라: Redis (캐시·세션) · Cloudflare R2 (사진·파일) · FCM (푸시) · WebSocket+STOMP (실시간 채팅)
```

---

## 2. 레포 구조

**Monorepo 전략:** 단일 Git 레포에 모든 프로젝트 포함.

```
EF/                              ← 루트 Git 레포
├── ef-be/                       ← Spring Boot 백엔드
├── ef-fe/                       ← 유저 앱 (Expo)
├── ef-admin/                    ← 관리자 모노레포 (npm workspaces)
│   ├── apps/
│   │   ├── mobile/              ← 관리자 앱 (Expo)
│   │   └── web/                 ← 관리자 웹 (React + Vite)
│   └── packages/
│       └── shared/              ← 앱·웹 공통 API/타입/유틸
├── docs/                        ← 설계 문서
│   ├── ef_schema_v2.2.sql
│   ├── EF_통합설계서_v3.7.docx
│   ├── EF_관리자_설계서_v1.3.docx
│   ├── EF_매칭_시나리오_v1.6.docx
│   ├── EF_유료화_시나리오_v1.0.docx
│   ├── EF_프로필심사_시나리오_v1.0.docx
│   └── EF_제재_시나리오_v1.0.docx
├── .github/
│   └── workflows/               ← CI/CD
├── .gitignore
└── README.md
```

**왜 Monorepo인가?**
- 소규모 팀이 프론트·백엔드를 같이 다룸
- API 명세 변경 시 프론트·백엔드 동시 수정 많음
- CI/CD 파이프라인 통합 관리 편리
- 팀 성장 후에도 Polyrepo 분리는 어렵지 않음

---

## 3. 백엔드 (EF-BE) 구조

### 3.1 도메인 주도 설계 (DDD)

레이어가 아닌 **도메인 기반**으로 패키지 분리. 각 도메인은 자기 완결적.

```
ef-be/src/main/java/com/efbe/
│
├── EfBeApplication.java
│
├── common/                        ← 전체 공통 인프라
│   ├── config/
│   │   ├── SecurityConfig.java
│   │   ├── WebConfig.java
│   │   ├── JpaConfig.java
│   │   ├── RedisConfig.java
│   │   ├── R2Config.java
│   │   ├── FcmConfig.java
│   │   └── WebSocketConfig.java
│   ├── entity/
│   │   └── BaseEntity.java
│   ├── exception/
│   │   ├── BusinessException.java
│   │   ├── ErrorCode.java
│   │   └── GlobalExceptionHandler.java
│   ├── dto/
│   │   ├── ApiResponse.java
│   │   └── PageResponse.java
│   ├── aop/
│   │   └── AdminAuditAspect.java
│   └── util/
│       ├── PairOrdering.java
│       └── UuidGenerator.java
│
├── security/                      ← 인증·인가
│   ├── config/
│   │   └── SecurityConfig.java    ← 경로별 필터체인 분리
│   ├── jwt/
│   │   ├── JwtProvider.java
│   │   ├── UserJwtFilter.java     ← /api/v1/** 적용
│   │   └── AdminJwtFilter.java    ← /api/admin/** 적용
│   └── principal/
│       ├── UserPrincipal.java
│       └── AdminPrincipal.java
│
├── domain/
│   │
│   ├── user/                      ← 유저
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── UserController.java
│   │   │   ├── ProfileController.java
│   │   │   └── admin/             ← ★ 관리자용
│   │   │       └── AdminUserController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── UserService.java
│   │   │   ├── ProfileService.java
│   │   │   └── admin/
│   │   │       ├── AdminUserService.java
│   │   │       └── AdminProfileReviewService.java
│   │   ├── dto/
│   │   │   ├── request/
│   │   │   ├── response/
│   │   │   └── admin/
│   │   │       ├── request/
│   │   │       └── response/
│   │   ├── entity/
│   │   │   ├── User.java
│   │   │   ├── UserProfile.java
│   │   │   ├── UserInterest.java
│   │   │   └── ...
│   │   └── repository/
│   │
│   ├── post/                      ← 포스트잇
│   ├── match/                     ← 매칭
│   ├── chat/                      ← 통합 채팅
│   ├── balGame/                   ← 밸런스 게임
│   ├── payment/                   ← 유료화
│   ├── notification/              ← 알림
│   ├── report/                    ← 신고
│   ├── category/                  ← 공통 카테고리
│   │
│   └── admin/                     ← 관리자 전용 엔티티 도메인
│       ├── account/               ← 관리자 계정
│       ├── notice/                ← 공지 관리
│       ├── suspension/            ← 유저 제재
│       ├── audit/                 ← 감사 로그
│       └── dashboard/             ← 대시보드 집계
│
└── scheduler/                     ← 배치 (ShedLock)
    ├── PostExpireScheduler.java
    ├── ChatStaleScheduler.java
    ├── SuspensionLiftScheduler.java
    └── ...
```

### 3.2 도메인 내 admin 서브패키지

**원칙:** Entity 를 소유한 도메인이 있으면 그 도메인 내 `admin/` 서브패키지 생성.

```
domain/balGame/
├── controller/
│   ├── BalGameController.java              ← 유저용
│   └── admin/
│       └── AdminBalGameController.java     ← 관리자용
├── service/
│   ├── BalGameService.java
│   └── admin/
│       └── AdminBalGameService.java
├── entity/
│   └── BalGame.java                         ← 공유
└── repository/
    └── BalGameRepository.java               ← 공유
```

**왜 이렇게?**
- Entity/Repository 공유 자연스러움
- 레이어별 탐색 유지 (controller/ 열면 전부 보임)
- 도메인 응집도 최고

### 3.3 판단 기준

```
"이 기능에 관리자 전용 Entity 가 있는가?"
    │
    ├─ YES → 해당 도메인 내 admin/ 서브패키지
    │    예) AdminUserController → domain/user/controller/admin/
    │
    └─ NO  → domain/admin/ 하위에 기능별
         예) AdminAuthController    (AdminAccount 전용 엔티티)
         예) AdminDashboardController (여러 도메인 집계, 엔티티 없음)
         예) AdminNoticeController   (Notice 엔티티 전용)
```

---

## 4. 유저 앱 (EF-FE) 구조

```
ef-fe/
├── app/                           ← expo-router
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── (auth)/                    ← 인증 플로우
│   │   ├── login.tsx
│   │   └── signup/
│   │       ├── terms.tsx
│   │       ├── phone-verify.tsx
│   │       ├── profile.tsx
│   │       └── photos.tsx
│   └── (tabs)/                    ← 하단 탭 5개
│       ├── _layout.tsx
│       ├── post-it/
│       ├── matching/
│       ├── chat/
│       ├── balance/
│       └── my/
│
├── src/
│   ├── api/                       ← axios 인스턴스 + 도메인별 API
│   │   ├── client.ts
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── posts.ts
│   │   ├── matching.ts
│   │   ├── chat.ts
│   │   └── ...
│   ├── components/
│   │   ├── ui/                    ← 공통 기본 컴포넌트
│   │   ├── post/
│   │   ├── matching/
│   │   ├── chat/
│   │   └── balance/
│   ├── hooks/
│   ├── store/                     ← Zustand
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── config/
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── app.json                       ← Expo 설정
├── eas.json                       ← EAS Build 설정
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 5. 관리자 (EF-ADMIN) 모노레포

**npm workspaces** 사용. `packages/shared` 에 API 클라이언트·타입 공유.

```
ef-admin/
├── apps/
│   ├── mobile/                    ← React Native Expo
│   │   ├── app/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   └── (tabs)/
│   │   │       ├── dashboard.tsx
│   │   │       ├── users/
│   │   │       ├── reports/
│   │   │       ├── refunds/
│   │   │       └── profile-reviews/
│   │   ├── src/
│   │   │   ├── components/        ← RN 컴포넌트
│   │   │   ├── store/
│   │   │   └── hooks/
│   │   ├── app.json
│   │   ├── eas.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── web/                       ← React + Vite
│       ├── src/
│       │   ├── main.tsx
│       │   ├── App.tsx
│       │   ├── pages/
│       │   │   ├── Login.tsx
│       │   │   ├── Dashboard.tsx
│       │   │   ├── Users.tsx
│       │   │   ├── Reports.tsx
│       │   │   ├── Refunds.tsx
│       │   │   ├── Notices.tsx
│       │   │   ├── BalanceGames.tsx
│       │   │   ├── ProfileReviews.tsx
│       │   │   └── AuditLogs.tsx
│       │   ├── components/        ← React (DOM) 컴포넌트
│       │   │   ├── layout/
│       │   │   ├── ui/
│       │   │   └── charts/
│       │   ├── router/
│       │   ├── store/
│       │   └── hooks/
│       ├── index.html
│       ├── vite.config.ts
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── shared/                    ← ★ 앱·웹 공통 (UI 없는 것만)
│       ├── src/
│       │   ├── api/               ← API 함수
│       │   ├── types/             ← 백엔드 DTO 기반 타입
│       │   ├── constants/
│       │   └── utils/
│       ├── package.json
│       └── tsconfig.json
│
├── package.json                   ← workspaces 루트
├── tsconfig.base.json
└── .env.example
```

### 5.1 루트 `package.json`

```json
{
  "name": "ef-admin",
  "private": true,
  "workspaces": [
    "apps/mobile",
    "apps/web",
    "packages/shared"
  ],
  "scripts": {
    "dev:web":    "npm run dev --workspace=apps/web",
    "dev:mobile": "npm run start --workspace=apps/mobile",
    "build:web":  "npm run build --workspace=apps/web",
    "type-check": "tsc -b"
  }
}
```

### 5.2 shared/ 에 넣을 것 vs 뺄 것

| 넣기 ✅ | 빼기 ❌ |
|---------|---------|
| API 클라이언트 (axios) | UI 컴포넌트 (RN vs React DOM 다름) |
| 타입 정의 (DTO) | 라우팅 |
| 상수 (REASON_001 등) | 상태 관리 스토어 |
| 순수 함수 유틸 | 플랫폼별 storage |

---

## 6. URL 경로 규칙

```
/api/v1/**          →  유저 앱 (UserJwtFilter)
/api/admin/**       →  관리자 앱·웹 공통 (AdminJwtFilter)
/admin/**           →  관리자 웹 정적 파일 (옵션, Spring Boot 포함 시)
```

### 예시

```
# 유저 앱
POST /api/v1/auth/login
GET  /api/v1/posts
POST /api/v1/matches/like
GET  /api/v1/chats

# 관리자 공통
POST /api/admin/auth/login
GET  /api/admin/dashboard/summary
GET  /api/admin/users
GET  /api/admin/profile-reviews
PATCH /api/admin/users/{uuid}/suspend
```

---

## 7. Security 필터체인

Spring Security `@Order` 로 경로별 3단계 필터체인 분리.

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean @Order(1)
    public SecurityFilterChain adminApiChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/admin/**")
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/admin/auth/login").permitAll()
                .anyRequest().hasRole("ADMIN")
            )
            .addFilterBefore(adminJwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean @Order(2)
    public SecurityFilterChain adminStaticChain(HttpSecurity http) throws Exception {
        // 관리자 웹을 Spring Boot 에 포함할 경우만 사용
        http.securityMatcher("/admin/**")
            .authorizeHttpRequests(a -> a
                .requestMatchers("/admin/login.html", "/admin/css/**", "/admin/js/auth.js").permitAll()
                .anyRequest().authenticated()
            );
        return http.build();
    }

    @Bean @Order(3)
    public SecurityFilterChain userApiChain(HttpSecurity http) throws Exception {
        http
            .securityMatcher("/api/v1/**")
            .csrf(c -> c.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(userJwtFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
```

---

## 8. 환경 변수

### 8.1 백엔드 (`application.yml`)

```yaml
spring:
  profiles:
    active: ${SPRING_PROFILES_ACTIVE:local}

jwt:
  user-secret: ${JWT_USER_SECRET}
  admin-secret: ${JWT_ADMIN_SECRET}
  user-expiration-minutes: 10080   # 7일
  admin-expiration-minutes: 30     # 30분 (짧게)

cors:
  admin-web-origin: ${ADMIN_WEB_ORIGIN:http://localhost:5173}

fcm:
  service-account-path: ${FCM_SERVICE_ACCOUNT_PATH}

r2:
  account-id: ${R2_ACCOUNT_ID}
  access-key: ${R2_ACCESS_KEY}
  secret-key: ${R2_SECRET_KEY}
  bucket: ${R2_BUCKET:ef-photos}
```

### 8.2 유저 앱 (`.env`)

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_WS_URL=ws://localhost:8080/ws
```

### 8.3 관리자 앱 (`.env`)

```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
```

### 8.4 관리자 웹 (`.env`)

```bash
VITE_API_URL=http://localhost:8080
```

---

## 9. Git 브랜치 전략

**Git Flow 의 경량 버전** — `main` / `develop` / `feature/*` / `hotfix/*`.

```
main        ← 운영 배포 (태그: v1.0.0, v1.1.0 ...)
 ↑
develop     ← 통합 개발 (다음 릴리스 준비)
 ↑
feature/*   ← 기능 개발 (develop 에서 분기, develop 으로 PR)
hotfix/*    ← 긴급 수정 (main 에서 분기, main + develop 으로 PR)
```

### 9.1 브랜치 명명 규칙

```
feature/EF-123-add-profile-review   # 이슈 번호 + 설명
feature/payment-refund-flow          # 이슈 없으면 설명만
hotfix/fix-login-crash               # 긴급 수정
release/v1.1.0                       # 릴리스 준비 (선택)
```

### 9.2 워크플로우

```bash
# 기능 개발
git checkout develop
git pull origin develop
git checkout -b feature/profile-review

# 개발 · 커밋 · 푸시
git add .
git commit -m "feat(user): add profile review approval endpoint"
git push origin feature/profile-review

# GitHub 에서 PR 생성 (→ develop)
# 리뷰 후 머지
```

---

## 10. 커밋 컨벤션

**Conventional Commits** 스타일 사용.

```
<type>(<scope>): <subject>

[optional body]

[optional footer]
```

### 10.1 type 목록

| type | 의미 |
|------|------|
| `feat` | 신규 기능 |
| `fix` | 버그 수정 |
| `refactor` | 리팩토링 (기능 변화 없음) |
| `style` | 코드 스타일 (포맷팅, 세미콜론 등) |
| `docs` | 문서 수정 |
| `test` | 테스트 추가·수정 |
| `chore` | 빌드·설정·의존성 (코드 외) |
| `perf` | 성능 개선 |

### 10.2 scope 예시

- `user`, `post`, `match`, `chat`, `balGame`, `payment`, `admin`, `auth`
- `api`, `web`, `mobile`, `shared`
- `db`, `docker`, `ci`

### 10.3 예시

```
feat(match): add PRE_MESSAGE trigger_type support

Enable tracking how matches are established (mutual like, reply to pre-message,
or like after receiving pre-message) via the trigger_type enum column.

Closes #123
```

```
fix(chat): prevent duplicate chat room creation on concurrent reply

Added pessimistic lock on post_id lookup before creating new POST room.
```

```
chore(deps): upgrade spring-boot to 3.2.1
```

---

## 11. PR 템플릿

`.github/pull_request_template.md`:

```markdown
## 📋 변경 내용

(무엇을 왜 변경했는지 2-3줄)

## 🔗 관련 이슈

Closes #<이슈 번호>

## ✅ 체크리스트

- [ ] 로컬에서 빌드·테스트 통과
- [ ] 신규/수정 API 가 OpenAPI 명세서 반영
- [ ] DDL 변경 시 마이그레이션 스크립트 포함
- [ ] 관련 문서 (설계서·시나리오) 갱신
- [ ] 환경변수 변경 시 `.env.example` 갱신

## 🧪 테스트 방법

(리뷰어가 로컬에서 검증할 수 있는 방법)

## 📸 스크린샷 (UI 변경 시)

(선택)

## 📝 추가 리뷰 요청사항

(예: "DB 인덱스 전략 봐주세요")
```

---

## 12. 코드 리뷰 체크리스트

### 12.1 백엔드

- [ ] Controller 는 DTO 만 받고 Entity 노출하지 않음
- [ ] `@Transactional` 범위 적절 (최소 범위 원칙)
- [ ] 관리자 Controller 는 `@AdminAction` 으로 감사 로그 자동 기록
- [ ] N+1 문제 없음 (JOIN FETCH 또는 @EntityGraph 활용)
- [ ] FK 에 ON DELETE 전략 명시 (CASCADE/SET NULL/RESTRICT)
- [ ] 시간 관련 로직은 `LocalDateTime.now()` 주입 가능하게 (테스트 용이성)
- [ ] 외부 I/O (PG, FCM, R2) 는 재시도·타임아웃 설정
- [ ] 로그에 민감정보 (비밀번호, 토큰) 출력 안 함

### 12.2 프론트

- [ ] API 호출 시 loading·error 상태 UI 처리
- [ ] 타입 any 사용 지양, 구체 타입 지정
- [ ] useEffect 의존성 배열 정확
- [ ] 메모이제이션 필요 시 useMemo/useCallback
- [ ] 네비게이션 후 뒤로 가기 동작 확인
- [ ] 폼 유효성 검증 (클라이언트·서버 양쪽)

### 12.3 보안

- [ ] 관리자 API 에 `hasRole('ADMIN')` 적용
- [ ] 입력값 검증 (@Valid, @Pattern)
- [ ] SQL 인젝션 방어 (JPQL Parameter Binding)
- [ ] 파일 업로드 시 확장자·크기 제한
- [ ] 개인정보 · 결제 정보 로그 미출력

---

## 13. CI/CD 파이프라인

### 13.1 아키텍처

```
[GitHub Push]
    │
    ├─ feature/* / develop → 테스트만 실행
    ├─ develop → 스테이징 자동 배포
    └─ main    → 운영 자동 배포 (수동 승인)
    
[배포 타겟]
    ├─ 백엔드 (ef-be)          → Render
    ├─ 유저 앱 (ef-fe)         → EAS Build → 앱스토어·플레이스토어
    ├─ 관리자 앱 (ef-admin/mobile) → EAS Build → 내부 배포
    └─ 관리자 웹 (ef-admin/web) → Vercel 또는 Spring Boot static/
```

### 13.2 GitHub Actions 워크플로우

#### `.github/workflows/be-test.yml`

```yaml
name: BE Test

on:
  pull_request:
    paths:
      - 'ef-be/**'

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mariadb:
        image: mariadb:11.4
        env:
          MARIADB_ROOT_PASSWORD: root
          MARIADB_DATABASE: ef_db_test
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: 21
          distribution: 'temurin'
      - name: Run tests
        working-directory: ef-be
        run: ./gradlew test
```

#### `.github/workflows/be-deploy.yml`

```yaml
name: BE Deploy

on:
  push:
    branches: [main]
    paths:
      - 'ef-be/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Trigger Render deploy
        run: |
          curl -X POST "https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys" \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}"
```

#### `.github/workflows/admin-web-deploy.yml`

```yaml
name: Admin Web Deploy

on:
  push:
    branches: [main]
    paths:
      - 'ef-admin/apps/web/**'
      - 'ef-admin/packages/shared/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install & Build
        working-directory: ef-admin
        run: |
          npm ci
          npm run build:web
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ef-admin/apps/web
          vercel-args: '--prod'
```

#### `.github/workflows/fe-build.yml`

```yaml
name: FE EAS Build

on:
  workflow_dispatch:  # 수동 트리거
    inputs:
      profile:
        description: 'Build profile'
        required: true
        default: 'preview'
        type: choice
        options:
          - preview
          - production

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - name: Install
        working-directory: ef-fe
        run: npm ci
      - name: EAS Build
        working-directory: ef-fe
        run: eas build --platform all --profile ${{ github.event.inputs.profile }} --non-interactive
```

---

## 14. 개발 환경 셋업

### 14.1 필수 도구

- **Java 21** (Temurin 권장)
- **Node.js 20+** + **npm 7+** (workspaces 지원)
- **Docker Desktop** (MariaDB·Redis 로컬 실행용)
- **Git 2.40+**

### 14.2 최초 셋업

```bash
# 1. 레포 clone
git clone https://github.com/YOUR_ORG/EF.git
cd EF

# 2. Docker 로 DB 실행
cd ef-be
docker-compose up -d

# 3. 백엔드 실행
./gradlew bootRun
# → localhost:8080

# 4. 유저 앱 실행 (별도 터미널)
cd ../ef-fe
npm install
npx expo start

# 5. 관리자 설치 (모노레포, 루트에서 한 번)
cd ../ef-admin
npm install

# 6. 관리자 웹 실행
npm run dev:web
# → localhost:5173

# 7. 관리자 앱 실행 (별도 터미널)
npm run dev:mobile
```

### 14.3 `docker-compose.yml`

`ef-be/docker-compose.yml`:

```yaml
version: '3.8'
services:
  mariadb:
    image: mariadb:11.4
    ports:
      - "3306:3306"
    environment:
      MARIADB_ROOT_PASSWORD: root
      MARIADB_DATABASE: ef_db
    volumes:
      - ./docker/mariadb:/var/lib/mysql
      - ./src/main/resources/db/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./src/main/resources/db/data-common.sql:/docker-entrypoint-initdb.d/02-common.sql
      - ./src/main/resources/db/data-dev.sql:/docker-entrypoint-initdb.d/03-dev.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

### 14.4 관리자 웹 주소 접근

```
http://localhost:5173          # Vite 기본 포트
```

### 14.5 관리자 앱 Expo Go 접근

```bash
cd ef-admin/apps/mobile
npx expo start
# → QR 코드 스캔 (Expo Go 앱)
```

---

## 📌 문서 히스토리

| 버전 | 날짜 | 변경 내용 |
|------|:---:|-----------|
| v1.0 | 2026-04-19 | 초안 작성. DDL v2.2 기준 · 모노레포 구조 확정 |

---

## 📚 관련 문서

- `ef_schema_v2.2.sql` — DDL (최신)
- `EF_통합설계서_v3.7.docx` — 시스템 전체 설계
- `EF_관리자_설계서_v1.3.docx` — 관리자 도메인
- `EF_매칭_시나리오_v1.6.docx` — 매칭 플로우
- `EF_유료화_시나리오_v1.0.docx` — 유료화 구조
- `EF_프로필심사_시나리오_v1.0.docx` — 프로필 심사
- `EF_제재_시나리오_v1.0.docx` — 유저 제재
