#!/usr/bin/env node

import { Command } from 'commander'

import init from './init.js'
import sync from './sync.js'
import reset from './reset.js'

const program = new Command()

program
  .name('Sync Env a.k.a 환경관리공단')
  .version('1.1.5')
  .description('AWS Secretmanager에 등록된 환경변수와 자동 동기화를 해줍니다.')

program
  .command('init')
  .description('새로운 환경변수 설정을 등록합니다.')
  .action(init)

program
  .command('sync')
  .description('등록된 설정대로 동기화합니다.')
  .option('-v, --verbose', '세부 로그 표시 및 단계별 진행')
  .action(sync)

program
  .command('reset')
  .description('.syncenv 파일을 삭제합니다.')
  .action(reset)

program.parse(process.argv)
