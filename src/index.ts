// @ts-ignore
import words from 'an-array-of-english-words'
import { createGunzip } from 'zlib'
import { Context, Schema } from 'koishi'
import { Stream } from 'stream'
import tar from 'tar-stream'
import diff from 'lodash.difference'
import sample from 'lodash.sample'
import { DummyWriter } from './stream'
import {} from '@koishijs/translator'

export const Config: Schema<{}> = Schema.object({})

export const name = 'npm-unused'

export function apply(ctx: Context) {
  let unused: string[]
  getUnused(ctx).then(result => unused = result)
  ctx.command('npmunused', '随机一个 npm 上尚未被占用的英文单词包名')
    .option('raw', '-r 仅输出单词')
    .action(async ({ options }) => {
      if (!unused) {
        return '插件加载中，请稍后重试。'
      }
      const word = sample(unused)
      if (options.raw) return word
      if (ctx.translator) {
        const translated = await ctx.translator.translate({ input: word })
        return `随机到未使用包名: ${word}\n翻译: ${translated}`
      }
      return `随机到未使用包名: ${word}`
    })
}

async function getUnused(ctx: Context): Promise<string[]> {
  const http = ctx.http.extend({
    endpoint: 'https://registry.npmmirror.com',
  })
  const { versions } = await http.get('/all-the-package-names')
  const latest: string = (Object.values(versions) as any[]).at(-1).dist.tarball
  const stream: Stream = await ctx.http.get(latest, { responseType: 'stream' })
  const writer = new DummyWriter()
  const extract = tar.extract()
  extract.on('entry', (headers, stream, next) => {
    if (headers.name !== `package/names.json`) {
      stream.on('end', next)
      stream.resume()
      return
    }
    stream.on('end', () => {
      writer.end()
    })
    stream.pipe(writer)
  })
  stream.pipe(createGunzip()).pipe(extract)
  const names: string[] = JSON.parse((await writer.promise).toString())
  return diff(words, names)
}