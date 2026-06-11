// 模拟磁盘数据结构 (未来可替换为 IndexedDB)
const diskSpace: Record<string, any> = {
  'C:/Users/Public/Desktop': [
    { name: '我的电脑', type: 'system', appId: 'explorer', path: 'C:/' },
    { name: 'README.txt', type: 'file', appId: 'notepad', content: '欢迎使用 Vue OS!' }
  ]
}

export const fs = {
  // 异步读取目录
  async readDir(path: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (diskSpace[path]) {
          resolve(diskSpace[path])
        } else {
          reject(new Error('Directory not found'))
        }
      }, 150) // 模拟 150ms I/O 延迟
    })
  },

  // 异步读取文件
  async readFile(path: string, fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const dir = diskSpace[path]
        if (!dir) return reject(new Error('Path not found'))
        const file = dir.find((f: any) => f.name === fileName)
        if (file && file.type === 'file') {
          resolve(file.content || '')
        } else {
          reject(new Error('File not found'))
        }
      }, 100)
    })
  }
}
