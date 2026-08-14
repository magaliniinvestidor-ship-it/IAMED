$files = @("pt-BR","pt-PT","en","es","es-AR","es-PY")
$vals = @{
  "pt-BR" = @{
    presc_send_no_email       = "sem email cadastrado"
    presc_send_phone_label    = "Telefone"
    presc_send_email_label    = "E-mail"
    presc_send_title          = "Enviar Receita"
    presc_signed_locked       = "Assinado"
    presc_header_city         = "Cidade"
  }
  "pt-PT" = @{
    presc_send_no_email       = "sem email cadastrado"
    presc_send_phone_label    = "Telefone"
    presc_send_email_label    = "E-mail"
    presc_send_title          = "Enviar Receita"
    presc_signed_locked       = "Assinado"
    presc_header_city         = "Cidade"
  }
  "en"    = @{
    presc_send_no_email       = "no email registered"
    presc_send_phone_label    = "Phone"
    presc_send_email_label    = "Email"
    presc_send_title          = "Send Prescription"
    presc_signed_locked       = "Signed"
    presc_header_city         = "City"
  }
  "es"    = @{
    presc_send_no_email       = "sin email registrado"
    presc_send_phone_label    = "Telefono"
    presc_send_email_label    = "Correo"
    presc_send_title          = "Enviar Receta"
    presc_signed_locked       = "Firmada"
    presc_header_city         = "Ciudad"
  }
  "es-AR" = @{
    presc_send_no_email       = "sin email registrado"
    presc_send_phone_label    = "Telefono"
    presc_send_email_label    = "Correo"
    presc_send_title          = "Enviar Receta"
    presc_signed_locked       = "Firmada"
    presc_header_city         = "Ciudad"
  }
  "es-PY" = @{
    presc_send_no_email       = "sin email registrado"
    presc_send_phone_label    = "Telefono"
    presc_send_email_label    = "Correo"
    presc_send_title          = "Enviar Receta"
    presc_signed_locked       = "Firmada"
    presc_header_city         = "Ciudad"
  }
}
foreach ($f in $files) {
  $path = "lib\i18n\locales\$f.json"
  $raw = [System.IO.File]::ReadAllText($path)
  $insert = ""
  foreach ($k in $vals[$f].Keys) {
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