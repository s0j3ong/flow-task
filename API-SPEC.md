# Task Flow API Spec

PLAN.md의 3장(API) 작업에 맞춰 구현된 엔드포인트만 기록한다.
아직 구현되지 않은 엔드포인트는 추가하지 않는다.

## GET /api/health

서버 동작 여부 확인용 상태 점검 엔드포인트이다.

### 요청

파라미터 없음.

### 응답

- 상태 코드: `200`
- 본문:

```json
{
  "status": "ok"
}
```

### 확인 방법

```
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:8000/api/health
curl -s http://127.0.0.1:8000/api/health
```

## GET /api/tasks

등록된 할 일 목록을 조회한다. (메모리 저장, API 재시작 시 초기화됨)

### 쿼리 파라미터 (전부 선택, AND 조건으로 적용)

- `q`: 제목 검색어 (대소문자 구분 없이 부분 일치)
- `status`: `TODO` | `DOING` | `DONE`
- `priority`: `HIGH` | `NORMAL` | `LOW`

### 응답

- 상태 코드: `200`
- 본문: Task 객체 배열

### 확인 방법

```
curl -s http://127.0.0.1:8000/api/tasks
curl -s "http://127.0.0.1:8000/api/tasks?q=%ED%85%8C%EC%8A%A4%ED%8A%B8&status=TODO&priority=HIGH"
```

## POST /api/tasks

할 일을 새로 등록한다.

### 요청 본문

```json
{
  "title": "문자열, 공백 제거 후 1~100자 (필수)",
  "description": "문자열, 최대 2000자 (선택, 기본값 \"\")",
  "priority": "HIGH | NORMAL | LOW (선택, 기본값 NORMAL)",
  "due_date": "YYYY-MM-DD 또는 생략 (선택, 기본값 null)"
}
```

생성된 항목의 `status`는 항상 `TODO`이며, `id`와 `created_at`은 서버가 생성한다.

### 응답

- 상태 코드: `201`
- 본문: 생성된 Task 객체 (id, title, description, status, priority, due_date, created_at 포함)
- 입력 검증 위반(제목 누락/공백/100자 초과, 설명 2000자 초과, priority/due_date 형식 오류 등): `422`

### 확인 방법

```
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/tasks \
  -H "Content-Type: application/json" -d '{"title": "테스트"}'
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://127.0.0.1:8000/api/tasks \
  -H "Content-Type: application/json" -d '{"title": "   "}'
```

Swagger UI(`/docs`)에서도 동일하게 등록 후 `GET /api/tasks`로 조회해 확인할 수 있다.

## PATCH /api/tasks/{task_id}

할 일 항목을 부분 수정한다. 요청 본문에 포함되지 않은 필드는 기존 값을 그대로 유지한다.

### 요청 본문 (모두 선택, 전달한 필드만 변경)

```json
{
  "title": "문자열, 공백 제거 후 1~100자",
  "description": "문자열, 최대 2000자",
  "status": "TODO | DOING | DONE",
  "priority": "HIGH | NORMAL | LOW",
  "due_date": "YYYY-MM-DD 또는 null (마감일 해제)"
}
```

- `title`, `description`, `status`, `priority`는 `null`로 보낼 수 없다 (생략은 가능, 명시적 null은 422).
- `due_date`만 `null`을 보내 마감일을 해제할 수 있다.

### 응답

- 상태 코드: `200`, 본문: 수정된 Task 객체
- 입력 검증 위반: `422`
- 존재하지 않는 id: `404`

### 확인 방법

```
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://127.0.0.1:8000/api/tasks/1 \
  -H "Content-Type: application/json" -d '{"status": "DOING"}'
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://127.0.0.1:8000/api/tasks/9999 \
  -H "Content-Type: application/json" -d '{"status": "DOING"}'
```

## DELETE /api/tasks/{task_id}

할 일 항목을 삭제한다.

### 응답

- 상태 코드: `204` (본문 없음)
- 존재하지 않는 id: `404`

### 확인 방법

```
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://127.0.0.1:8000/api/tasks/1
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://127.0.0.1:8000/api/tasks/9999
```
