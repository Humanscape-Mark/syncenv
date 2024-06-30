import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'

const syncEnvFilePath = path.join(process.cwd(), '.syncenv')

const reset = async () => {
  const answers = await inquirer.prompt([
    {
      name: 'confirm',
      type: 'confirm',
      message: '정말 초기화 하시겠습니까?'
    }
  ])

  if (!answers.confirm) {
    console.log('초기화를 취소합니다.')
    return
  }

  if (fs.existsSync(syncEnvFilePath)) {
    fs.unlinkSync(syncEnvFilePath)
    console.log('.syncenv 파일이 삭제되었습니다.')
  } else {
    console.log('.syncenv 파일이 존재하지 않습니다.')
  }
}

export default reset
