import { ScanCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'

import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

const syncEnvFilePath = path.join(process.cwd(), '.syncenv')
const AWS_REGION = 'ap-northeast-2'
const DYNAMODB_TABLE_NAME = 'syncenv'

async function init () {
  const accountAnswer = await inquirer.prompt([{
    name: 'account',
    type: 'list',
    message: '계정 유형을 선택해주세요.',
    choices: ['BOX_DEV', 'BOX_PROD', 'FH_DEV', 'FH_PROD'],
    validate: (value) => {
      if (value.length) return true
      return '계정 유형을 선택해주세요.'
    }
  }])

  const secretNames = await getSyncInfo(accountAnswer.account)

  const answers = await inquirer.prompt([
    {
      name: 'key',
      type: 'list',
      message: 'AWS Secretsmanager Key를 선택해주세요.',
      choices: secretNames,
      validate: (value) => {
        if (value.length) return true
        return 'AWS Secretsmanager Key를 선택해주세요.'
      }
    },
    {
      name: 'path',
      type: 'input',
      message: 'Local에 저장될 env file의 path를 입력해주세요.',
      default: '.env',
      validate: async (value) => {
        if (value.length) {
          if (checkExistPath(value)) {
            return '이미 동일한 path에 대한 설정이 존재합니다. 다시 확인해주세요.'
          }
          return true
        }
        return 'Local에 저장될 env file의 path를 입력해주세요.'
      }
    }
  ])

  let configs = []

  if (fs.existsSync(syncEnvFilePath)) {
    const existingConfigs = JSON.parse(
      fs.readFileSync(syncEnvFilePath, 'utf8')
    )
    const existingConfig = existingConfigs.find(
      (config) => config.key === answers.key
    )
    if (existingConfig) {
      if (existingConfig.path === answers.path) {
        console.log('이미 동일한 설정이 존재합니다.')
        return
      } else {
        const { confirm } = await inquirer.prompt({
          name: 'confirm',
          type: 'confirm',
          message:
            '같은 key 설정이 존재하지만 path가 다릅니다. 추가하시겠습니까?'
        })
        if (!confirm) return
      }
    }

    configs = existingConfigs
  }

  answers.account = accountAnswer.account

  configs.push(answers)

  fs.writeFileSync(syncEnvFilePath, JSON.stringify(configs, null, 2))
  console.log('.syncenv 파일이 업데이트 되었습니다.')
}

async function checkExistPath (envPath) {
  if (fs.existsSync(syncEnvFilePath)) {
    const existingConfigs = JSON.parse(
      fs.readFileSync(syncEnvFilePath, 'utf8')
    )
    const existingConfig = existingConfigs.find(
      (config) => config.path === envPath
    )

    if (existingConfig) {
      return true
    }
  }
}

async function getSyncInfo (account) {
  const client = new DynamoDBClient({ region: AWS_REGION })
  const command = new ScanCommand({
    TableName: DYNAMODB_TABLE_NAME,
    FilterExpression: 'Accounts = :Accounts',
    ExpressionAttributeValues: {
      ':Accounts': { S: account }
    }
  })

  try {
    const { Items } = await client.send(command)
    return Items.map((item) => item.SecretName.S)
  } catch (error) {
    console.error('DynamoDB 조회 중 오류 발생:', error)
    return []
  }
}

export default init
