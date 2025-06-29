import { ClipboardError, ClipboardService } from '@domain/clipboard/ClipboardService.ts'
import { Effect, Layer } from 'effect'

export class LinuxClipboardService implements ClipboardService {
  readonly writeText = (text: string) =>
    Effect.gen(function* () {
      yield* Effect.tryPromise({
        try: async () => {
          // Use echo and xsel to write to clipboard
          const proc = Bun.spawn(
            ['sh', '-c', `echo ${JSON.stringify(text)} | xsel -b`],
            {
              stdout: 'pipe',
              stderr: 'pipe',
            },
          )

          await proc.exited

          if (proc.exitCode !== 0) {
            const error = await new Response(proc.stderr).text()
            throw new Error(`xsel failed with exit code ${proc.exitCode}: ${error}`)
          }
        },
        catch: (error) => new ClipboardError('Failed to write to clipboard', error),
      })
    })

  readonly readText = Effect.tryPromise({
    try: async () => {
      // Use xsel to read from clipboard
      const proc = Bun.spawn(['xsel', '-b'], {
        stdout: 'pipe',
      })

      const output = await new Response(proc.stdout).text()
      await proc.exited

      if (proc.exitCode !== 0) {
        throw new Error(`xsel failed with exit code ${proc.exitCode}`)
      }

      return output
    },
    catch: (error) => new ClipboardError('Failed to read from clipboard', error),
  })
}

export const LinuxClipboardServiceLayer = Layer.succeed(
  ClipboardService,
  new LinuxClipboardService(),
)
