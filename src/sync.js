import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { ScanCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'

import dayjs from 'dayjs'
import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

const syncEnvFilePath = path.join(process.cwd(), '.syncenv')
const AWS_REGION = 'ap-northeast-2'
const DYNAMODB_TABLE_NAME = 'syncenv'

const sync = async (options) => {
  const { verbose } = options

  if (!fs.existsSync(syncEnvFilePath)) {
    console.log('.syncenv 파일이 존재하지 않습니다. init을 먼저 실행해주세요.')
    return
  }

  if (verbose) {
    const answers = await inquirer.prompt([
      {
        name: 'confirm',
        type: 'confirm',
        message: '정말 동기화 하시겠습니까?'
      }
    ])

    if (!answers.confirm) {
      console.log('동기화를 취소합니다.')
      return
    }
  }

  const envData = JSON.parse(fs.readFileSync(syncEnvFilePath, 'utf8'))
  const syncInfo = await getSyncInfo()

  for (const { key, path, syncedAt } of envData) {
    if (verbose) console.log(`\n[${key}]`)

    const syncItem = syncInfo.find(item => item.SecretName.S === key)

    if (!syncItem) {
      if (verbose) console.log('동기화된 Secretsmanager Key가 없습니다.')
      continue
    }

    const envFile = fs.existsSync(path)
    let allowSync = false

    if (!envFile) {
      if (verbose) console.log('환경변수 파일이 존재하지 않습니다. 동기화를 진행합니다.')
      allowSync = true
    } else if (!syncedAt) {
      if (verbose) console.log('최초 동기화를 진행합니다.')
      allowSync = true
    } else if (!syncedAt || dayjs(syncItem.LastChangedDate.S) >= dayjs(syncedAt)) {
      if (verbose) console.log('최근에 업데이트 되었으므로 동기화를 진행합니다.')
      allowSync = true
    } else {
      if (verbose) console.log('최신 상태입니다. 동기화를 진행하지 않습니다.')
    }

    if (allowSync) {
      const success = await saveSecretValues(key, path)

      if (success) {
        await updateSyncedAt(key)
      }
    }
  }

  if (verbose) console.log('\n동기화 완료!')
}

async function updateSyncedAt (key) {
  const existingConfigs = JSON.parse(
    fs.readFileSync(syncEnvFilePath, 'utf8')
  )
  const existingConfig = existingConfigs.find(
    (config) => config.key === key
  )
  existingConfig.syncedAt = dayjs().toISOString()
  fs.writeFileSync(syncEnvFilePath, JSON.stringify(existingConfigs, null, 2))
}

async function getSecretValues (SecretId) {
  try {
    const client = new SecretsManagerClient({ region: AWS_REGION })
    const command = new GetSecretValueCommand({ SecretId })
    const { SecretString } = await client.send(command)
    return JSON.parse(SecretString)
  } catch (error) {
    console.log(
`설정된 Secret을 받아올 수 없습니다. 아래와 같은 이유가 있을 수 있습니다.
  - 현재 설정된 AWS Credential이 올바른지 확인해주세요.
  - 설정된 SecretId가 올바른지 확인해주세요.
  - 설정된 Secret이 삭제되었거나, 권한이 없는 경우입니다.
`)
    return {}
  }
}

async function saveSecretValues (SecretId, envPath) {
  const SecretValues = await getSecretValues(SecretId)

  if (SecretValues) {
    const envContent = Object.entries(SecretValues)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    fs.writeFileSync(envPath, envContent)
  } else {
    console.log('환경변수 파일을 생성할 수 없습니다.')
    return false
  }
}

async function getSyncInfo () {
  const client = new DynamoDBClient({ region: AWS_REGION })
  const command = new ScanCommand({
    TableName: DYNAMODB_TABLE_NAME
  })

  const { Items } = await client.send(command)
  return Items
}

export default sync
