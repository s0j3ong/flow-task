from backend.database import Base, engine
from backend import models  # noqa: F401  (register Task model with Base.metadata)


def init_db():
    Base.metadata.create_all(bind=engine)
    print("tasks 테이블을 포함한 스키마 초기화가 완료되었습니다.")


if __name__ == "__main__":
    init_db()
