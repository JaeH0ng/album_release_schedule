# 곡별 작업 폴더

각 곡은 `tracks/<번호_슬러그>/` 아래에서 독립적으로 관리한다. 곡 문서, Logic Pro 프로젝트, 녹음 파일과 바운스를 한 폴더 안에 모아 두고 다른 곡과 섞지 않는 것을 기본 원칙으로 한다.

## 표준 구조

```text
tracks/
  01_psyche/
    README.md
    logic/
    audio/
      demos/
      arrangement-tests/
      final-recordings/
    exports/
      bounces/
      stems/
    notes/
```

- `README.md`: 곡 상태, 키/BPM, 편곡 방향, 다음 행동
- `logic/`: 해당 곡 전용 Logic Pro 프로젝트 패키지와 백업 버전
- `audio/demos/`: 판단용 데모와 키/BPM 테스트
- `audio/arrangement-tests/`: 편곡 실험용 오디오
- `audio/final-recordings/`: 본녹음 원본
- `exports/bounces/`: 러프 바운스, 참고용 출력
- `exports/stems/`: 스템 정리본
- `notes/`: 곡별 추가 메모, 세션 보조 문서

## Logic Pro 운영 규칙

- 곡당 Logic Pro 프로젝트는 하나의 기본 프로젝트를 두고, 큰 분기점이 생기면 날짜 버전으로 복제한다.
- 권장 이름: `logic/<번호>_<slug>.logicx`
- 데모 단계부터 파일 저장 위치를 곡 폴더 안으로 고정한다.
- 플러그인 실험용 바운스는 프로젝트 밖이 아니라 해당 곡의 `exports/bounces/`에 둔다.

## 곡 목록

- [01 - Psyche](01_psyche/README.md)
- [02 - 괜한 말](02_gwaenhan-mal/README.md)
- [03 - 날 좀 봐줘요, 좀 봐줘요](03_look-at-me/README.md)
- [04 - 누군가의](04_nugungaui/README.md)
- [05 - 대동제](05_daedongje/README.md)
- [06 - 또다시](06_ttodasi/README.md)
- [07 - 새벽 두 시](07_2am/README.md)
- [08 - 소란스러운 밤](08_noisy-night/README.md)
- [09 - 스물 여덟](09_twenty-eight/README.md)
- [10 - good night](10_good-night/README.md)
- [새 곡 템플릿](TRACK_TEMPLATE.md)

현재 번호는 정리용 임시 번호다. 최종 곡 순서가 정해지면 폴더명, 문서 링크와 Logic Pro 프로젝트 이름을 함께 갱신한다.
