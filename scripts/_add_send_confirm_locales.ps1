$files = @("pt-BR","pt-PT","en","es","es-AR","es-PY")
$vals = @{
  "pt-BR" = @{ presc_send_confirm_whatsapp = "Confirma o envio da receita por WhatsApp?"; presc_send_confirm_email = "Confirma o envio da receita por E-mail?" }
  "pt-PT" = @{ presc_send_confirm_whatsapp = "Confirma o envio da receita por WhatsApp?"; presc_send_confirm_email = "Confirma o envio da receita por E-mail?" }
  "en"    = @{ presc_send_confirm_whatsapp = "Confirm sending the prescription via WhatsApp?"; presc_send_confirm_email = "Confirm sending the prescription via Email?" }
  "es"    = @{ presc_send_confirm_whatsapp = "Confirmar el envio de la receta por WhatsApp?"; presc_send_confirm_email = "Confirmar el envio de la receta por Correo?" }
  "es-AR" = @{ presc_send_confirm_whatsapp = "Confirmar el envio de la receta por WhatsApp?"; presc_send_confirm_email = "Confirmar el envio de la receta por Correo?" }
  "es-PY" = @{ presc_send_confirm_whatsapp = "Confirmar el envio de la receta por WhatsApp?"; presc_send_confirm_email = "Confirmar el envio de la receta por Correo?" }
}
foreach ($f in $files) {
  $path = "lib\i18n\locales\$f.json"
  $raw = [System.IO.File]::ReadAllText($path)
  $insert = ""
  foreach ($k in @('presc_send_confirm_whatsapp','presc_send_confirm_email')) {
    if ($raw -match ("`"" + $k + "`"")) { continue }
    $insert += "`n  `"$k`": `"$($vals[$f][$k])`","
  }
  if ($insert -eq "") { Write-Output ("{0}: ja existem" -f $f); continue }
  $anchor = '"presc_send_success"'
  $idx = $raw.IndexOf($anchor)
  if ($idx -lt 0) { Write-Output ("{0}: anchor NAO encontrado" -f $f); continue }
  $lineEnd = $raw.IndexOf("`n", $idx)
  $raw = $raw.Substring(0, $lineEnd) + $insert + $raw.Substring($lineEnd)
  [System.IO.File]::WriteAllText($path, $raw, (New-Object System.Text.UTF8Encoding $false))
  Write-Output ("{0}: OK" -f $f)
}