// @ts-ignore
import words from 'an-array-of-english-words'
import { Context, Schema } from 'koishi'
import { Stream } from 'stream'
import { extract } from 'tar'
import diff from 'lodash.difference'
import { StringWritable } from './stream'

export const Config: Schema<{}> = Schema.object({})

export const name = 'npm-unused'

export async function apply(ctx: Context) {
  const http = ctx.http.extend({
    endpoint: 'https://registry.npmmirror.com',
  })
  const { versions } = await http.get('/all-the-package-names')
  const latest: string = (Object.values(versions) as any[]).at(-1).dist.tarball
  const stream: Stream = await ctx.http.get(latest, { responseType: 'stream' })
  const writable = new StringWritable()
  stream.pipe(extract({
    transform(entry) {
      if (entry.path !== 'package/names.json') return
      return writable
    }
  }))
  const names: string[] = JSON.parse(await writable.promise)
  const unused = diff(words, names)
  
}