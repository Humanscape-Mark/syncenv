import { Command } from 'commander'

import init from './init.js'
import sync from './sync.js'

const program = new Command()

program
  .name('Sync Env a.k.a 환경관리공단')
  .version('1.0.0')
  .description('AWS Secretmanager에 등록된 환경변수와 자동 동기화를 해줍니다.')

program.command('init').action(init)
program.command('sync').action(sync)

program.parse(process.argv)
