import * as React from "react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import {
  FEATURES,
  loadSettings,
  parseSettings,
  saveSettings,
  type ExtensionSettings,
  type FeatureId,
} from "@/lib/settings"

export function openTimeOutFormPage(): void {
  void chrome.tabs.create({ url: chrome.runtime.getURL("timeout.html") })
}

export function PopupApp() {
  const [settings, setSettings] = React.useState<ExtensionSettings | null>(null)

  React.useEffect(() => {
    void loadSettings().then(setSettings)
  }, [])

  const persist = React.useCallback(async (next: ExtensionSettings) => {
    const parsed = parseSettings(next)
    setSettings(parsed)
    await saveSettings(parsed)
  }, [])

  const setFeature = React.useCallback(
    (id: FeatureId, enabled: boolean) => {
      if (!settings) return
      void persist({
        ...settings,
        features: { ...settings.features, [id]: enabled },
      })
    },
    [persist, settings],
  )

  if (!settings) {
    return (
      <div className="w-80 bg-background px-4 py-3 text-sm text-muted-foreground">
        Loading…
      </div>
    )
  }

  return (
    <div className="w-80 bg-background text-foreground">
      <header className="px-4 py-3">
        <h1 className="text-sm font-medium">Settings</h1>
      </header>
      <Separator />
      <ul>
        {FEATURES.map((feature, index) => (
          <li key={feature.id}>
            {index ? <Separator /> : null}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5">
              <Label htmlFor={`feature-${feature.id}`}>
                {feature.label}
              </Label>
              <Switch
                checked={settings.features[feature.id]}
                id={`feature-${feature.id}`}
                onCheckedChange={(checked) => setFeature(feature.id, checked)}
              />
            </div>
            {feature.id === "time-out" ? (
              <div className="px-4 pb-2.5">
                <Button
                  onClick={openTimeOutFormPage}
                  size="sm"
                  type="button"
                  variant="ghost"
                >
                  Edit form values
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  )
}
