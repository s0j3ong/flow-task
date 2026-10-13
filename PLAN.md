# Task Flow PLAN
## 작업 원칙
한 번에 아래 작업 하나만 구현한다. 실제 확인 전에는 완료로 표시하지 않는다.
상태는 [ ] 미완료, [x] 확인 완료로 관리하고 확인 결과를 각 항목 아래 기록한다.
## 2장: 브라우저 앱
- [x] T01: frontend/index.html, styles.css, app.js 생성. 제목 입력·등록·목록만 구현한다.
  확인: 두 항목 등록, 빈 제목 거절. 이 단계에서 새로고침하면 사라져도 정상이다.
  확인 결과 (2026-10-13): 헤드리스 브라우저로 두 항목 등록 및 공백 제목 거절 확인. 사용자도 직접 서버 구동 후 정상 동작 확인.
- [x] T02: localStorage(task-flow-v1) 저장·복원.
  확인: 새로고침 후 유지. 손상된 저장값을 자동 덮어쓰지 않는다.
  확인 결과 (2026-10-13): 헤드리스 브라우저로 두 항목 등록 후 새로고침 시 유지 및 세 번째 항목 추가(id 충돌 없음) 확인. localStorage에 손상된 값("{broken json")을 넣고 새로고침한 결과 목록은 비어 있고 안내 메시지가 표시되며, 저장값 자체는 변경되지 않고 그대로 유지됨을 확인.
- [x] T03: 상태 변경, 수정, 삭제 확인.
  확인: 삭제 취소 시 유지. 다른 항목이 수정되지 않는다.
  확인 결과 (2026-10-13): 헤드리스 브라우저로 3항목(A,B,C) 등록 후 B만 상태를 DOING으로 변경 → A,C는 TODO 유지 확인. A만 제목 수정 → B,C 제목 불변 확인. 빈 제목으로 수정 시도 시 거절 및 기존 제목 유지 확인. C 삭제를 취소하면 목록 유지, 다시 삭제를 확인하면 C만 제거되고 A,B는 그대로 유지됨을 id 기준으로 확인. 새로고침 후에도 상태·수정·삭제 결과가 모두 유지됨을 확인.
- [x] T04: 설명·우선순위·마감일·검색·필터·지연 표시.
  확인: 필터 중 수정·삭제, 어제 마감 TODO의 지연 표시.
  확인 결과 (2026-10-13): 헤드리스 브라우저로 확인. 어제 마감 + TODO + HIGH 항목에서만 "지연" 배지 표시, DONE으로 바꾸면 배지 사라짐(F09). 설명 수정 저장 확인, 2001자 설명은 거절. 제목 검색("task")+우선순위(HIGH)+상태(DONE) 필터를 AND로 적용 시 결과 0건으로 정확히 교집합 처리됨(F08). 검색 필터로 목록이 줄어든 상태에서 항목을 수정해도 id 기준으로 정확한 항목만 변경되고, 필터 해제 시 전체 목록에 반영됨을 확인.
## 3장: API
- [x] T05: API-SPEC.md 작성, FastAPI /api/health 구현.
  확인: curl로 200과 status=ok.
  확인 결과 (2026-10-13): 기존 .venv에 fastapi==0.143.0, uvicorn[standard]==0.54.0 설치 후 requirements.txt에 기록. backend/main.py에 GET /api/health 구현. uvicorn 구동 후 curl로 상태 코드 200, 본문 {"status":"ok"} 확인.
- [x] T06: 메모리 기반 /api/tasks GET과 POST.
  확인: /docs에서 등록 후 조회. 입력 위반은 422.
  확인 결과 (2026-10-13): backend/main.py에 메모리 리스트 기반 GET/POST /api/tasks 구현(Pydantic으로 제목 1~100자, 설명 2000자, priority enum, due_date 형식 검증). curl로 등록(201) 후 조회(200, 등록한 항목 포함) 확인. 빈 제목, 제목 누락, 101자 제목, 2001자 설명, 잘못된 priority, 잘못된 due_date 형식 모두 422 확인. /docs(Swagger UI) 정상 로드(200) 확인.
- [x] T07: PATCH·DELETE와 필터 구현.
  확인: 미전달 필드 유지, 없는 ID 404, 삭제 204.
  확인 결과 (2026-10-13): PATCH /api/tasks/{id}로 status만 전달 시 title/priority/due_date 등 미전달 필드 그대로 유지 확인(exclude_unset 기반). due_date만 null로 보내 해제 가능, title/description/status/priority를 명시적 null로 보내면 422. 없는 id PATCH/DELETE 모두 404. 정상 DELETE는 204이며 목록에서 제거됨을 GET으로 확인. GET /api/tasks의 q(제목 검색)·status·priority 쿼리를 함께 적용해 AND 조건으로 정확히 교집합 처리됨을 확인(F08).
