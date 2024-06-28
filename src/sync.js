import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'

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

  for (const { key, path, region } of envData) {
    console.log(`Syncing ${key} to ${path}`)
    const secrets = await getSecretValues(region, key)
    const envContent = Object.entries(secrets)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    fs.writeFileSync(path, envContent)
  }

  console.log('동기화 완료!')
}

async function getSecretValues (region, SecretId) {
  const client = new SecretsManagerClient({ region })
  const command = new GetSecretValueCommand({ SecretId })
  const { SecretString } = await client.send(command)
  return JSON.parse(SecretString)
}

export default sync
