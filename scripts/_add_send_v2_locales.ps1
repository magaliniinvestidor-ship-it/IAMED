$files = @("pt-BR","pt-PT","en","es","es-AR","es-PY")
$vals = @{
  "pt-BR" = @{
    presc_send_done                  = "Enviado"
    presc_send_close_hint            = "Feche quando terminar os envios."
    presc_patient_name               = "Nome Completo:"
    presc_patient_birthdate          = "Data Nasc.:"
    presc_patient_doc_type           = "Tipo Doc."
    presc_patient_doc_number         = "Nº Doc."
    presc_prescription_type_controlado = "Controlado"
    presc_prescription_type_comum     = "Comum"
  }
  "pt-PT" = @{
    presc_send_done                  = "Enviado"
    presc_send_close_hint            = "Feche quando terminar os envios."
    presc_patient_name               = "Nome Completo:"
    presc_patient_birthdate          = "Data Nasc.:"
    presc_patient_doc_type           = "Tipo Doc."
    presc_patient_doc_number         = "Nº Doc."
    presc_prescription_type_controlado = "Controlado"
    presc_prescription_type_comum     = "Comum"
  }
  "en"    = @{
    presc_send_done                  = "Sent"
    presc_send_close_hint            = "Close when done sending."
    presc_patient_name               = "Full Name:"
    presc_patient_birthdate          = "Birthdate:"
    presc_patient_doc_type           = "Doc. Type"
    presc_patient_doc_number         = "Doc. Number"
    presc_prescription_type_controlado = "Controlled"
    presc_prescription_type_comum     = "Common"
  }
  "es"    = @{
    presc_send_done                  = "Enviado"
    presc_send_close_hint            = "Cierre cuando termine los envios."
    presc_patient_name               = "Nombre Completo:"
    presc_patient_birthdate          = "F. Nac.:"
    presc_patient_doc_type           = "Tipo Doc."
    presc_patient_doc_number         = "Nº Doc."
    presc_prescription_type_controlado = "Controlado"
    presc_prescription_type_comum     = "Comun"
  }
  "es-AR" = @{
    presc_send_done                  = "Enviado"
    presc_send_close_hint            = "Cierre cuando termine los envios."
    presc_patient_name               = "Nombre Completo:"
    presc_patient_birthdate          = "F. Nac.:"
    presc_patient_doc_type           = "Tipo Doc."
    presc_patient_doc_number         = "Nº Doc."
    presc_prescription_type_controlado = "Controlado"
    presc_prescription_type_comum     = "Comun"
  }
  "es-PY" = @{
    presc_send_done                  = "Enviado"
    presc_send_close_hint            = "Cierre cuando termine los envios."
    presc_patient_name               = "Nombre Completo:"
    presc_patient_birthdate          = "F. Nac.:"
    presc_patient_doc_type           = "Tipo Doc."
    presc_patient_doc_number         = "Nº Doc."
    presc_prescription_type_controlado = "Controlado"
    presc_prescription_type_comum     = "Comun"
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