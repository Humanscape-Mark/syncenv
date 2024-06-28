import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

const syncEnvFilePath = path.join(process.cwd(), '.syncenv')
const prompt = [
  {
    name: 'secretmanager_key',
    type: 'input',
    message: 'AWS Secretsmanager Key를 입력해주세요.',
    validate: (value) => {
      if (value.length) return true
      return 'AWS Secretsmanager Key를 입력해주세요.'
    }
  },
  {
    name: 'env_path',
    type: 'input',
    message: 'Local에 저장될 env file의 path를 입력해주세요.',
    validate: (value) => {
      if (value.length) return true
      return 'Local에 저장될 env file의 path를 입력해주세요.'
    },
    default: '.env'
  }
]

const init = async () => {
  const answers = await inquirer.prompt(prompt)
  let configs = []
  if (fs.existsSync(syncEnvFilePath)) {
    const existingConfigs = JSON.parse(
      fs.readFileSync(syncEnvFilePath, 'utf8')
    )
    const existingConfig = existingConfigs.find(
      (config) => config.secretmanager_key === answers.secretmanager_key
    )
    if (existingConfig) {
      if (existingConfig.env_path === answers.env_path) {
        console.log('이미 동일한 설정이 존재합니다.')
        return
      } else {
        const { confirm } = await inquirer.prompt({
          name: 'confirm',
          type: 'confirm',
          message:
            '같은 key가 존재하지만 env_path가 다릅니다. 추가하시겠습니까?'
        })
        if (!confirm) return
      }
    }
    configs = existingConfigs
  }
  configs.push(answers)
  fs.writeFileSync(syncEnvFilePath, JSON.stringify(configs, null, 2))
  console.log('.syncenv 파일이 업데이트 되었습니다.')
}

export default init
