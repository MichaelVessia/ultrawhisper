import { Brand } from 'effect'

export type FilePath = string & Brand.Brand<'FilePath'>
export const FilePath = Brand.nominal<FilePath>()

export type AudioFormat = 'wav' | 'mp3' | 'ogg'

export type Milliseconds = number & Brand.Brand<'Milliseconds'>
export const Milliseconds = Brand.nominal<Milliseconds>()

export type Seconds = number & Brand.Brand<'Seconds'>
export const Seconds = Brand.nominal<Seconds>()

export const toMilliseconds = (seconds: Seconds): Milliseconds => Milliseconds(seconds * 1000)

export const toSeconds = (milliseconds: Milliseconds): Seconds => Seconds(milliseconds / 1000)