- [x] T08: 프런트엔드 저장 처리를 API 호출로 교체.
  확인: 화면과 curl 목록이 같음. API 중지 시 오류 표시.
  확인 결과 (2026-10-13): frontend/app.js의 localStorage 저장을 제거하고 fetch로 GET/POST/PATCH/DELETE /api/tasks 호출하도록 교체. 교차 출처 호출을 위해 backend/main.py에 CORSMiddleware(127.0.0.1:5500 허용) 추가. 헤드리스 브라우저로 화면에서 2건 등록 후 화면 목록과 curl 목록이 완전히 일치함을 확인, curl로 직접 등록한 항목도 새로고침 시 화면에 반영됨을 확인. API 서버를 종료한 상태에서 최초 로드 및 등록 시도 시 "서버에 연결할 수 없습니다. API 서버 상태를 확인해주세요." 오류 메시지가 표시되고 목록은 비정상 데이터 없이 비어있음을 확인.
## 4장: DB
- [x] T09: MariaDB 전용 사용자·DB와 .env 준비. 접속 확인.
  확인 결과 (2026-10-13): 사용자가 직접 MariaDB 콘솔에서 DB(task_flow)와 전용 사용자 생성. 실제로 생성된 계정명은 'task_flow_app'@'localhost'(최초 요청한 'task_app_flow'와 단어 순서가 다름 — 사용자 확인 후 실제 생성된 이름을 그대로 사용하기로 결정). .env(DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD, 실제 값)와 .env.example(가짜 값)을 작성하고 .gitignore에 .env, .venv 추가. `mariadb -u task_flow_app -p1234 -h localhost -P 3306 task_flow -e "SELECT 1"`로 접속 확인 완료. `git check-ignore`로 .env가 추적에서 제외됨을 확인.
- [x] T10: backend/database.py, models.py, init_db.py 생성.
  확인: python -m backend.init_db 실행 후 tasks 테이블 확인.
  확인 결과 (2026-10-13): sqlalchemy==2.1.4, pymysql==2.2.8, python-dotenv==1.2.4 설치 후 requirements.txt에 기록(목적: ORM/DB 연동, 순수 파이썬 MariaDB 드라이버, .env 로딩). database.py에서 .env의 DB_HOST/PORT/NAME/USER/PASSWORD로 SQLAlchemy 엔진 구성. models.py에 PRD 데이터 필드(id, title, description, status, priority, due_date, created_at) 그대로 매핑한 Task 모델 작성. `python -m backend.init_db` 실행 후 `mariadb`로 `SHOW TABLES`, `DESCRIBE tasks`, `SHOW CREATE TABLE tasks` 확인해 컬럼/타입이 모두 의도대로 생성됨을 확인. 재실행해도 에러 없이 멱등하게 동작함을 확인.
- [x] T11: API 메모리 저장을 DB로 교체.
  확인: 등록한 행을 SQL로 조회. API 재시작 후 데이터 유지.
  확인 결과 (2026-10-13): backend/main.py의 메모리 리스트를 SQLAlchemy 세션(backend/database.py, backend/models.py의 Task 모델)으로 교체. API 응답 스키마는 Pydantic TaskOut(from_attributes)으로 ORM 객체를 그대로 직렬화. curl로 2건 등록 후 `mariadb`로 직접 SELECT하여 동일한 행 확인. API 프로세스를 종료 후 재시작해도 GET /api/tasks 결과가 그대로 유지됨을 확인. PATCH(미전달 필드 유지·null 거부·id 404), DELETE(204·404), GET 필터(q/status/priority AND) 모두 DB 전환 후에도 동일하게 동작함을 재확인(회귀 없음). 확인 후 테스트 데이터는 DELETE FROM tasks로 정리.
## 5장: 서버 분리
- [ ] T12: DB 서버 구성 후 App 서버에서 SELECT 1 확인.
- [ ] T13: App 서버 코드·가상환경·환경변수·systemd 구성.
  확인: App에서 /api/health 응답.
- [ ] T14: Web 서버 Nginx와 정적 파일·/api 프록시 구성.
  확인: Web 주소로 등록, DB 저장, App 재시작 후 유지.
## 실행 기준
T01~T04: python3 -m http.server 5500 --bind 127.0.0.1 --directory frontend
T05~T11: 가상환경에서 python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
T11 이후(frontend·backend 통합, 2026-10-13): FastAPI가 backend/main.py에서 StaticFiles로 frontend 정적 파일도 함께 서빙하도록 변경. 포트 8000 하나로 화면(`/`)과 API(`/api/*`)를 모두 제공하며, 더 이상 별도의 http.server(5500)나 CORS 설정이 필요 없음. frontend/app.js의 API_BASE도 절대경로에서 상대경로(`/api`)로 변경. 실행은 가상환경에서 `python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000` 하나만 하면 됨.
실제 존재하는 파일을 확인한 뒤 명령을 실행한다.
## 기록
각 작업에 변경 파일, 실행 명령, 실제 확인 결과, 남은 오류를 기록한다.
정상 동작을 확인한 작업 단위로 Git 커밋한다.