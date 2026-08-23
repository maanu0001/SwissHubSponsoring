import { hexToRgbChannels, isHexColor, readableForeground } from '@/lib/color'
import { settingDefault, type SettingsMap } from '@/lib/settings'

/**
 * Injects the brand colours as CSS custom properties.
 * Rendering this server side means the correct palette is present on the very
 * first paint – there is no flash of the default red.
 */
export function ThemeStyle({ settings }: { settings: SettingsMap }) {
  const primaryRaw = settings['brand.primaryColor'] ?? ''
  const secondaryRaw = settings['brand.secondaryColor'] ?? ''

  const primary = isHexColor(primaryRaw) ? primaryRaw : settingDefault('brand.primaryColor')
  const secondary = isHexColor(secondaryRaw) ? secondaryRaw : settingDefault('brand.secondaryColor')

  const css = `:root{--c-brand:${hexToRgbChannels(primary)};--c-accent:${hexToRgbChannels(
    secondary,
    '232 80 86',
  )};--c-brand-fg:${readableForeground(primary)};}`

  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
