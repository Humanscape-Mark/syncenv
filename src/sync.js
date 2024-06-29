import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { ScanCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb'

import dayjs from 'dayjs'
import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

const syncEnvFilePath = path.join(process.cwd(), '.syncenv')

const sync = async () => {
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

  console.log('동기화를 시작합니다.')
  const envData = JSON.parse(fs.readFileSync(syncEnvFilePath, 'utf8'))

  console.log('동기화 정보를 가져옵니다.')
  const syncInfo = await getSyncInfo()

  for (const { key, path, region, syncedAt } of envData) {
    console.log(`${key}의 동기화 정보를 확인합니다.`)

    const syncItem = syncInfo.find(item => item.SecretName.S === key)

    if (!syncItem) {
      console.log(`Secret ${key} 정보가 없습니다. DynamoDB에 추가해주세요.`)
      continue
    }

    if (!syncedAt || dayjs(syncItem.LastChangedDate.S) >= dayjs(syncedAt)) {
      console.log(`Secret ${key}가 업데이트 되었으므로 동기화를 진행합니다.`)

      await saveSecretValues(region, key, path)
      await updateSyncedAt(key)
    } else {
      console.log(`Secret ${key}가 최신 상태입니다. 동기화를 진행하지 않습니다.`)
    }
  }

  console.log('동기화 완료!')
}

async function updateSyncedAt (key) {
  const existingConfigs = JSON.parse(
    fs.readFileSync(syncEnvFilePath, 'utf8')
  )
  const existingConfig = existingConfigs.find(
    (config) => config.key === key
  )
  existingConfig.syncedAt = dayjs().toISOString()
  fs.writeFileSync(syncEnvFilePath, JSON.stringify(existingConfigs))
}

async function saveSecretValues (region, SecretId, envPath) {
  const client = new SecretsManagerClient({ region })
  const command = new GetSecretValueCommand({ SecretId })
  const { SecretString } = await client.send(command)
  const envContent = Object.entries(JSON.parse(SecretString))
    .map(([key, value]) => `${key}=${value}`)

    .join('\n')
  fs.writeFileSync(envPath, envContent)
}

async function getSyncInfo () {
  const client = new DynamoDBClient({ region: 'ap-northeast-2' })
  const command = new ScanCommand({
    TableName: 'syncenv'
  })

  const { Items } = await client.send(command)
  return Items
}

export default sync
