import 'server-only'

import type { Media } from '@prisma/client'

import { prisma } from './db'
import { SETTING_DEFINITIONS, getSettings, type SettingDefinition } from './settings'

export interface SettingsGroupData {
  definitions: SettingDefinition[]
  values: Record<string, string>
  mediaById: Record<string, Media>
}

/** Load one settings group together with every referenced media record. */
export async function loadSettingsGroup(group: SettingDefinition['group']): Promise<SettingsGroupData> {
  const definitions = SETTING_DEFINITIONS.filter((definition) => definition.group === group)
  const values = await getSettings()

  const mediaIds = definitions
    .filter((definition) => definition.type === 'MEDIA')
    .map((definition) => values[definition.key])
    .filter((value): value is string => Boolean(value))

  const media = mediaIds.length ? await prisma.media.findMany({ where: { id: { in: mediaIds } } }) : []

  return {
    definitions,
    values,
    mediaById: Object.fromEntries(media.map((entry) => [entry.id, entry])),
  }
}
