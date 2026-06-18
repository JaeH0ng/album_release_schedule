# 오디오 파일 정리

오디오 파일은 문서와 분리하되, 각 곡 문서에서 상대 경로로 연결한다.

## 권장 구조

```text
audio/
  demos/
    01/
  arrangement-tests/
    01/
  final-recordings/
    01/
  mixes/
  masters/
```

## 파일명 규칙

```text
곡번호_파트_날짜_버전.확장자
```

예:

```text
01_guitar-vocal_2026-07-02_v01.wav
01_tempo-test-82bpm_2026-07-05_v02.wav
01_lead-vocal_2026-09-03_take04.wav
```

`final`, `new`, `real-final` 같은 이름 대신 날짜와 버전 번호를 사용한다. DAW 원본과 대용량 오디오는 별도 백업을 두고, Git으로 관리하려면 Git LFS 사용 여부를 먼저 결정한다.
