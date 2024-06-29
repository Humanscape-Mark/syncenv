# Syncenv - 환경(변수)관리공단

환경변수를 더 편하게 쓰자!

## 설치

```
npm install -g whitehander/syncenv
```

## 요구사항

[AWS 자격증명](https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/cli-configure-files.html#cli-configure-files-methods)이 설정되어 있어야 합니다

## 사용

```
$ syncenv
```

```
Usage: Sync Env a.k.a 환경관리공단 [options] [command]

AWS Secretmanager에 등록된 환경변수와 자동 동기화를 해줍니다.

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  init [options]  새로운 환경변수 설정을 등록합니다.
  sync [options]  등록된 설정대로 동기화합니다.
  help [command]  display help for command
```
