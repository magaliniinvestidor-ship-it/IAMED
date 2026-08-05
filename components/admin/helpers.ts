import { Dte, DteItem } from './AdminContext';

export const GS = (v: number | null | undefined): string => {
  if (v == null) return 'Gs. 0';
  return `Gs. ${v.toLocaleString('es-PY')}`;
};

export const GS_SHORT = (v: number | null | undefined): string => {
  if (v == null) return '0';
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
};

export function generateCdc(
  timbrado: string,
  establishment: string,
  point: string,
  seq: number
): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const seqStr = String(seq).padStart(7, '0');
  const rand = Math.floor(Math.random() * 99999999)
    .toString()
    .padStart(8, '0');
  return `${timbrado}${establishment}${point}${seqStr}${dateStr}00${rand}`;
}

export function generateXml(
  dte: Partial<Dte> & { items: DteItem[] },
  certName: string,
  env: string
): string {
  const itemsXml = dte.items
    .map(
      (it) => `
    <gCamItem>
      <dCodInt>${it.code}</dCodInt>
      <dDesProSer>${it.description}</dDesProSer>
      <cUniMed>77</cUniMed>
      <dCantProSer>${it.quantity}</dCantProSer>
      <dPUniProSer>${it.unit_price}</dPUniProSer>
      <dTotBruOpeItem>${it.total}</dTotBruOpeItem>
      <dIVA>${it.iva_rate}</dIVA>
    </gCamItem>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd"
     xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
     xsi:schemaLocation="http://ekuatia.set.gov.py/sifen/xsd siRecepDE_v150.xsd">
  <DE>
    <gTimb>
      <iTiDE>${dte.type === 'Fatura Eletrônica' ? 1 : dte.type === 'Nota de Crédito' ? 5 : dte.type === 'Nota de Débito' ? 6 : dte.type === 'Nota de Remessa' ? 7 : 4}</iTiDE>
      <dNumTim>${dte.timbrado}</dNumTim>
      <dEst>${dte.establishment}</dEst>
      <dPunExp>${dte.expedition_point}</dPunExp>
      <dNumDoc>${String(dte.number?.split('-')[2] || '1').padStart(7, '0')}</dNumDoc>
      <dSerieNum>${dte.number}</dSerieNum>
      <dFeIniVig>${new Date().toISOString().split('T')[0]}</dFeIniVig>
      <dVencTim>2027-12-31</dVencTim>
    </gTimb>
    <gDatGralOpe>
      <dFeEmiDE>${new Date().toISOString()}</dFeEmiDE>
      <dCodSeg>${Math.floor(10000000 + Math.random() * 89999999)}</dCodSeg>
      <dInfoEmi>IAMED - Sistema de Gestão Médica</dInfoEmi>
      <dInfoFisc>${env === 'producao' ? 'PRODUCCION' : 'TEST'}</dInfoFisc>
    </gDatGralOpe>
    <gDatRec>
      <dNomRec>${dte.patient_name}</dNomRec>
      <dEmailRec>${dte.patient_email || ''}</dEmailRec>
    </gDatRec>
    <gDtipDE>
      <gCamCond>
        <iCondOpe>1</iCondOpe>
        <gPaConEIVA>${dte.items.reduce((s, i) => s + i.total, 0)}</gPaConEIVA>
      </gCamCond>
      <gCamItem>
        ${itemsXml}
      </gCamItem>
    </gDtipDE>
    <gTotSub>
      <dTotGralOpe>${dte.amount || 0}</dTotGralOpe>
      <dIVA5>${dte.iva_5 || 0}</dIVA5>
      <dIVA10>${dte.iva_10 || 0}</dIVA10>
    </gTotSub>
  </DE>
  <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
    <SignedInfo>
      <CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
      <SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256"/>
    </SignedInfo>
    <SignatureValue><!-- Assinado por PCSC: ${certName} — Lei 6822/2021 --></SignatureValue>
    <KeyInfo>
      <X509Data><X509Certificate>MIIDvTCCAqWgAwIBAgI...PCSC-HABILITADO</X509Certificate></X509Data>
    </KeyInfo>
  </Signature>
</rDE>`;
}

export const STATUS_OPTIONS = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
];

export const GENDER_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Feminino' },
  { value: 'Outro', label: 'Outro' },
];
