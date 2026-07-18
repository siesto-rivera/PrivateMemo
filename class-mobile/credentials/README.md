# App Store Connect API key (TestFlight 비대화형 제출용)

`eas submit -p ios` 를 대화형 Apple 로그인 없이 실행하기 위한 자격증명 폴더입니다.
**개인키(`.p8`)는 절대 커밋되지 않습니다** (`.gitignore`에서 `/credentials/*.p8` 제외).

## 1. ASC API 키 발급 (1회)
1. App Store Connect → **사용자 및 액세스** → **통합(Integrations)** → **App Store Connect API**
2. **키 생성(+)** → 이름 입력 → 액세스 권한 **App Manager** 선택 → 생성
3. 생성된 키의 **`.p8` 파일 다운로드** (⚠️ 재다운로드 불가, 한 번만 받을 수 있음)
4. 같은 화면에서 다음 값 확인:
   - **Key ID** (예: `ABCD123456`)
   - **Issuer ID** (계정 공통, 예: `69a6de70-...`)

## 2. 파일 배치
다운로드한 키를 이 폴더에 아래 이름으로 저장:
```
class-mobile/credentials/AuthKey.p8
```
(다른 이름을 쓰려면 `eas.json`의 `ascApiKeyPath`도 함께 수정)

## 3. eas.json 값 채우기
`class-mobile/eas.json` → `submit.production.ios` 의 placeholder를 실제 값으로 교체:
- `ascAppId` — App Store Connect의 앱 숫자 ID
  (앱 페이지 URL `.../apps/**1234567890**/...` 의 숫자, 또는 앱 정보 → Apple ID)
- `ascApiKeyId` — 위 Key ID
- `ascApiKeyIssuerId` — 위 Issuer ID

> PUBLIC 저장소이므로 위 식별자들을 공개 커밋에 남기고 싶지 않다면,
> eas.json 변경을 커밋하지 말고 로컬에만 두거나, 아래 4번(EAS 서버 저장)을 사용하세요.
> 식별자는 `.p8` 개인키 없이는 사용할 수 없어 노출 위험은 낮습니다.

## 4. 제출
```
cd class-mobile
npx eas-cli submit -p ios --latest --non-interactive
# 또는 특정 빌드: --id <BUILD_ID>
```

## (대안) EAS 서버에 키 저장 — 리포에 아무 비밀도 안 남기는 방식
로컬 `.p8` / eas.json 식별자 없이 쓰려면 실제 터미널에서 1회 등록:
```
npx eas-cli credentials
# iOS → App Store Connect API Key → Set up / upload  (.p8 경로·Key ID·Issuer ID 입력)
```
등록 후에는 `eas submit -p ios --non-interactive` 만으로 제출됩니다.
