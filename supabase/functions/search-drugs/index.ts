import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { query, source, limit = 10 } = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Buscar no catálogo local primeiro
    let localQuery = supabase
      .from("drug_catalog")
      .select("*")
      .or(`name.ilike.%${query}%,active_ingredient.ilike.%${query}%,name_es.ilike.%${query}%,name_pt.ilike.%${query}%,name_en.ilike.%${query}%`)
      .order("name")
      .limit(limit);

    if (source && source !== "all") {
      localQuery = localQuery.eq("source", source);
    }

    const { data: localResults } = await localQuery;

    // Se encontrou resultados locais, retornar
    if (localResults && localResults.length >= limit) {
      return new Response(JSON.stringify({ results: localResults, source: "local" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se não, buscar na API da FDA
    const fdaResults = [];
    try {
      const fdaUrl = `https://api.fda.gov/drug/drugsfda.json?search=openfda.brand_name:"${encodeURIComponent(query)}"+OR+openfda.generic_name:"${encodeURIComponent(query)}"&limit=${limit}`;
      const fdaResp = await fetch(fdaUrl);
      const fdaData = await fdaResp.json();

      if (fdaData.results) {
        for (const r of fdaData.results) {
          const brand = r.openfda?.brand_name?.[0] ?? "";
          const generic = r.openfda?.generic_name?.[0] ?? "";
          const route = r.openfda?.route?.[0]?.toLowerCase() ?? "oral";
          const manufacturer = r.openfda?.manufacturer_name?.[0] ?? "";
          const substance = r.openfda?.substance_name?.join(", ") ?? generic;
          const pkgCode = r.spl_product_data_elements?.[0]?.description?.[0]?.description ?? "";

          fdaResults.push({
            id: `fda_${r.application_number?.replace(/\s/g, "_") ?? Date.now()}`,
            name: brand || generic,
            active_ingredient: generic,
            presentation: pkgCode || "N/D",
            manufacturer,
            category: r.openfda?.pharm_class_epc?.[0] ?? "Medicamento",
            controlled_category: "comum",
            requires_prescription: r.products?.[0]?.reference_drug ?? false,
            min_age_months: 0,
            pregnant_category: "B",
            breastfeeding_safe: true,
            common_dose_adult: "Consulte bula",
            common_dose_pediatric: "",
            route,
            contraindications: [],
            side_effects: [],
            interactions: [],
            source: "fda",
            source_id: r.application_number ?? "",
            country: "US",
            registration_number: r.application_number ?? "",
            name_es: brand || generic,
            name_pt: generic,
            name_en: brand || generic,
            default_dosage: "",
            default_frequency: "",
            default_duration: "",
          });
        }
      }
    } catch (_e) {
      // FDA API falhou, ignorar
    }

    // Combinar resultados locais + FDA
    const combined = [...(localResults || []), ...fdaResults].slice(0, limit);

    return new Response(JSON.stringify({ results: combined, source: combined.length > 0 ? "combined" : "none" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
