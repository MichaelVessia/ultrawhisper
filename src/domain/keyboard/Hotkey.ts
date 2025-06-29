import { Data } from 'effect'

export class Hotkey extends Data.Class<{
  readonly key: string
  readonly modifiers: ReadonlyArray<'ctrl' | 'alt' | 'shift' | 'meta'>
  readonly action: string
}> {
  static fromString(str: string): Hotkey {
    const parts = str.toLowerCase().split('+')
    const key = parts[parts.length - 1]!
    const modifiers = parts.slice(0, -1) as Array<'ctrl' | 'alt' | 'shift' | 'meta'>

    return new Hotkey({
      key,
      modifiers,
      action: 'default',
    })
  }

  toString(): string {
    return [...this.modifiers, this.key].join('+')
  }
}
